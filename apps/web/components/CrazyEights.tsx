"use client";
// Crazy 8s: eight ideas in eight minutes, a classic divergent-thinking exercise.
import {useEffect, useRef, useState} from 'react';
import {studio} from '@/lib/studio';

export function CrazyEights({run, sprints}: {run: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>; sprints: {id: string; prompt: string; sketches: string[]; contributor?: string | null}[]}) {
  const [prompt, setPrompt] = useState('');
  const [boxes, setBoxes] = useState<string[]>(Array(8).fill(''));
  const [left, setLeft] = useState<number | null>(null);
  const end = useRef(0);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setInterval(() => setLeft(Math.max(0, Math.round((end.current - Date.now()) / 1000))), 250);
    return () => clearInterval(t);
  }, [left]);
  const start = () => { end.current = Date.now() + 8 * 60 * 1000; setLeft(480); };
  const mm = left === null ? '8:00' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return <section className="panel" aria-labelledby="c8-h">
    <div className="sectionHead"><div><h2 id="c8-h">Crazy 8s</h2><p>Eight rough ideas in eight minutes. Quantity first; judge later.</p></div>
      <div><span className="timerBig" role="timer" aria-live="off">{mm}</span> <button className="outlineBtn" onClick={start}>{left === null ? 'Start timer' : 'Restart'}</button></div></div>
    {left === 0 && <p className="toast" role="status">Time is up. Save the round, then vote on ideas below.</p>}
    <label className="fieldLabel" htmlFor="c8p">Prompt (a How might we question)</label>
    <input id="c8p" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="How might we show one trusted date?" />
    <div className="crazy sectionGap">{boxes.map((b, i) => <label key={i} className="frame"><span>Idea {i + 1}</span>
      <textarea aria-label={`Idea ${i + 1}`} value={b} onChange={e => setBoxes(x => x.map((y, k) => k === i ? e.target.value : y))} /></label>)}</div>
    <button className="primaryBtn" onClick={() => run(() => studio.create('sprints', {prompt, sketches: boxes.filter(b => b.trim()), minutes: 8}), 'Round saved.')
      .then(ok => { if (ok) { setBoxes(Array(8).fill('')); setLeft(null); } })}>Save round</button>
    {sprints.map(sp => <details key={sp.id} className="sectionGap"><summary>{sp.prompt} · {sp.sketches.length} ideas</summary><ol>{sp.sketches.map((x, i) => <li key={i}>{x}</li>)}</ol></details>)}
  </section>;
}
