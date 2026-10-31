"use client";
import {useEffect, useMemo, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {LocalOnly} from '@/components/LocalOnly';
import {API, DEMO} from '@/lib/client';

type RecordRow = {id: string; title: string; subtitle: string; metric_value: string; metric_label: string; status: string; evidence: string; source_type: string};

export default function ReviewPage() {
  if (DEMO) return <LocalOnly title="Review queue" />;
  return <ReviewQueue />;
}

function ReviewQueue() {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [note, setNote] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const reload = async () => {
    const r = await fetch(API + '/api/demo/records', {signal: AbortSignal.timeout(10000)});
    if (!r.ok) throw Error('API returned ' + r.status);
    const data: RecordRow[] = await r.json();
    setRows(data); setSelected(cur => data.some(x => x.id === cur) ? cur : (data[0]?.id || ''));
  };
  useEffect(() => { reload().catch(e => setMsg('API is unavailable: ' + String(e))).finally(() => setLoading(false)); }, []);
  useEffect(() => { setNote(''); }, [selected]);
  const active = rows.find(r => r.id === selected) || null;
  const filtered = useMemo(() => rows.filter(r => (status === 'all' || r.status === status) && (r.title + ' ' + r.subtitle + ' ' + r.id).toLowerCase().includes(search.toLowerCase())), [rows, status, search]);
  const save = async () => {
    if (!active) return;
    setSaving(true); setMsg('');
    try {
      const r = await fetch(API + '/api/demo/reviews', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({record_id: active.id, status: reviewStatus, note: note.trim()})});
      if (!r.ok) throw Error(await r.text());
      await reload(); setNote(''); setMsg('Review saved to the local database.');
    } catch (e) { setMsg('Review failed: ' + String(e)); } finally { setSaving(false); }
  };
  return <>
    <PageHead eyebrow="Data" title="Review queue" intro="Synthetic review records from the original prototype. Imported rows land here." />
    {msg && <div role="status" className="toast">{msg}</div>}
    <div className="reviewLayout">
      <section className="panel">
        <div className="filters"><input aria-label="Search cases" placeholder="Search cases and records…" value={search} onChange={e => setSearch(e.target.value)} />
          <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="needs-review">Needs review</option><option value="blocked">Blocked</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
          <span>{filtered.length} of {rows.length}</span></div>
        <div className="tableWrap"><table><thead><tr><th>Case</th><th>Evidence summary</th><th>Demo metric</th><th>Status</th></tr></thead><tbody>
          {filtered.map(r => <tr key={r.id} className={selected === r.id ? 'selected' : ''}><td><button className="rowBtn" onClick={() => setSelected(r.id)}><strong>{r.title}</strong><small>{r.id}</small></button></td><td>{r.subtitle}</td><td><strong>{r.metric_value}</strong> <span className="muted">{r.metric_label}</span></td><td><span className={'status ' + r.status}>{r.status.replaceAll('-', ' ')}</span></td></tr>)}
        </tbody></table>
          {!loading && filtered.length === 0 && <p className="empty">No demo cases match this filter.</p>}{loading && <p className="empty">Loading local sample records…</p>}</div>
      </section>
      {active && <aside className="panel inspectorPanel" aria-label="Record inspector">
        <span className="eyebrow">Record details · {active.source_type}</span><h2>{active.title}</h2><p>{active.subtitle}</p>
        <div className="evidence">{active.evidence}</div>
        <div className="meta"><span>Record ID</span><code>{active.id}</code></div><div className="meta"><span>Status</span><strong>{active.status.replaceAll('-', ' ')}</strong></div>
        <div className="review"><label htmlFor="reviewstatus">Disposition</label><select id="reviewstatus" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}><option value="approved">Approved</option><option value="needs-review">Needs review</option><option value="blocked">Blocked</option><option value="rejected">Rejected</option></select>
          <label htmlFor="reviewnote">Review rationale</label><textarea maxLength={2000} id="reviewnote" value={note} onChange={e => setNote(e.target.value)} placeholder="Explain why this is the correct disposition…" rows={4} />
          <button className="primaryBtn" disabled={saving || note.trim().length < 3} onClick={save}>{saving ? 'Saving…' : 'Save review'}</button></div>
      </aside>}
    </div>
  </>;
}
