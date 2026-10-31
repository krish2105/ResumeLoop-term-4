"use client";
import {useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio} from '@/lib/studio';

export default function DefinePage() {
  const s = useStudio();
  const povs = s.of('povs');
  const boards = s.of('storyboards');
  const themes = s.of('themes');
  const [frames, setFrames] = useState<string[]>(['', '', '', '', '', '']);
  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  return <>
    <PageHead eyebrow="Design studio · weeks 4–5, define" title="Define" intro="Turn themes into a point-of-view statement (a user, a need and an insight, with no solution in it), then storyboard the moment that matters." />
    <Msg text={s.msg} />
    <div className="twoCol">
      <section className="panel" aria-labelledby="pov-h">
        <h2 id="pov-h">Point-of-view statements</h2>
        <QuickForm id="pov" submitLabel="Save statement" fields={[
          {name: 'user', label: 'User', required: true, placeholder: 'A working learner returning after a missed session'},
          {name: 'need', label: 'Needs a way to', required: true, placeholder: 'find the one task worth doing in the time they have'},
          {name: 'insight', label: 'Because (insight)', required: true, wide: true, placeholder: 'the course page, chat and email disagree, so they lose their study window reconciling them'},
          {name: 'theme_id', label: 'From theme', type: 'select', options: [['', 'No theme'], ...themes.map(t => [t.id, t.title] as [string, string])]},
        ]} onSubmit={v => s.run(() => studio.create('povs', {...v, theme_id: v.theme_id || null}), 'Statement saved.')} />
        <ul className="queueList">{povs.map(p => <li key={p.id}><p className="lead"><strong>{p.user}</strong> needs a way to <strong>{p.need}</strong> because <strong>{p.insight}</strong>.</p>
          <p className="meta">{themes.find(t => t.id === p.theme_id)?.title || 'No linked theme'}</p>
          <button className="textBtn" onClick={() => s.run(() => studio.remove('povs', p.id), 'Statement removed.')}>Remove</button></li>)}</ul>
        {povs.length === 0 && <p className="empty">No statements yet. Start from a theme in the Empathy studio.</p>}
      </section>
      <section className="panel" aria-labelledby="sb-h">
        <h2 id="sb-h">Storyboard</h2>
        <p>Six frames: the trigger, the struggle, the turning point, the new behaviour, the result, what changes for the coordinator.</p>
        <div className="formGrid"><label className="wide">Title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Back on the train after a missed session" /></label>
          <label className="wide">Scenario<input value={scenario} onChange={e => setScenario(e.target.value)} /></label></div>
        <div className="storyboard">{frames.map((f, i) => <div key={i} className="frame"><span>Frame {i + 1}</span>
          <label className="sr-only" htmlFor={'fr' + i}>Frame {i + 1} caption</label>
          <textarea id={'fr' + i} value={f} onChange={e => setFrames(x => x.map((y, k) => k === i ? e.target.value : y))} /></div>)}</div>
        <button className="primaryBtn" onClick={() => s.run(() => studio.create('storyboards', {title, scenario, frames: frames.map(caption => ({caption}))}), 'Storyboard saved.')
          .then(ok => { if (ok) { setFrames(['', '', '', '', '', '']); setTitle(''); setScenario(''); } })}>Save storyboard</button>
        {boards.map(b => <article key={b.id} className="entry sectionGap"><h3>{b.title}</h3>{b.scenario && <p>{b.scenario}</p>}
          <div className="storyboard">{b.frames.map((f: {caption: string}, i: number) => <div key={i} className="frame"><span>Frame {i + 1}</span><p>{f.caption || '—'}</p></div>)}</div>
          <button className="textBtn" onClick={() => s.run(() => studio.remove('storyboards', b.id), 'Storyboard removed.')}>Remove</button></article>)}
      </section>
    </div>
  </>;
}
