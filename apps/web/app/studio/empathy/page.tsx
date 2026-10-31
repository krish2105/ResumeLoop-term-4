"use client";
import {useState} from 'react';
import {AiBadge} from '@/components/AiBadge';
import {PageHead} from '@/components/AppShell';
import {FictionBanner, Msg, useStudio} from '@/components/StudioBits';
import fixtures from '@/demo/fixtures.json';
import {DEMO} from '@/lib/client';
import {CATEGORIES, studio, type Item} from '@/lib/studio';

const DEMO_INSIGHT = ((fixtures.recorded_ai as unknown as {hmw_insights?: string[]}).hmw_insights || [''])[0];

const MAP: [string, string][] = [['says', 'Says'], ['does', 'Does'], ['thinks', 'Thinks (interpretation)'], ['feels', 'Feels (in their words)']];

export default function EmpathyPage() {
  const s = useStudio();
  const notes = s.of('notes');
  const [selected, setSelected] = useState<string | null>(null);
  const note = notes.find(n => n.id === selected) || notes[0];
  const codes = note ? s.of('codes', note.id) : [];
  const accepted = s.of('codes').filter(c => c.status === 'accepted');
  const themes = s.of('themes');
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{mode: string; model: string | null; recorded_at?: string; rejected: number; message?: string} | null>(null);
  const [form, setForm] = useState({participant_code: 'P01', context: '', text: '', participation: false, anonymised_notes: false, quotes: false});
  const [code, setCode] = useState({label: '', quote: '', category: 'says'});
  // In the public demo, start from the insight whose How might we suggestions were recorded.
  const [theme, setTheme] = useState({title: DEMO ? 'Conflicting sources of truth' : '', insight: DEMO ? DEMO_INSIGHT : ''});
  const codeOwner = (c: Item) => notes.find(n => n.id === c.parent_id)?.participant_code || '?';

  const addNote = () => {
    if (!form.participation) { s.setMsg('Record participation consent before saving a note.'); return; }
    s.run(() => studio.create('notes', {participant_code: form.participant_code, context: form.context, text: form.text,
      consent: {participation: form.participation, anonymised_notes: form.anonymised_notes, quotes: form.quotes}, synthetic: false}), 'Note saved.')
      .then(ok => ok && setForm(f => ({...f, text: '', context: ''})));
  };
  const suggest = async () => {
    if (!note) return;
    setBusy(true); setAi(null);
    await s.run(async () => { const r = await studio.suggestCodes(note.id); setAi(r); });
    setBusy(false);
  };
  return <>
    <PageHead eyebrow="Design studio · weeks 2–5" title="Empathy studio" intro="Turn consented, anonymised observation notes into codes, an empathy map and themes. The local AI can suggest codes, but each one must quote the note exactly and stays a suggestion until you accept it." />
    <Msg text={s.msg} />
    <FictionBanner items={s.items} />
    {!s.loading && notes.length === 0 && <section className="panel"><h2>Start with your first note</h2>
      <p>Add an anonymised note from a real, consented session below, or load fictional examples to see how the studio works.</p>
      <button className="outlineBtn" onClick={() => s.run(() => studio.loadExamples(), 'Fictional examples loaded. They are labelled and are not research data.')}>Load fictional examples</button></section>}

    <div className="twoCol">
      <section className="panel" aria-labelledby="notes-h">
        <h2 id="notes-h">Notes ({notes.length})</h2>
        <div className="noteTabs" role="tablist">{notes.map(n => <button key={n.id} role="tab" aria-selected={note?.id === n.id} className={'chipBtn' + (note?.id === n.id ? ' on' : '')} onClick={() => { setSelected(n.id); setAi(null); }}>{n.participant_code}{n.synthetic ? ' · fictional' : ''}</button>)}</div>
        {note && <article className="noteCard">
          <p className="muted">{note.participant_code} · {note.context || 'no context'} · consent: notes {note.consent?.anonymised_notes ? 'yes' : 'no'}, quotes {note.consent?.quotes ? 'yes' : 'no'}</p>
          <p className="noteText">{note.text}</p>
          <div className="detailActions">
            <button className="primaryBtn" onClick={suggest} disabled={busy}>{busy ? 'The local model is reading…' : 'Suggest codes with AI'}</button>
            <button className="textBtn" onClick={() => { if (confirm('Delete this note and its codes?')) s.run(() => studio.remove('notes', note.id), 'Note deleted.'); }}>Delete note</button>
          </div>
          {ai && <p className="muted"><AiBadge mode={ai.mode} model={ai.model} recordedAt={ai.recorded_at} /> {ai.message || `${ai.rejected} suggestion${ai.rejected === 1 ? '' : 's'} rejected automatically (quote not in the note or bad category).`}</p>}
          <h3>Codes for this note</h3>
          {codes.length === 0 ? <p className="empty">No codes yet.</p> : <ul className="codeList">{codes.map(c => <li key={c.id} className={'code ' + c.status}>
            <div><span className={'cat ' + c.category}>{c.category}</span> <strong>{c.label}</strong> {c.origin === 'ai' && <span className="chip">AI suggestion</span>}<blockquote>“{c.quote}”</blockquote></div>
            <div className="rowActions">{c.status === 'suggested' ? <>
              <button className="primaryBtn" onClick={() => s.run(() => studio.update('codes', c.id, {status: 'accepted'}))}>Accept</button>
              <button className="outlineBtn" onClick={() => s.run(() => studio.update('codes', c.id, {status: 'rejected'}))}>Reject</button></>
              : <span className={'status ' + (c.status === 'accepted' ? 'approved' : 'rejected')}>{c.status}</span>}
              {c.status === 'accepted' && <select aria-label="Theme" value={c.theme_id || ''} onChange={e => s.run(() => studio.update('codes', c.id, {theme_id: e.target.value || null}))}>
                <option value="">No theme</option>{themes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select>}</div>
          </li>)}</ul>}
          <details><summary>Add a code by hand</summary>
            <div className="formGrid">
              <label>Label<input value={code.label} onChange={e => setCode({...code, label: e.target.value})} /></label>
              <label>Category<select value={code.category} onChange={e => setCode({...code, category: e.target.value})}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
              <label className="wide">Exact quote from the note<input value={code.quote} onChange={e => setCode({...code, quote: e.target.value})} /></label>
            </div>
            <button className="outlineBtn" onClick={() => s.run(() => studio.create('codes', {...code, status: 'accepted', origin: 'human'}, note.id), 'Code added.').then(ok => ok && setCode({label: '', quote: '', category: 'says'}))}>Add code</button>
          </details>
        </article>}
      </section>

      <section className="panel" aria-labelledby="map-h">
        <h2 id="map-h">Empathy map ({accepted.length} accepted codes)</h2>
        <div className="empathyMap">{MAP.map(([cat, label]) => <div key={cat} className="quad"><h3>{label}</h3>
          <ul>{accepted.filter(c => c.category === cat).map(c => <li key={c.id}>“{c.quote}” <small>{codeOwner(c)}</small></li>)}</ul>
          {!accepted.some(c => c.category === cat) && <p className="muted">Nothing yet</p>}</div>)}</div>
        <h3>Needs</h3>
        <ul className="needs">{accepted.filter(c => c.category === 'need').map(c => <li key={c.id}>{c.label}: “{c.quote}” <small>{codeOwner(c)}</small></li>)}</ul>
        <h3>Themes</h3>
        <ul className="themeList">{themes.map(t => <li key={t.id}><strong>{t.title}</strong> <small>{accepted.filter(c => c.theme_id === t.id).length} codes</small><p>{t.insight}</p></li>)}</ul>
        <div className="formGrid">
          <label>Theme title<input value={theme.title} onChange={e => setTheme({...theme, title: e.target.value})} placeholder="Conflicting sources of truth" /></label>
          <label className="wide">Insight<input value={theme.insight} onChange={e => setTheme({...theme, insight: e.target.value})} placeholder="Returning learners lose time reconciling sources that disagree" /></label>
        </div>
        <button className="outlineBtn" onClick={() => s.run(() => studio.create('themes', theme), 'Theme created.').then(ok => ok && setTheme({title: '', insight: ''}))}>Create theme</button>
      </section>
    </div>

    <section className="panel" aria-labelledby="add-h">
      <h2 id="add-h">Add a research note</h2>
      <p>Use participant codes only (P01, P02…). Remove names, emails, phone numbers and anything about other people.</p>
      <div className="formGrid">
        <label>Participant code<input value={form.participant_code} onChange={e => setForm({...form, participant_code: e.target.value})} /></label>
        <label className="wide">Context<input value={form.context} onChange={e => setForm({...form, context: e.target.value})} placeholder="Evening learner, phone, 25-minute interview" /></label>
        <label className="wide">Anonymised note<textarea rows={4} value={form.text} onChange={e => setForm({...form, text: e.target.value})} /></label>
      </div>
      <fieldset className="consent"><legend>Consent recorded with the participant</legend>
        <label className="checkRow"><input type="checkbox" checked={form.participation} onChange={e => setForm({...form, participation: e.target.checked})} /> Agreed to take part</label>
        <label className="checkRow"><input type="checkbox" checked={form.anonymised_notes} onChange={e => setForm({...form, anonymised_notes: e.target.checked})} /> Agreed to anonymised note analysis (needed for AI suggestions)</label>
        <label className="checkRow"><input type="checkbox" checked={form.quotes} onChange={e => setForm({...form, quotes: e.target.checked})} /> Agreed to anonymous quotation</label>
      </fieldset>
      <button className="primaryBtn" onClick={addNote}>Save note</button>
      {notes.some(n => n.synthetic) && <button className="textBtn" onClick={() => s.run(() => studio.clearExamples(), 'Fictional examples removed.')}>Remove fictional examples</button>}
    </section>
  </>;
}
