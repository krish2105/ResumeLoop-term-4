"use client";
import {useEffect, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {RiskRegister, RolePlay} from '@/components/RiskRegister';
import {Msg, useStudio} from '@/components/StudioBits';
import {assist, type AiLogEntry, type AiStatus} from '@/lib/assist';
import {DEMO} from '@/lib/client';

export default function EthicsPage() {
  const s = useStudio();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [log, setLog] = useState<{counts: Record<string, number>; entries: AiLogEntry[]} | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    assist.status().then(setStatus).catch(e => setErr(String(e)));
    assist.log().then(setLog).catch(e => setErr(String(e)));
  }, []);
  const notes = s.of('notes');
  const codes = s.of('codes');
  const aiCodes = codes.filter(c => c.origin === 'ai');
  const count = (xs: unknown[]) => xs.length;
  return <>
    <PageHead eyebrow="Design studio · week 10" title="Ethics and governance" intro="What the AI is, what it may and may not do, who consented to what, and a log of every AI call. This page is evidence for the governance part of the course." />
    {err && <div className="errorBox" role="alert">{err}</div>}
    <div className="twoCol">
      <section className="panel" aria-labelledby="card">
        <h2 id="card">Model card</h2>
        <dl className="kv">
          <dt>Generation model</dt><dd>{status?.gen_model || '…'} (open weights)</dd>
          <dt>Embedding model</dt><dd>{status?.embed_model || '…'}</dd>
          <dt>Where it runs</dt><dd>{DEMO ? 'Public demo: recorded answers only, no live model' : `On this computer through Ollama. Nothing goes to a cloud model. Status: ${status ? (status.available ? 'available' : 'offline') : '…'}`}</dd>
          <dt>Training</dt><dd>None. ResumeLoop trains no model and sends no data for training.</dd>
          <dt>Inputs it sees</dt><dd>The fictional course notes, the computed list of course changes, the learner's question, and research notes with analysis consent.</dd>
          <dt>Allowed to</dt><dd>Rephrase computed changes, answer from cited passages, draft a coordinator message, suggest codes and How might we questions.</dd>
          <dt>Not allowed to</dt><dd>Decide deadlines, schedule tasks (a deterministic planner does), send messages, accept its own codes, or answer without a source.</dd>
          <dt>Safeguards</dt><dd>Citations checked against retrieved passages; quotes checked against the note; facts it skips are added back; invalid output means a fallback or abstention; consent gates analysis.</dd>
          <dt>Known limits</dt><dd>A 7B local model can misphrase or over-summarise; English only; the course is fictional; small usability samples are formative only.</dd>
        </dl>
      </section>
      <section className="panel" aria-labelledby="hitl">
        <h2 id="hitl">Human in the loop</h2>
        <div className="statGrid miniStats">
          <div className="stat"><small>AI code suggestions</small><strong>{count(aiCodes)}</strong><span>{count(aiCodes.filter(c => c.status === 'accepted'))} accepted · {count(aiCodes.filter(c => c.status === 'rejected'))} rejected · {count(aiCodes.filter(c => c.status === 'suggested'))} waiting</span></div>
          <div className="stat"><small>Codes by people</small><strong>{count(codes.filter(c => c.origin === 'human'))}</strong><span>written by hand</span></div>
          <div className="stat"><small>Research notes</small><strong>{notes.length}</strong><span>{count(notes.filter(n => !n.synthetic))} real · {count(notes.filter(n => n.synthetic))} fictional</span></div>
          <div className="stat"><small>Analysis consent</small><strong>{count(notes.filter(n => n.consent?.anonymised_notes))}</strong><span>of {notes.length} notes · quotes allowed: {count(notes.filter(n => n.consent?.quotes))}</span></div>
        </div>
        <h3>Privacy measures</h3>
        <ul className="factList">
          <li>Participant codes only; notes with emails or phone numbers are rejected.</li>
          <li>AI suggestions require recorded consent to anonymised analysis.</li>
          <li>Fictional examples are flagged and can be removed in one step.</li>
          <li>Coordinator messages never leave the local queue.</li>
          <li>No sign-in and no tenancy yet, so the app is for fictional or consented, anonymised data on one computer.</li>
        </ul>
      </section>
    </div>
    <Msg text={s.msg} />
    <RiskRegister risks={s.of('risks')} run={s.run} />
    <RolePlay plays={s.of('roleplays')} run={s.run} />
    <section className="panel sectionGap" aria-labelledby="log-h">
      <h2 id="log-h">AI decision log</h2>
      {log && <p>{Object.entries(log.counts).map(([k, v]) => `${v} ${k}`).join(' · ') || 'No AI calls yet.'}{DEMO ? ' (recorded from the local app)' : ''}</p>}
      <div className="tableWrap" role="region" tabIndex={0} aria-label="AI decision log, scroll horizontally for all columns"><table><thead><tr><th>When</th><th>Feature</th><th>Model</th><th>Outcome</th><th>Detail</th></tr></thead><tbody>
        {(log?.entries || []).slice(0, 60).map(e => <tr key={e.id}><td>{e.created_at}</td><td>{e.feature}</td><td>{e.model}</td><td><span className={'status ' + (e.status === 'ok' ? 'approved' : 'blocked')}>{e.status}</span></td><td><code>{JSON.stringify(e.detail)}</code></td></tr>)}
      </tbody></table></div>
      <p className="muted">Prompts are stored only as SHA-256 hashes, so the log shows what happened without keeping the text.</p>
    </section>
  </>;
}
