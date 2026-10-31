"use client";
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio} from '@/lib/studio';

export default function EnvisionPage() {
  const s = useStudio();
  const hills = s.of('hills');
  const scenarios = s.of('scenarios');
  return <>
    <PageHead art="stop-ideate" eyebrow="Design studio · week 6, envision" title="Envision" intro="Write Hill statements (who, what, wow) to fix the outcome you are aiming for, then stress-test it with what-if scenarios." />
    <Msg text={s.msg} />
    <section className="panel" aria-labelledby="hill-h">
      <h2 id="hill-h">Hill statements</h2>
      <p>A Hill names a specific user, what they can do, and a measurable wow. It describes the outcome, not the feature.</p>
      <QuickForm id="hill" submitLabel="Add Hill" fields={[
        {name: 'who', label: 'Who', required: true, placeholder: 'A working learner who missed a session'},
        {name: 'what', label: 'What they can do', required: true, placeholder: 'start the right next task with a trusted deadline'},
        {name: 'wow', label: 'Wow (measurable)', required: true, placeholder: 'within two minutes of opening the app, without asking anyone'},
        {name: 'measure', label: 'How you will measure it', placeholder: 'Median time to first correct action in the experiment lab'},
      ]} onSubmit={v => s.run(() => studio.create('hills', v), 'Hill added.')} />
      <div className="board sectionGap">{hills.map(h => <article key={h.id} className="card hill">
        <div className="who"><b>Who</b>{h.who}</div><div className="what"><b>What</b>{h.what}</div><div className="wow"><b>Wow</b>{h.wow}</div>
        {h.measure && <p className="meta">Measure: {h.measure}</p>}
        <button className="textBtn" onClick={() => s.run(() => studio.remove('hills', h.id), 'Hill removed.')}>Remove</button></article>)}</div>
    </section>
    <section className="panel sectionGap" aria-labelledby="wi-h">
      <h2 id="wi-h">What-if scenarios</h2>
      <QuickForm id="wi" submitLabel="Add scenario" fields={[
        {name: 'what_if', label: 'What if…', required: true, wide: true, placeholder: 'What if the coordinator changes a deadline twice in one week?'},
        {name: 'impact', label: 'Impact on the learner', type: 'textarea'}, {name: 'response', label: 'How the design should respond', type: 'textarea'},
      ]} onSubmit={v => s.run(() => studio.create('scenarios', v), 'Scenario added.')} />
      <ul className="queueList">{scenarios.map(x => <li key={x.id}><strong>{x.what_if}</strong>{x.impact && <p>Impact: {x.impact}</p>}{x.response && <p>Response: {x.response}</p>}
        <button className="textBtn" onClick={() => s.run(() => studio.remove('scenarios', x.id), 'Scenario removed.')}>Remove</button></li>)}</ul>
    </section>
  </>;
}
