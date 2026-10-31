"use client";
import {useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio} from '@/lib/studio';

const TYPES = [['extreme-high', 'Extreme user: heavy use'], ['extreme-low', 'Extreme user: barely uses it'], ['mainstream', 'Mainstream user'], ['analogous', 'Analogous setting']] as const;
const TYPE_HELP: Record<string, string> = {
  'extreme-high': 'People at the edges amplify needs that everyone has.',
  'extreme-low': 'Those who avoid or abandon the process show where it breaks.',
  mainstream: 'The middle of your audience keeps findings grounded.',
  analogous: 'Another industry with a similar problem, for example airline rebooking after a missed flight.',
};

export default function ObservePage() {
  const s = useStudio();
  const obs = s.of('observations');
  const personas = s.of('personas');
  const evidence = [...s.of('notes').map(n => ({id: n.id, label: `${n.participant_code} note${n.synthetic ? ' (fictional)' : ''}`})),
    ...obs.map(o => ({id: o.id, label: `${o.participant_code || 'Observation'} · ${o.setting}${o.synthetic ? ' (fictional)' : ''}`}))];
  const [picked, setPicked] = useState<string[]>([]);
  return <>
    <PageHead art="stop-empathise" eyebrow="Design studio · weeks 2–3, observe" title="Observe" intro="Log what people actually do, deliberately including extreme users and analogous settings, then build personas that point back to the evidence behind them." />
    <Msg text={s.msg} />
    <section className="panel" aria-labelledby="obs-new">
      <h2 id="obs-new">Log an observation</h2>
      <p>Record behaviour, not opinions. Use participant codes only; no names, emails or phone numbers.</p>
      <QuickForm id="obs" submitLabel="Save observation" fields={[
        {name: 'user_type', label: 'Who or where', type: 'select', options: TYPES},
        {name: 'participant_code', label: 'Participant code (optional)', placeholder: 'P05'},
        {name: 'setting', label: 'Setting', required: true, placeholder: 'Train home, phone, 25 minutes free'},
        {name: 'what_happened', label: 'What happened', type: 'textarea', required: true, placeholder: 'Opened the LMS, then the group chat, then email before finding the quiz date'},
        {name: 'workaround', label: 'Workaround they used', type: 'textarea'},
        {name: 'insight', label: 'Possible insight (your interpretation)', type: 'textarea'},
      ]} onSubmit={v => s.run(() => studio.create('observations', {...v, participant_code: v.participant_code || null, synthetic: false}), 'Observation saved.')} />
    </section>
    <div className="board sectionGap">{TYPES.map(([t, label]) => <section key={t} className="card" aria-label={label}>
      <h3>{label} <span className="tag">{obs.filter(o => o.user_type === t).length}</span></h3><p>{TYPE_HELP[t]}</p>
      {obs.filter(o => o.user_type === t).map(o => <article key={o.id} className="entry">
        <p className="meta">{o.participant_code || 'No code'} · {o.setting}</p><p>{o.what_happened}</p>
        {o.workaround && <p><strong>Workaround:</strong> {o.workaround}</p>}{o.insight && <p><strong>Insight (interpretation):</strong> {o.insight}</p>}
        <button className="textBtn" onClick={() => s.run(() => studio.remove('observations', o.id), 'Observation removed.')}>Remove</button></article>)}
    </section>)}</div>
    <section className="panel sectionGap" aria-labelledby="per-h">
      <h2 id="per-h">Personas</h2>
      <p>A persona is only as good as its evidence. Link at least one note or observation; personas without evidence are labelled as assumptions.</p>
      <div className="board">{personas.map(p => <article key={p.id} className="card">
        <div className="tagRow">{p.evidence_ids?.length ? <span className="tag ok">{p.evidence_ids.length} evidence links</span> : <span className="tag warn">Assumption: no evidence yet</span>}</div>
        <h3>{p.label}</h3>{p.quote && <blockquote>“{p.quote}”</blockquote>}
        {p.goals && <p><strong>Goals:</strong> {p.goals}</p>}{p.frustrations && <p><strong>Frustrations:</strong> {p.frustrations}</p>}{p.context && <p><strong>Context:</strong> {p.context}</p>}
        <p className="meta">{(p.evidence_ids || []).map((id: string) => evidence.find(e => e.id === id)?.label || 'removed item').join(' · ')}</p>
        <button className="textBtn" onClick={() => s.run(() => studio.remove('personas', p.id), 'Persona removed.')}>Remove</button></article>)}</div>
      <fieldset className="consent"><legend>Evidence for the new persona</legend>
        {evidence.length === 0 ? <p className="muted">No notes or observations yet.</p> : evidence.map(e => <label key={e.id} className="checkRow"><input type="checkbox" checked={picked.includes(e.id)} onChange={x => setPicked(p => x.target.checked ? [...p, e.id] : p.filter(i => i !== e.id))} /> {e.label}</label>)}
      </fieldset>
      <QuickForm id="per" submitLabel="Create persona" fields={[
        {name: 'label', label: 'Persona label (not a real name)', required: true, placeholder: 'The night-shift learner'},
        {name: 'quote', label: 'Representative quote (from consented notes)', wide: true},
        {name: 'goals', label: 'Goals', type: 'textarea'}, {name: 'frustrations', label: 'Frustrations', type: 'textarea'}, {name: 'context', label: 'Context', type: 'textarea'},
      ]} onSubmit={v => s.run(() => studio.create('personas', {...v, evidence_ids: picked}), 'Persona created.').then(ok => { if (ok) setPicked([]); return ok; })} />
    </section>
  </>;
}
