"use client";
import {useEffect, useRef, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio} from '@/lib/studio';

// Condensed from research/STUDY_KIT.md (the project's own interview guide).
const GUIDES: Record<string, string[]> = {
  learner: ['How does study fit into your week? Which tools do you use?', 'Think of the last session you missed or stopped. What happened next?',
    'What did you check first when you came back, and in what order?', 'How did you know which deadline was the real one?',
    'How did you choose what to do with the time you had?', 'When did you ask for help, and from whom?',
    'What would make you distrust a suggested next task?', 'What have I not asked that I should have?'],
  coordinator: ['Describe the last recovery request you handled.', 'Where did the answer and deadline come from?',
    'How do you communicate changes to people who were away?', 'Which questions repeat every week?', 'Who verifies deadlines and access decisions?'],
};
const TAGS = [['says', 'Says'], ['does', 'Does'], ['thinks', 'Thinks'], ['feels', 'Feels'], ['need', 'Need'], ['note', 'Note']] as const;
type Moment = {t: number; tag: string; text: string};
const today = () => new Date().toISOString().slice(0, 10);
const clock = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

export default function ResearchPage() {
  const s = useStudio();
  const people = s.of('participants');
  const interviews = s.of('interviews');
  const [code, setCode] = useState('');
  const [guide, setGuide] = useState<'learner' | 'coordinator'>('learner');
  const [moments, setMoments] = useState<Moment[]>([]);
  const [tag, setTag] = useState('says');
  const [text, setText] = useState('');
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (started === null) return; const t = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500); return () => clearInterval(t); }, [started]);
  const add = () => { if (!text.trim()) return; setMoments(m => [...m, {t: elapsed, tag, text: text.trim()}]); setText(''); input.current?.focus(); };
  const consented = people.filter(p => p.consent === 'consented').length;
  return <>
    <PageHead eyebrow="Design studio · weeks 2–3, fieldwork" title="Research operations" intro="Track recruitment and consent, then capture interviews live with timestamps and one-key tags. Captured moments become a research note and codes, but only after consent is recorded." />
    <Msg text={s.msg} />
    <div className="statGrid miniStats4">
      <div className="stat"><small>Participants</small><strong>{people.length}</strong><span>goal: 4 learners and 2 coordinators</span></div>
      <div className="stat"><small>Consented</small><strong>{consented}</strong><span>{people.filter(p => p.consent === 'invited').length} invited, waiting</span></div>
      <div className="stat"><small>Extreme users</small><strong>{people.filter(p => p.user_type.startsWith('extreme')).length}</strong><span>at least one recommended</span></div>
      <div className="stat"><small>Interviews captured</small><strong>{interviews.length}</strong><span>{interviews.filter(i => i.converted_note_id).length} turned into notes</span></div>
    </div>
    <div className="twoCol sectionGap">
      <section className="panel" aria-labelledby="tr-h">
        <h2 id="tr-h">Participant tracker</h2>
        <p>Codes only. Keep names and contact details in your consent records outside ResumeLoop.</p>
        <QuickForm id="pt" submitLabel="Add participant" fields={[
          {name: 'code', label: 'Code', required: true, placeholder: 'P05'},
          {name: 'segment', label: 'Segment', type: 'select', options: [['learner', 'Learner'], ['coordinator', 'Coordinator'], ['other', 'Other']]},
          {name: 'user_type', label: 'Type', type: 'select', options: [['mainstream', 'Mainstream'], ['extreme-high', 'Extreme: heavy use'], ['extreme-low', 'Extreme: barely uses it'], ['analogous', 'Analogous']]},
          {name: 'planned', label: 'Session planned', placeholder: 'Tue 18:00, online'},
        ]} onSubmit={v => s.run(() => studio.create('participants', {...v, consent: 'invited', consent_date: null, done: false, note: ''}), 'Participant added.')} />
        <ul className="checkList">{people.map(p => <li key={p.id}>
          <span className={'tag ' + (p.consent === 'consented' ? 'ok' : p.consent === 'invited' ? 'warn' : 'danger')}>{p.consent}</span>
          <div><strong className="mono">{p.code}</strong> · {p.segment} · {p.user_type}<p className="meta">{p.planned || 'not scheduled'}{p.consent_date ? ` · consent ${p.consent_date}` : ''}</p></div>
          <select aria-label={`Consent for ${p.code}`} value={p.consent} onChange={e => s.run(() => studio.update('participants', p.id, {consent: e.target.value, consent_date: e.target.value === 'consented' ? today() : p.consent_date}))}>
            <option value="invited">Invited</option><option value="consented">Consented</option><option value="declined">Declined</option><option value="withdrawn">Withdrawn</option></select>
        </li>)}</ul>
      </section>
      <section className="panel" aria-labelledby="cap-h">
        <h2 id="cap-h">Live interview capture</h2>
        <div className="formGrid">
          <label>Participant<select value={code} onChange={e => setCode(e.target.value)}><option value="">Choose…</option>{people.map(p => <option key={p.id} value={p.code}>{p.code} ({p.consent})</option>)}</select></label>
          <label>Guide<select value={guide} onChange={e => setGuide(e.target.value as 'learner' | 'coordinator')}><option value="learner">Learner</option><option value="coordinator">Coordinator</option></select></label>
        </div>
        <div className="sectionHead"><span className="timerBig" role="timer">{clock(elapsed)}</span>
          <button className="outlineBtn" onClick={() => { if (started === null) setStarted(Date.now() - elapsed * 1000); else setStarted(null); }}>{started === null ? (elapsed ? 'Resume' : 'Start interview') : 'Pause'}</button></div>
        <details open><summary>Interview guide</summary><ol className="factList">{GUIDES[guide].map(q => <li key={q}>{q}</li>)}</ol></details>
        <div className="tagRow sectionGap" role="radiogroup" aria-label="Tag for the next moment">{TAGS.map(([k, l]) => <button key={k} role="radio" aria-checked={tag === k} className={'chipBtn' + (tag === k ? ' on' : '')} onClick={() => { setTag(k); input.current?.focus(); }}>{l}</button>)}</div>
        <form className="askForm" onSubmit={e => { e.preventDefault(); add(); }}>
          <label className="sr-only" htmlFor="mom">What happened or was said</label>
          <input id="mom" ref={input} value={text} onChange={e => setText(e.target.value)} placeholder="Type what you saw or heard, press Enter" />
          <button className="primaryBtn">Add</button></form>
        <ol className="momentList">{moments.map((m, i) => <li key={i}><span className="mono">{clock(m.t)}</span> <span className="tag">{m.tag}</span> {m.text}
          <button className="textBtn" aria-label={`Remove moment ${i + 1}`} onClick={() => setMoments(x => x.filter((_, k) => k !== i))}>×</button></li>)}</ol>
        <button className="primaryBtn" disabled={!code || !moments.length} onClick={() => s.run(() => studio.create('interviews', {participant_code: code, date: today(), guide, duration_s: elapsed, moments, converted_note_id: null}), 'Interview saved.')
          .then(ok => { if (ok) { setMoments([]); setElapsed(0); setStarted(null); } })}>Save interview</button>
      </section>
    </div>
    <section className="panel sectionGap" aria-labelledby="iv-h">
      <h2 id="iv-h">Captured interviews</h2>
      {interviews.length === 0 && <p className="empty">None yet.</p>}
      <ul className="queueList">{interviews.map(iv => <li key={iv.id}><div className="sectionHead"><strong className="mono">{iv.participant_code} · {iv.date} · {clock(iv.duration_s)}</strong>
        {iv.converted_note_id ? <span className="tag ok">in the Empathy studio</span> : <button className="outlineBtn" onClick={() => s.run(() => studio.interviewToNote(iv.id), 'Converted to a note with codes. Open the Empathy studio.')}>Turn into note and codes</button>}</div>
        <p className="meta">{iv.moments.length} moments · {iv.guide} guide</p></li>)}</ul>
    </section>
  </>;
}
