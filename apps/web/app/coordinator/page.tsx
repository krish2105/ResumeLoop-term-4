"use client";
import {useEffect, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {LocalOnly} from '@/components/LocalOnly';
import {Msg} from '@/components/StudioBits';
import {api, DEMO} from '@/lib/client';

type Preview = {ok: boolean; errors: string[]; course?: string; source_owner?: string; timezone?: string; versions?: {version: string; actions: number; published_at: string}[];
  sources?: number; replaces?: string; changes_vs_current?: {id: string; type: string; title: string; field?: string}[]};
type Pkg = {id: string; title: string; active: number; imported_at: string; sha256: string};
type Packages = {active: string; fictional: string; packages: Pkg[]};
type Learner = {learner_id: string; completed: number; of: number; saves: number; updated_at: string};
type Insights = {coach_calls: number; answered: number; declined: number; top_sources: {chunk: string; title: string; citations: number}[]; open_questions: string[]};

export default function CoordinatorPage() {
  if (DEMO) return <LocalOnly title="Coordinator workspace" />;
  return <Workspace />;
}

function Workspace() {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pkgs, setPkgs] = useState<Packages | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [ins, setIns] = useState<Insights | null>(null);
  const [msg, setMsg] = useState('');
  const refresh = async () => {
    try {
      const [p, l, i] = await Promise.all([api<Packages>('/api/course/packages'), api<Learner[]>('/api/learners'), api<Insights>('/api/coordinator/insights')]);
      setPkgs(p); setLearners(l); setIns(i);
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { refresh(); }, []);
  const parse = () => { try { return JSON.parse(text); } catch { setMsg('That is not valid JSON. Start from the template.'); return null; } };
  const doPreview = async () => {
    const p = parse(); if (!p) return;
    setMsg('');
    try { setPreview(await api<Preview>('/api/course/import/preview', {method: 'POST', body: JSON.stringify({package: p})})); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  };
  const doImport = async () => {
    const p = parse(); if (!p) return;
    try {
      const r = await api<{replayed: boolean; active: string}>('/api/course/import', {method: 'POST', body: JSON.stringify({package: p})});
      setMsg(r.replayed ? `Already imported; “${r.active}” is active again.` : `Imported and activated “${r.active}”. Learners see it on their next load.`);
      setPreview(null); refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  };
  const act = async (path: string, ok: string) => { try { await api(path, {method: 'POST'}); setMsg(ok); refresh(); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } };
  return <>
    <PageHead eyebrow="Coordinator" title="Coordinator workspace" intro="Import an authorised course package, check it before learners see it, and switch versions. See who is progressing and which parts of the course people ask about." />
    <Msg text={msg} />
    <div className="twoCol">
      <section className="panel" aria-labelledby="imp-h">
        <h2 id="imp-h">Import a course package</h2>
        <p>Only import material you are authorised to use. Mark a deadline <code>verified</code> only after you have confirmed it.</p>
        <div className="detailActions"><a className="outlineBtn" href="/course-template.json" download>Download the template</a>
          <label className="outlineBtn fileBtn">Choose a file<input type="file" accept="application/json" onChange={async e => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setPreview(null); } }} /></label></div>
        <label className="fieldLabel" htmlFor="pkg">Package JSON</label>
        <textarea id="pkg" className="csvEditor" rows={8} value={text} onChange={e => { setText(e.target.value); setPreview(null); }} placeholder='{"course": "…", "versions": [...], "sources": [...]}' />
        <div className="detailActions"><button className="outlineBtn" onClick={doPreview} disabled={!text.trim()}>Check package</button>
          <button className="primaryBtn" onClick={doImport} disabled={!preview?.ok}>Import and activate</button></div>
        {preview && (preview.ok ? <div className="sourceNote"><strong>{preview.course}</strong><p>{preview.source_owner} · {preview.timezone} · {preview.sources} source passages</p>
            <ul>{preview.versions!.map(v => <li key={v.version}>{v.version}: {v.actions} tasks, published {v.published_at.slice(0, 10)}</li>)}</ul>
            <p>Replaces “{preview.replaces}”: {preview.changes_vs_current!.length} changes in the latest version.</p></div>
          : <div className="errorBox" role="alert"><strong>Fix these before importing</strong><ul>{preview.errors.map(e => <li key={e}>{e}</li>)}</ul></div>)}
      </section>
      <section className="panel" aria-labelledby="pk-h">
        <h2 id="pk-h">Course versions</h2>
        <p>Active now: <strong>{pkgs?.active}</strong></p>
        <ul className="queueList">{pkgs?.packages.map(p => <li key={p.id}><div className="sectionHead"><strong>{p.title}</strong>{p.active ? <span className="tag ok">active</span>
          : <button className="outlineBtn" onClick={() => act(`/api/course/packages/${p.id}/activate`, 'Package activated.')}>Activate</button>}</div>
          <p className="meta mono">{p.imported_at} · {p.sha256.slice(0, 12)}…</p></li>)}</ul>
        {pkgs?.packages.length === 0 && <p className="empty">No packages imported. The fictional demo course is active.</p>}
        <button className="textBtn" onClick={() => act('/api/course/reset', 'Back to the fictional demo course.')}>Use the fictional demo course</button>
      </section>
    </div>
    <div className="twoCol sectionGap">
      <section className="panel" aria-labelledby="ln-h">
        <h2 id="ln-h">Learners ({learners.length})</h2>
        {learners.length === 0 ? <p className="empty">No learner has saved progress yet.</p> :
          <div className="tableWrap" role="region" tabIndex={0} aria-label="Learner progress"><table><thead><tr><th>Learner</th><th>Completed</th><th>Saves</th><th>Last active</th></tr></thead>
            <tbody>{learners.map(l => <tr key={l.learner_id}><td className="mono">{l.learner_id}</td><td>{l.completed}/{l.of}</td><td>{l.saves}</td><td>{l.updated_at}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="panel" aria-labelledby="in-h">
        <h2 id="in-h">What learners ask about</h2>
        {ins && <><p>{ins.coach_calls} coach questions: {ins.answered} answered from the notes, {ins.declined} declined. Declined questions point to gaps in the course notes.</p>
          <ul className="factList">{ins.top_sources.map(t => <li key={t.chunk}><span className="chip">{t.chunk}</span> {t.title}: cited {t.citations}×</li>)}</ul>
          <h3>Open questions in the queue ({ins.open_questions.length})</h3>
          {ins.open_questions.length ? <ul className="factList">{ins.open_questions.map((q, i) => <li key={i}>{q}</li>)}</ul> : <p className="muted">None.</p>}</>}
      </section>
    </div>
  </>;
}
