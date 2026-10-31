"use client";
// Browser-only pilot screens: load an approved course file, share progress as a file, combine learners' files.
import {useEffect, useState} from 'react';
import {Msg} from './StudioBits';
import {assist} from '@/lib/assist';
import {learning} from '@/lib/client';
import {activePilot, checkPackage, CODE, fingerprint, leavePilot, MAX_FILE_BYTES, progressFile, readProgressFile, rollUp,
  setPilot, type PilotCourse, type PilotRecord, type ProgressFile} from '@/lib/pilot';

function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function usePilot() {
  const [pilot, setState] = useState<PilotRecord | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setState(activePilot()); setReady(true); }, []);
  return {pilot, ready};
}

/** Load a course file into this browser. Coordinators confirm they may share it; learners confirm where it came from. */
export function PilotLoader({role}: {role: 'coordinator' | 'learner'}) {
  const {pilot, ready} = usePilot();
  const [candidate, setCandidate] = useState<{course: PilotCourse; sha256: string} | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [msg, setMsg] = useState('');
  const choose = async (file?: File) => {
    setCandidate(null); setErrors([]); setConfirmed(false); setMsg('');
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setErrors(['The file is larger than 1 MB.']); return; }
    let raw: unknown;
    try { raw = JSON.parse(await file.text()); } catch { setErrors(['That file is not valid JSON. Start from the template.']); return; }
    const {course, errors} = checkPackage(raw);
    if (!course) { setErrors(errors); return; }
    setCandidate({course, sha256: await fingerprint(course)});
  };
  const load = () => {
    if (!candidate) return;
    try { setPilot({...candidate, loaded_at: new Date().toISOString(), confirmed_by: role}); }
    catch { setMsg('This browser would not store the course (private mode or storage full). Try a normal window.'); return; }
    location.reload();
  };
  if (!ready) return <section className="panel"><h2>Pilot course</h2><p className="muted">Checking this browser…</p></section>;
  if (pilot) return <section className="panel" aria-labelledby="pilot-h">
    <div className="sectionHead"><h2 id="pilot-h">Pilot course in this browser</h2><span className="tag ok">active</span></div>
    <p><strong>{pilot.course.course}</strong></p>
    <p>From {pilot.course.source_owner} · {pilot.course.timezone} · {pilot.course.versions.length} version{pilot.course.versions.length === 1 ? '' : 's'} · {pilot.course.sources.length} source passages</p>
    <p className="meta mono">Fingerprint {pilot.sha256.slice(0, 12)} · loaded {pilot.loaded_at.slice(0, 16).replace('T', ' ')}</p>
    <p className="muted">Everyone in the pilot should see the same fingerprint. Progress for this course stays in this browser until you download it.</p>
    <button className="outlineBtn" onClick={() => { if (confirm('Leave the pilot and go back to the fictional course? Pilot progress stays saved in this browser.')) { leavePilot(); location.reload(); } }}>Leave the pilot</button>
  </section>;
  return <section className="panel" aria-labelledby="pilot-h">
    <h2 id="pilot-h">{role === 'coordinator' ? 'Start a browser pilot' : 'Join a pilot course'}</h2>
    <p>{role === 'coordinator'
      ? 'Load the course file you will share with pilot learners. It is checked with the same rules as the server import and never leaves this browser.'
      : 'If your coordinator gave you a ResumeLoop course file, load it here. It replaces the fictional course in this browser only.'}</p>
    <div className="detailActions">
      {role === 'coordinator' && <a className="outlineBtn" href="/course-template.json" download>Download the template</a>}
      <label className="outlineBtn fileBtn">Choose a course file<input type="file" accept="application/json,.json" aria-label="Course file" onChange={e => choose(e.target.files?.[0])} /></label>
    </div>
    {errors.length > 0 && <div className="errorBox" role="alert"><strong>This course file cannot be used yet</strong><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
    {candidate && <div className="sourceNote">
      <strong>{candidate.course.course}</strong>
      <p>From {candidate.course.source_owner} · {candidate.course.timezone} · {candidate.course.sources.length} source passages</p>
      <ul>{candidate.course.versions.map(v => <li key={v.version}>{v.version}: {v.actions.length} tasks, published {v.published_at.slice(0, 10)}</li>)}</ul>
      <p className="meta mono">Fingerprint {candidate.sha256.slice(0, 12)}</p>
      <label className="checkRow"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
        {role === 'coordinator' ? ` I have permission from ${candidate.course.source_owner} to share this course content with pilot learners.`
          : ' My coordinator gave me this file for a ResumeLoop pilot.'}</label>
      <button className="primaryBtn" onClick={load} disabled={!confirmed}>Load this course</button>
    </div>}
    <Msg text={msg} />
  </section>;
}

/** A learner downloads their progress under a code (not a name) to send to the coordinator. */
export function ProgressExport() {
  const {pilot} = usePilot();
  const [code, setCode] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [include, setInclude] = useState(true);
  const [msg, setMsg] = useState('');
  useEffect(() => { assist.escalations().then(e => setQuestions(e.filter(x => x.status === 'queued').map(x => x.subject))).catch(() => {}); }, []);
  if (!pilot) return null;
  const valid = CODE.test(code);
  const save = async () => {
    try {
      const p = await learning.progress();
      const file = progressFile(pilot, code, p.state, include ? questions : []);
      download(`resumeloop-progress-${code}.json`, JSON.stringify(file, null, 1));
      setMsg(`Downloaded resumeloop-progress-${code}.json. Send it to your coordinator yourself; nothing is uploaded.`);
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  };
  return <section className="panel" aria-labelledby="share-h">
    <h2 id="share-h">Share your progress with the coordinator</h2>
    <p>The file holds your learner code, the tasks you completed, your time budget and the course version you last saw{questions.length ? ', and the subjects of your queued questions if you tick the box' : ''}. No name, no notes.</p>
    <label className="fieldLabel" htmlFor="pcode">Learner code from your coordinator</label>
    <input id="pcode" value={code} onChange={e => setCode(e.target.value.trim())} placeholder="L03" aria-describedby="pcode-help" aria-invalid={code !== '' && !valid} />
    <p id="pcode-help" className="muted">{code && !valid ? '2-20 letters, digits or dashes. Use the code, not your name.' : '2-20 letters, digits or dashes.'}</p>
    {questions.length > 0 && <label className="checkRow"><input type="checkbox" checked={include} onChange={e => setInclude(e.target.checked)} /> Include the subjects of my {questions.length} queued question{questions.length === 1 ? '' : 's'}</label>}
    <button className="primaryBtn" onClick={save} disabled={!valid}>Download progress file</button>
    <Msg text={msg} />
  </section>;
}

/** The coordinator combines learners' progress files. Files are read in this browser only. */
export function RollUp() {
  const {pilot} = usePilot();
  const [files, setFiles] = useState<ProgressFile[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  if (!pilot) return null;
  const add = async (list: FileList | null) => {
    const ok: ProgressFile[] = [], bad: string[] = [];
    for (const f of Array.from(list || [])) {
      try {
        const {file, error} = readProgressFile(JSON.parse(await f.text()), pilot);
        if (file) ok.push(file); else bad.push(`${f.name}: ${error}`);
      } catch { bad.push(`${f.name}: not valid JSON`); }
    }
    setFiles(prev => [...prev, ...ok]); setRejected(bad);
  };
  const r = rollUp(files, pilot);
  const csv = () => download('resumeloop-pilot-summary.csv', ['learner_code,completed,of,seen_latest_version,open_questions,exported_utc',
    ...r.learners.map(l => [l.code, l.done, l.of, l.seenLatest ? 'yes' : 'no', l.open, l.exported].join(','))].join('\n') + '\n', 'text/csv');
  return <section className="panel sectionGap" aria-labelledby="roll-h">
    <h2 id="roll-h">Pilot learners ({r.learners.length})</h2>
    <p>Add the progress files learners send you. They are read here and not uploaded anywhere. A newer file from the same code replaces the older one.</p>
    <div className="detailActions">
      <label className="outlineBtn fileBtn">Add progress files<input type="file" multiple accept="application/json,.json" aria-label="Progress files" onChange={e => add(e.target.files)} /></label>
      {r.learners.length > 0 && <button className="outlineBtn" onClick={csv}>Download summary (CSV)</button>}
    </div>
    {rejected.length > 0 && <div className="errorBox" role="alert"><strong>Some files were not added</strong><ul>{rejected.map(x => <li key={x}>{x}</li>)}</ul></div>}
    {r.learners.length === 0 ? <p className="empty">No progress files yet. Ask each learner to use Settings → Share your progress.</p> : <>
      <div className="tableWrap" role="region" tabIndex={0} aria-label="Pilot learner progress"><table>
        <thead><tr><th>Learner</th><th>Completed</th><th>Saw {r.latest}</th><th>Questions</th><th>File from (UTC)</th></tr></thead>
        <tbody>{r.learners.map(l => <tr key={l.code}><td className="mono">{l.code}</td><td>{l.done}/{l.of}</td><td>{l.seenLatest ? 'yes' : 'not yet'}</td><td>{l.open}</td><td>{l.exported}</td></tr>)}</tbody>
      </table></div>
      <h3>Tasks completed across the pilot</h3>
      <ul className="factList">{r.tasks.map(t => <li key={t.id}>{t.title}: <strong>{t.done}</strong> of {r.learners.length}</li>)}</ul>
      {r.questions.length > 0 && <><h3>Queued questions ({r.questions.length})</h3><ul className="factList">{r.questions.map((q, i) => <li key={i}><span className="mono">{q.code}</span> {q.q}</li>)}</ul></>}
    </>}
  </section>;
}
