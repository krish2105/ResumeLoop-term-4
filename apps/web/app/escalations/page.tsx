"use client";
import {useSearchParams} from 'next/navigation';
import {Suspense, useEffect, useState} from 'react';
import {AiBadge} from '@/components/AiBadge';
import {PageHead} from '@/components/AppShell';
import {assist, newKey, type Draft, type Escalation} from '@/lib/assist';

export default function EscalationsPage() {
  return <Suspense fallback={<p className="empty">Loading the queue…</p>}><Queue /></Suspense>;
}

function Queue() {
  const params = useSearchParams();
  const [question, setQuestion] = useState(params.get('q') || '');
  const about = params.get('about');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [approved, setApproved] = useState(false);
  const [key, setKey] = useState(newKey());
  const [items, setItems] = useState<Escalation[]>([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [coordinator, setCoordinator] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const refresh = () => assist.escalations().then(setItems).catch(e => setMsg(String(e)));
  useEffect(() => { refresh(); }, []);
  const makeDraft = async () => {
    if (question.trim().length < 3) { setMsg('Write your question first.'); return; }
    setBusy('draft'); setMsg('');
    try { const d = await assist.draft(question.trim(), about); setDraft(d); setSubject(d.subject); setBody(d.body); setApproved(false); setKey(newKey()); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };
  const queue = async () => {
    if (!approved) { setMsg('Tick the approval box first.'); return; }
    if (subject.trim().length < 3 || body.trim().length < 20) { setMsg('The subject needs 3+ characters and the message 20+.'); return; }
    setBusy('queue'); setMsg('');
    try {
      const e = await assist.createEscalation({idempotency_key: key, subject: subject.trim(), body: body.trim(), about,
        drafted_by: draft && (subject !== draft.subject || body !== draft.body) ? 'learner' : (draft?.mode || 'learner')});
      setMsg(e.replayed ? 'Already queued, nothing duplicated.' : 'Queued locally. Nothing was sent anywhere.');
      setDraft(null); setQuestion(''); setApproved(false); await refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };
  const update = async (id: string, status: 'answered' | 'withdrawn') => {
    if (status === 'answered' && (answers[id] || '').trim().length < 3) { setMsg('Write the coordinator answer first.'); return; }
    try { await assist.updateEscalation(id, status, answers[id]); await refresh(); setMsg(status === 'answered' ? 'Answer recorded.' : 'Request withdrawn.'); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  };
  return <>
    <PageHead eyebrow="Learner" title="Coordinator queue" intro="When the coach can't answer, draft a question for the coordinator. The AI writes a first draft; you edit and approve it. It then waits in a local queue. Nothing is ever emailed or sent." />
    {msg && <div className="toast" role="status">{msg}</div>}
    <section className="panel" aria-labelledby="compose">
      <h2 id="compose">New question</h2>
      <label htmlFor="eq" className="fieldLabel">What do you need to know?</label>
      <textarea id="eq" rows={2} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Which date is correct for the reading check quiz?" />
      <button className="outlineBtn" onClick={makeDraft} disabled={busy === 'draft'}>{busy === 'draft' ? 'Drafting…' : 'Draft the message'}</button>
      {draft && <div className="draftBox">
        <AiBadge mode={draft.mode} model={draft.model} />
        <label htmlFor="es" className="fieldLabel">Subject</label><input id="es" value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />
        <label htmlFor="eb" className="fieldLabel">Message</label><textarea id="eb" rows={5} value={body} onChange={e => setBody(e.target.value)} maxLength={1200} />
        <label className="checkRow"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} /> I have read this message and want it queued for the coordinator.</label>
        <button className="primaryBtn" onClick={queue} disabled={busy === 'queue'}>{busy === 'queue' ? 'Queuing…' : 'Approve and queue'}</button>
        <p className="muted">{draft.notice}</p>
      </div>}
    </section>
    <section className="panel" aria-labelledby="queued">
      <div className="sectionHead"><h2 id="queued">Queue ({items.length})</h2>
        <label className="checkRow"><input type="checkbox" checked={coordinator} onChange={e => setCoordinator(e.target.checked)} /> Coordinator view (role-play on this computer)</label></div>
      {items.length === 0 ? <p className="empty">No questions yet. Ask the coach first, or write one above.</p> :
        <ul className="queueList">{items.map(e => <li key={e.id}>
          <div className="sectionHead"><strong>{e.subject}</strong><span className={'status q-' + e.status}>{e.status}</span></div>
          <p>{e.body}</p>
          <p className="muted">Drafted by {e.drafted_by} · {e.created_at} · delivery: {e.external_delivery}</p>
          {e.answer && <p className="evidence">Coordinator answer: {e.answer}</p>}
          {e.status === 'queued' && <div className="rowActions">
            {coordinator && <><label htmlFor={'a-' + e.id} className="sr-only">Answer</label><input id={'a-' + e.id} placeholder="Coordinator answer" value={answers[e.id] || ''} onChange={x => setAnswers(a => ({...a, [e.id]: x.target.value}))} />
              <button className="primaryBtn" onClick={() => update(e.id, 'answered')}>Record answer</button></>}
            <button className="outlineBtn" onClick={() => update(e.id, 'withdrawn')}>Withdraw</button></div>}
        </li>)}</ul>}
    </section>
  </>;
}
