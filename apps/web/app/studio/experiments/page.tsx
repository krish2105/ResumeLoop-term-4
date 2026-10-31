"use client";
import {useEffect, useRef, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {Msg, useStudio} from '@/components/StudioBits';
import {fmtNum, summarise, type Row} from '@/lib/stats';
import {studio, type Item} from '@/lib/studio';

const BLANK = {title: '', hypothesis: '', a: 'A: current course page', b: 'B: ResumeLoop', tasks: 'Find the next task you can finish in 30 minutes\nFind which quiz date is authoritative', metrics: 'unaided success\nseconds to complete\nwrong actions\nease rating 1 to 7'};

export default function ExperimentsPage() {
  const s = useStudio();
  const exps = s.of('experiments');
  const [sel, setSel] = useState<string | null>(null);
  const exp = exps.find(e => e.id === sel) || exps[0];
  const [form, setForm] = useState(BLANK);
  const create = () => s.run(() => studio.create('experiments', {title: form.title, hypothesis: form.hypothesis, conditions: [form.a, form.b],
    tasks: form.tasks.split('\n').map(t => t.trim()).filter(Boolean), metrics: form.metrics.split('\n').map(t => t.trim()).filter(Boolean)}), 'Experiment drafted. Review it, then freeze the protocol.')
    .then(ok => ok && setForm(BLANK));
  return <>
    <PageHead art="stop-test" eyebrow="Design studio · week 9" title="Experiment lab" intro="Plan a small A/B usability comparison, freeze the protocol before any session, then record timed tasks. Results are descriptive (medians and ranges) because a few sessions cannot show statistical significance." />
    <Msg text={s.msg} />
    {exps.length > 0 && <div className="noteTabs">{exps.map(e => <button key={e.id} className={'chipBtn' + (exp?.id === e.id ? ' on' : '')} onClick={() => setSel(e.id)}>{e.title.slice(0, 40)}{e.synthetic ? ' · fictional' : ''}</button>)}</div>}
    {exp ? <Experiment exp={exp} sessions={s.of('sessions', exp.id)} run={s.run} /> : !s.loading && <section className="panel"><h2>No experiments yet</h2><p>Draft one below, or load the fictional examples from the Empathy studio.</p></section>}
    <section className="panel" aria-labelledby="new-exp">
      <h2 id="new-exp">Draft a new experiment</h2>
      <div className="formGrid">
        <label className="wide">Title<input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Finding the next task after a missed session" /></label>
        <label className="wide">Hypothesis<input value={form.hypothesis} onChange={e => setForm({...form, hypothesis: e.target.value})} placeholder="Learners find the right next task faster with B than with A" /></label>
        <label>Condition A<input value={form.a} onChange={e => setForm({...form, a: e.target.value})} /></label>
        <label>Condition B<input value={form.b} onChange={e => setForm({...form, b: e.target.value})} /></label>
        <label className="wide">Tasks (one per line)<textarea rows={3} value={form.tasks} onChange={e => setForm({...form, tasks: e.target.value})} /></label>
        <label className="wide">Metrics (one per line)<textarea rows={3} value={form.metrics} onChange={e => setForm({...form, metrics: e.target.value})} /></label>
      </div>
      <button className="primaryBtn" onClick={create}>Save draft</button>
    </section>
  </>;
}

function Experiment({exp, sessions, run}: {exp: Item; sessions: Item[]; run: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>}) {
  const tasks: string[] = exp.tasks;
  const summary = summarise(sessions, tasks);
  return <>
    <section className="panel" aria-labelledby="proto">
      <div className="sectionHead"><div><span className="eyebrow">Protocol</span><h2 id="proto">{exp.title}</h2></div>
        {exp.frozen_at ? <span className="status approved">Frozen {exp.frozen_at.slice(0, 10)}</span> : <button className="primaryBtn" onClick={() => { if (confirm('Freeze the protocol? Tasks and metrics can no longer change.')) run(() => studio.freeze(exp.id), 'Protocol frozen. You can now record sessions.'); }}>Freeze protocol</button>}</div>
      <p><strong>Hypothesis:</strong> {exp.hypothesis}</p>
      <div className="twoCol"><div><h3>Conditions</h3><ul>{exp.conditions.map((c: string) => <li key={c}>{c}</li>)}</ul><h3>Tasks</h3><ol>{tasks.map(t => <li key={t}>{t}</li>)}</ol></div>
        <div><h3>Metrics</h3><ul>{exp.metrics.map((m: string) => <li key={m}>{m}</li>)}</ul>
          {exp.protocol_sha256 && <p className="fingerprint muted">Protocol SHA-256 {exp.protocol_sha256}</p>}
          <p className="muted">Alternate AB and BA order between participants. Do not change the prototype between paired tasks.</p></div></div>
    </section>
    {exp.frozen_at && <SessionRecorder exp={exp} next={sessions.length % 2 === 0 ? 'AB' : 'BA'} run={run} />}
    <section className="panel" aria-labelledby="res">
      <h2 id="res">Results</h2>
      <p>{summary.participants} participant(s), {summary.sessions} session(s).{summary.synthetic ? ' Includes fictional sessions: practice only.' : ''} Small samples are formative evidence, not proof.</p>
      {summary.sessions === 0 ? <p className="empty">No sessions recorded yet.</p> : <>
        <div className="tableWrap" role="region" tabIndex={0} aria-label="Results by task and condition, scroll horizontally for all columns"><table><thead><tr><th>Task</th><th>Condition</th><th>n</th><th>Success</th><th>Median s (range)</th><th>Median wrong</th><th>Median ease</th></tr></thead><tbody>
          {summary.perTask.flatMap(t => (['a', 'b'] as const).map(k => <tr key={t.task + k}><td>{k === 'a' ? t.name : ''}</td><td>{k.toUpperCase()}</td><td>{t[k].n}</td><td>{t[k].success}/{t[k].n}</td>
            <td>{fmtNum(t[k].medianSeconds)} ({fmtNum(t[k].min)}–{fmtNum(t[k].max)})</td><td>{fmtNum(t[k].medianWrong, 1)}</td><td>{fmtNum(t[k].medianEase, 1)}</td></tr>))}
        </tbody></table></div>
        <TimeChart rows={summary.perTask} />
        <ul>{summary.perTask.map(t => <li key={t.task}>{t.name}: {t.pairedN} paired participant(s), median B − A = {fmtNum(t.medianDifference)} s{t.medianDifference !== null ? (t.medianDifference < 0 ? ' (B faster)' : t.medianDifference > 0 ? ' (A faster)' : '') : ''}
          {t.sign.n > 0 && <> · {t.sign.bFaster} of {t.sign.n} faster with B · exact sign test p = <span className="mono">{t.sign.p!.toFixed(3)}</span></>}</li>)}</ul>
        <p className="muted">The sign test only asks whether more people were faster with one condition. With fewer than about 8 pairs it cannot reach p &lt; 0.05 whatever happens, so report it as formative and lead with medians, ranges and failures.</p>
        <h3>Sessions</h3><ul className="queueList">{sessions.map(x => <li key={x.id}><strong>{x.participant_code}</strong> · order {x.order}{x.synthetic ? ' · fictional' : ''} · {x.results.length} results <button className="textBtn" onClick={() => run(() => studio.remove('sessions', x.id), 'Session removed.')}>Remove</button>{x.notes && <p>{x.notes}</p>}</li>)}</ul>
      </>}
    </section>
  </>;
}

function TimeChart({rows}: {rows: ReturnType<typeof summarise>['perTask']}) {
  const max = Math.max(1, ...rows.flatMap(r => [r.a.medianSeconds || 0, r.b.medianSeconds || 0]));
  return <figure className="chart">
    <figcaption>Median seconds per task (shorter is faster). A = solid outline, B = filled.</figcaption>
    <svg viewBox={`0 0 600 ${rows.length * 56 + 20}`} role="img" aria-label="Median seconds per task by condition">
      {rows.map((r, i) => <g key={r.task} transform={`translate(0 ${i * 56 + 10})`}>
        <text x="0" y="12" className="chartLabel">{`Task ${i + 1}`}</text>
        <rect x="70" y="2" height="16" width={((r.a.medianSeconds || 0) / max) * 470} className="barA" />
        <text x={76 + ((r.a.medianSeconds || 0) / max) * 470} y="15" className="chartValue">A {fmtNum(r.a.medianSeconds)}s</text>
        <rect x="70" y="24" height="16" width={((r.b.medianSeconds || 0) / max) * 470} className="barB" />
        <text x={76 + ((r.b.medianSeconds || 0) / max) * 470} y="37" className="chartValue">B {fmtNum(r.b.medianSeconds)}s</text>
      </g>)}
    </svg>
  </figure>;
}

function SessionRecorder({exp, next, run}: {exp: Item; next: 'AB' | 'BA'; run: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>}) {
  const tasks: string[] = exp.tasks;
  const [code, setCode] = useState('P01');
  const [order, setOrder] = useState<'AB' | 'BA'>(next);
  const [notes, setNotes] = useState('');
  const blank = () => tasks.flatMap((_, task) => (['A', 'B'] as const).map(condition => ({task, condition, success: false, seconds: 0, wrong_actions: 0, ease: 4})));
  const [rows, setRows] = useState<Row[]>(blank);
  const [timing, setTiming] = useState<string | null>(null);
  const start = useRef(0);
  const [tick, setTick] = useState(0);
  useEffect(() => { setOrder(next); }, [next]);
  useEffect(() => { if (!timing) return; const t = setInterval(() => setTick(x => x + 1), 250); return () => clearInterval(t); }, [timing]);
  const key = (r: Row) => `${r.task}-${r.condition}`;
  const set = (k: string, patch: Partial<Row>) => setRows(rs => rs.map(r => key(r) === k ? {...r, ...patch} : r));
  const toggle = (k: string) => {
    if (timing === k) { set(k, {seconds: Math.round((performance.now() - start.current) / 100) / 10}); setTiming(null); }
    else { start.current = performance.now(); setTiming(k); }
  };
  const ordered = [...rows].sort((a, b) => a.task - b.task || (order === 'AB' ? (a.condition < b.condition ? -1 : 1) : (a.condition > b.condition ? -1 : 1)));
  return <section className="panel" aria-labelledby="rec">
    <h2 id="rec">Record a session</h2>
    <div className="formGrid">
      <label>Participant code<input value={code} onChange={e => setCode(e.target.value)} /></label>
      <label>Order<select value={order} onChange={e => setOrder(e.target.value as 'AB' | 'BA')}><option>AB</option><option>BA</option></select></label>
    </div>
    <p className="muted">Suggested order for the next participant: {next}. Start the timer when the task is shown and stop it at the agreed end state.</p>
    <div className="tableWrap" role="region" tabIndex={0} aria-label="Session results to record, scroll horizontally for all columns"><table><thead><tr><th>Task</th><th>Cond.</th><th>Timer</th><th>Seconds</th><th>Unaided success</th><th>Wrong actions</th><th>Ease 1–7</th></tr></thead><tbody>
      {ordered.map(r => { const k = key(r); return <tr key={k}><td>{tasks[r.task]}</td><td>{r.condition}</td>
        <td><button className={timing === k ? 'primaryBtn' : 'outlineBtn'} onClick={() => toggle(k)} disabled={!!timing && timing !== k}>{timing === k ? `Stop ${((performance.now() - start.current) / 1000).toFixed(1)}s` : 'Start'}</button><span hidden>{tick}</span></td>
        <td><input type="number" min={0} max={3600} step={0.1} value={r.seconds} onChange={e => set(k, {seconds: Number(e.target.value)})} aria-label={`Seconds for ${tasks[r.task]} ${r.condition}`} /></td>
        <td><input type="checkbox" checked={r.success} onChange={e => set(k, {success: e.target.checked})} aria-label="Unaided success" /></td>
        <td><input type="number" min={0} max={100} value={r.wrong_actions} onChange={e => set(k, {wrong_actions: Number(e.target.value)})} aria-label="Wrong actions" /></td>
        <td><input type="number" min={1} max={7} value={r.ease} onChange={e => set(k, {ease: Number(e.target.value)})} aria-label="Ease rating" /></td></tr>; })}
    </tbody></table></div>
    <label className="fieldLabel" htmlFor="snotes">Observation notes (no names)</label>
    <textarea id="snotes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
    <button className="primaryBtn" onClick={() => run(() => studio.create('sessions', {participant_code: code, order, results: rows, notes, synthetic: !!exp.synthetic}, exp.id), 'Session saved.').then(ok => { if (ok) { setRows(blank()); setNotes(''); } })}>Save session</button>
  </section>;
}
