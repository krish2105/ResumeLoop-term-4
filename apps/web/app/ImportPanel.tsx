"use client";

import {useEffect, useRef, useState} from 'react';

const DRAFT_KEY = 'ResumeLoop-import-draft-v1';
const TEMPLATE = 'id,title,subtitle,metric_value,metric_label,status,evidence\nD-CUSTOM-001,Review the recap,Synthetic study session,15,minutes,ready,SYNTHETIC example only\n';
type Row = {id: string; title: string; subtitle: string; metric_value: string; metric_label: string; status: string; evidence: string};
type Preview = {sha256: string; schema_version: string; row_count: number; rows: Row[]};
type Receipt = {id: string; sha256: string; schema_version: string; source_type: string; created_at: string; upserted: number; created: number; updated: number; review_statuses_preserved: number; replayed?: boolean; rows?: Row[]};
type Issue = {row: number; field: string; message: string};

export default function ImportPanel({api, onSaved}: {api: string; onSaved: () => Promise<void>}) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState('Loading local draft…');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [history, setHistory] = useState<Receipt[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [busy, setBusy] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const previewRef = useRef<HTMLElement>(null);
  const receiptRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
    else if (receipt) receiptRef.current?.focus();
    else if (preview) previewRef.current?.focus();
  }, [error, receipt, preview]);

  const loadHistory = async () => {
    setHistoryLoading(true); setHistoryError('');
    try {
      const response = await fetch(api + '/api/demo/imports', {signal: AbortSignal.timeout(10000)});
      if (!response.ok) throw Error('History unavailable');
      setHistory(await response.json());
    } catch { setHistoryError('Saved import history is unavailable. Check the local API and retry.'); }
    finally { setHistoryLoading(false); }
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {setText(saved); setDraft('Draft restored on this device. Preview it again before saving.');}
      else setDraft('Drafts stay on this device. Use fictional data only.');
    } catch {setDraft('Browser storage is unavailable. Keep a copy before leaving this page.');}
    void loadHistory();
  // This panel remounts when navigating back, restoring its local draft.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const edit = (value: string) => {
    setText(value); setPreview(null); setReceipt(null); setIssues([]); setError(''); setNotice('');
    try {
      if (value) localStorage.setItem(DRAFT_KEY, value); else localStorage.removeItem(DRAFT_KEY);
      setDraft(value ? 'Draft saved on this device · not yet imported' : 'Local draft cleared.');
    } catch {setDraft('Draft could not be saved on this device. Keep a copy before leaving.');}
  };
  const request = async (save: boolean) => {
    setBusy(save ? 'save' : 'preview'); setError(''); setIssues([]); setNotice('');
    try {
      const response = await fetch(api + (save ? '/api/demo/import' : '/api/demo/import/preview'), {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({csv_text: text}), signal: AbortSignal.timeout(10000)
      });
      const data = await response.json();
      if (!response.ok) {
        setPreview(null);
        setIssues(data.detail?.errors || []);
        setError(data.detail?.message || 'Nothing saved. Check the template and input size (maximum 150,000 characters).');
        return;
      }
      if (!save) {setPreview(data); setReceipt(null); setNotice('Validation passed. Review the rows before saving.');}
      else {
        setReceipt(data); setPreview(null);
        setNotice(data.replayed ? 'Already saved. The original receipt was recovered; no records changed.' : 'Import saved to the local database. Your receipt is below.');
        await loadHistory();
        try {await onSaved();} catch {setNotice('Import saved. The work queue could not refresh; reload it when the API is available.');}
      }
    } catch {
      setError(save ? 'The save could not be confirmed. Keep this input and retry: an identical retry recovers the receipt without duplicating changes.' : 'Could not reach the local API. Your input is still here. Check the connection and preview again.');
    } finally {setBusy('');}
  };
  const openReceipt = async (item: Receipt) => {
    setBusy('receipt'); setError('');
    try {
      const response = await fetch(api + '/api/demo/imports/' + item.id, {signal: AbortSignal.timeout(10000)});
      if (!response.ok) throw Error('Receipt unavailable');
      setReceipt(await response.json()); setPreview(null);
    } catch {setError('Could not load this receipt. Retry from the history below.');}
    finally {setBusy('');}
  };

  return <div className="importFlow">
    <section className="panel">
      <span className="eyebrow">01 / PREPARE YOUR SOURCE</span>
      <h2>Bring your next steps into focus</h2>
      <p>Try the import journey with fictional study tasks. Real learner records and official deadlines are not supported yet.</p>
      <div className="sourceNote"><strong>Synthetic workspace</strong><p>Seven required columns, at most 250 rows. IDs start with D-. Metrics must be nonnegative numbers. Existing review decisions are preserved when source details change.</p></div>
      <div className="importTools">
        <button className="outlineBtn" disabled={!!busy} onClick={() => edit(TEMPLATE)}>Use sample CSV</button>
        <a className="outlineBtn" download="resumeloop-synthetic-template.csv" href={'data:text/csv;charset=utf-8,' + encodeURIComponent(TEMPLATE)}>Download template</a>
        <button className="textBtn" disabled={!!busy || !text} onClick={() => edit('')}>Clear draft</button>
      </div>
      <label className="fieldLabel" htmlFor="csv-source">Synthetic CSV</label>
      <textarea id="csv-source" className="csvEditor" value={text} onChange={e => edit(e.target.value)} disabled={!!busy} rows={8} maxLength={150000} spellCheck={false} aria-describedby="csv-help draft-status" aria-invalid={issues.length > 0} placeholder={TEMPLATE}/>
      <p id="csv-help" className="hint">Required headers: id, title, subtitle, metric_value, metric_label, status, evidence. Row numbers count CSV records, including the header.</p>
      <p id="draft-status" className="hint" role="status">{draft}</p>
      {error && <div className="errorBox" role="alert" tabIndex={-1} ref={errorRef}><strong>{error}</strong>{issues.length > 0 && <ul>{issues.map((issue, index) => <li key={index}>Row {issue.row} · {issue.field}: {issue.message}</li>)}</ul>}</div>}
      {notice && <p className="toast" role="status">{notice}</p>}
      <button className="primaryBtn" disabled={!!busy || !text.trim()} onClick={() => request(false)}>{busy === 'preview' ? 'Checking source…' : 'Preview & validate'}</button>
    </section>
    {preview && <section className="panel" aria-label="Validated preview" tabIndex={-1} ref={previewRef}>
      <span className="eyebrow">02 / REVIEW BEFORE SAVING</span><h2>{preview.row_count} valid {preview.row_count === 1 ? 'row' : 'rows'}</h2>
      <p>Nothing has been imported yet. Matching IDs update source details; reviewed statuses remain unchanged. Editing the CSV requires a new preview.</p>
      <SourceRows rows={preview.rows}/>
      <p className="hint">Schema {preview.schema_version} · SHA-256 <code className="fingerprint">{preview.sha256}</code></p>
      <button className="primaryBtn" disabled={!!busy} onClick={() => request(true)}>{busy === 'save' ? 'Saving…' : 'Save synthetic import'}</button>
    </section>}
    {receipt && <section className="panel receipt" aria-label="Saved import receipt" tabIndex={-1} ref={receiptRef}>
      <span className="eyebrow">03 / SAVED RECEIPT</span><h2>{receipt.replayed ? 'Original import recovered' : 'Source saved'}</h2>
      <p>{receipt.created} created · {receipt.updated} updated · {receipt.review_statuses_preserved} review {receipt.review_statuses_preserved === 1 ? 'status' : 'statuses'} preserved</p>
      <dl><dt>Import ID</dt><dd>{receipt.id}</dd><dt>Saved at</dt><dd>{receipt.created_at}</dd><dt>Source</dt><dd>{receipt.source_type} · {receipt.schema_version}</dd><dt>SHA-256 of original input</dt><dd className="fingerprint">{receipt.sha256}</dd></dl>
      {receipt.rows && <><h3>Source snapshot at import</h3><SourceRows rows={receipt.rows}/><p className="hint">Later review decisions can differ from the original source status.</p></>}
    </section>}
    <section className="panel" aria-label="Import history"><div className="sectionHead"><div><span className="eyebrow">YOUR LOCAL RECORD</span><h2>Import history</h2></div><button className="outlineBtn" disabled={historyLoading || !!busy} onClick={loadHistory}>Refresh history</button></div>
      {historyLoading ? <p role="status">Loading saved receipts…</p> : historyError ? <p role="alert" className="errorBox">{historyError}</p> : history.length === 0 ? <p>No imports saved yet. Start with the sample CSV above.</p> : <ul className="historyList">{history.map(item => <li key={item.id}><div><strong>{item.upserted} synthetic {item.upserted === 1 ? 'row' : 'rows'}</strong><small>{item.created_at} · {item.created} new, {item.updated} updated</small></div><button className="outlineBtn" disabled={!!busy} onClick={() => openReceipt(item)} aria-label={'Open receipt ' + item.id}>View receipt</button></li>)}</ul>}
      <p className="hint">Latest 100 imports. Records and receipts are stored in the local demonstration database.</p>
    </section>
  </div>;
}

function SourceRows({rows}: {rows: Row[]}) {
  return <div className="tableWrap" role="region" tabIndex={0} aria-label="Source rows, scroll horizontally for all fields"><table><caption className="sr-only">Validated synthetic source rows</caption><thead><tr><th scope="col">ID / title</th><th scope="col">Context</th><th scope="col">Metric / unit</th><th scope="col">Source status</th><th scope="col">Evidence</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.title}</strong><small className="block">{row.id}</small></td><td>{row.subtitle}</td><td>{row.metric_value} {row.metric_label}</td><td>{row.status}</td><td>{row.evidence}</td></tr>)}</tbody></table></div>;
}
