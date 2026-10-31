"use client";
import {useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio, type Item} from '@/lib/studio';

const FB = [['like', 'I like'], ['wish', 'I wish'], ['question', 'Question'], ['idea', 'What if']] as const;

export default function PrototypesPage() {
  const s = useStudio();
  const protos = [...s.of('prototypes')].reverse();
  return <>
    <PageHead eyebrow="Design studio · week 8, prototype" title="Prototype log" intro="Record each version, what changed and why, and the feedback that caused it. Rubrics reward iteration you can trace back to evidence." />
    <Msg text={s.msg} />
    <section className="panel" aria-labelledby="pv-h">
      <h2 id="pv-h">Log a version</h2>
      <QuickForm id="pv" submitLabel="Log version" fields={[
        {name: 'version', label: 'Version', required: true, placeholder: 'v0.4'},
        {name: 'title', label: 'Title', required: true, placeholder: 'Split layout; road no longer covered'},
        {name: 'fidelity', label: 'Fidelity', type: 'select', options: [['paper', 'Paper sketch'], ['clickable', 'Clickable mock'], ['working', 'Working software']]},
        {name: 'what_changed', label: 'What changed', type: 'textarea'}, {name: 'why', label: 'Why (which evidence or feedback)', type: 'textarea'},
      ]} onSubmit={v => s.run(() => studio.create('prototypes', {...v, feedback: []}), 'Version logged.')} />
    </section>
    <ol className="timeline sectionGap" aria-label="Versions, newest first">{protos.map(p => <li key={p.id} className="assess"><Version p={p} run={s.run} /></li>)}</ol>
    {protos.length === 0 && <p className="empty">No versions yet. Log the current ResumeLoop build as your first entry.</p>}
  </>;
}

function Version({p, run}: {p: Item; run: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>}) {
  const [kind, setKind] = useState('like');
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const add = () => run(() => studio.update('prototypes', p.id, {feedback: [...p.feedback, {kind, text, source}]}), 'Feedback added.').then(ok => ok && setText(''));
  return <article className="entry">
    <div className="sectionHead"><div><span className="tag accent mono">{p.version}</span> <span className="tag">{p.fidelity}</span><h3>{p.title}</h3></div>
      <button className="textBtn" onClick={() => run(() => studio.remove('prototypes', p.id), 'Version removed.')}>Remove</button></div>
    {p.what_changed && <p><strong>Changed:</strong> {p.what_changed}</p>}{p.why && <p><strong>Why:</strong> {p.why}</p>}
    <div className="board sectionGap">{FB.map(([k, label]) => <div key={k} className="stage"><h4>{label}</h4>
      <ul className="needs">{p.feedback.filter((f: {kind: string}) => f.kind === k).map((f: {text: string; source: string}, i: number) => <li key={i}>{f.text} {f.source && <small>{f.source}</small>}</li>)}</ul></div>)}</div>
    <div className="askForm sectionGap"><label className="sr-only" htmlFor={'fk' + p.id}>Feedback type</label>
      <select id={'fk' + p.id} value={kind} onChange={e => setKind(e.target.value)}>{FB.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <label className="sr-only" htmlFor={'ft' + p.id}>Feedback</label><input id={'ft' + p.id} value={text} onChange={e => setText(e.target.value)} placeholder="What the tester said or did" />
      <label className="sr-only" htmlFor={'fs' + p.id}>Source</label><input id={'fs' + p.id} value={source} onChange={e => setSource(e.target.value)} placeholder="P02 or session id" />
      <button className="outlineBtn" onClick={add}>Add feedback</button></div>
  </article>;
}
