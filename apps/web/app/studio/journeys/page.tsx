"use client";
import {useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio, type Item} from '@/lib/studio';

type Stage = {name: string; doing: string; thinking: string; feeling: number; pain: string; opportunity: string};
const blank = (name: string): Stage => ({name, doing: '', thinking: '', feeling: 3, pain: '', opportunity: ''});
const START = ['Return', 'Work out what changed', 'Check the deadline', 'Start a task', 'Pause and resume'].map(blank);
const FEEL = ['', 'Very low', 'Low', 'Neutral', 'Good', 'Very good'];

export default function JourneysPage() {
  const s = useStudio();
  const maps = s.of('journeys');
  const personas = s.of('personas');
  const [kind, setKind] = useState<'current' | 'future'>('current');
  const [title, setTitle] = useState('');
  const [persona, setPersona] = useState('');
  const [note, setNote] = useState('');
  const [stages, setStages] = useState<Stage[]>(START);
  const set = (i: number, patch: Partial<Stage>) => setStages(x => x.map((st, k) => k === i ? {...st, ...patch} : st));
  return <>
    <PageHead art="stop-prototype" eyebrow="Design studio · weeks 6–7, journeys" title="Journey maps" intro="Map today's return journey from evidence, then the future journey you are designing. The stage names are hypotheses: rename, add or remove them with participants." />
    <Msg text={s.msg} />
    <section className="panel" aria-labelledby="new-j">
      <h2 id="new-j">New journey map</h2>
      <div className="formGrid">
        <label>Type<select value={kind} onChange={e => setKind(e.target.value as 'current' | 'future')}><option value="current">Current (as is, from evidence)</option><option value="future">Future (design idea)</option></select></label>
        <label>Persona<select value={persona} onChange={e => setPersona(e.target.value)}><option value="">None</option>{personas.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label className="wide">Title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Returning after a missed session, today" /></label>
        <label className="wide">Evidence behind it<input value={note} onChange={e => setNote(e.target.value)} placeholder="P01–P04 notes and two observations" /></label>
      </div>
      <div className="journeyGrid" role="group" aria-label="Stages">{stages.map((st, i) => <div key={i} className="stage">
        <label className="sr-only" htmlFor={'sn' + i}>Stage {i + 1} name</label>
        <input id={'sn' + i} value={st.name} onChange={e => set(i, {name: e.target.value})} />
        {(['doing', 'thinking', 'pain', 'opportunity'] as const).map(f => <label key={f} className="stageField">{f === 'pain' ? 'Pain point' : f[0].toUpperCase() + f.slice(1)}
          <textarea rows={2} value={st[f]} onChange={e => set(i, {[f]: e.target.value})} /></label>)}
        <label className="stageField">Feeling: {FEEL[st.feeling]}<input type="range" min={1} max={5} step={1} value={st.feeling} onChange={e => set(i, {feeling: Number(e.target.value)})} /></label>
        <button className="textBtn" disabled={stages.length <= 1} onClick={() => setStages(x => x.filter((_, k) => k !== i))}>Remove stage</button>
      </div>)}</div>
      <div className="detailActions">
        <button className="outlineBtn" disabled={stages.length >= 10} onClick={() => setStages(x => [...x, blank('New stage')])}>Add stage</button>
        <button className="primaryBtn" onClick={() => s.run(() => studio.create('journeys', {title, phase: kind, persona_id: persona || null, stages, evidence_note: note}), 'Journey map saved.')
          .then(ok => { if (ok) { setTitle(''); setNote(''); setStages(START); } })}>Save journey map</button>
      </div>
    </section>
    {(['current', 'future'] as const).map(k => <section key={k} className="panel sectionGap" aria-label={k === 'current' ? 'Current journeys' : 'Future journeys'}>
      <h2>{k === 'current' ? 'Current journeys (as is)' : 'Future journeys (design ideas)'}</h2>
      {maps.filter(m => m.phase === k).length === 0 && <p className="empty">None yet.</p>}
      {maps.filter(m => m.phase === k).map(m => <JourneyView key={m.id} m={m} persona={personas.find(p => p.id === m.persona_id)?.label} onRemove={() => s.run(() => studio.remove('journeys', m.id), 'Journey removed.')} />)}
    </section>)}
  </>;
}

function JourneyView({m, persona, onRemove}: {m: Item; persona?: string; onRemove: () => void}) {
  return <article className="entry sectionGap">
    <div className="sectionHead"><div><h3>{m.title}</h3><p className="meta">{persona ? `Persona: ${persona} · ` : ''}{m.evidence_note || 'No evidence noted'}</p></div><button className="textBtn" onClick={onRemove}>Remove</button></div>
    <div className="journeyGrid" role="region" tabIndex={0} aria-label={`${m.title} stages, scroll horizontally`}>{m.stages.map((st: Stage, i: number) => <div key={i} className="stage"><h4>{i + 1}. {st.name}</h4>
      <div className="feel" role="img" aria-label={`Feeling ${FEEL[st.feeling]}`}><i style={{width: `${st.feeling * 20}%`}} /></div>
      <dl>{st.doing && <><dt>Doing</dt><dd>{st.doing}</dd></>}{st.thinking && <><dt>Thinking</dt><dd>{st.thinking}</dd></>}{st.pain && <><dt>Pain point</dt><dd>{st.pain}</dd></>}{st.opportunity && <><dt>Opportunity</dt><dd>{st.opportunity}</dd></>}</dl></div>)}</div>
  </article>;
}
