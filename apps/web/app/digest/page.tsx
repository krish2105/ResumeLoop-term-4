"use client";
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {AiBadge} from '@/components/AiBadge';
import {PageHead} from '@/components/AppShell';
import {assist, type Digest} from '@/lib/assist';
import {useJourney} from '@/lib/useJourney';

export default function DigestPage() {
  const j = useJourney();
  const [digest, setDigest] = useState<Digest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = j.progress?.state.seen_version;
  const latest = j.course?.version;
  const load = async (version: string) => {
    setLoading(true); setError('');
    try { setDigest(await assist.digest(version)); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (from && latest && from !== latest && !digest && !loading) load(from); }, [from, latest]); // eslint-disable-line react-hooks/exhaustive-deps
  const upToDate = from && latest && from === latest;
  return <>
    <PageHead eyebrow="Learner" title="What changed since you left" intro="The exact list of changes comes from comparing course versions in code. The local AI only rewrites it in plain English, and anything it leaves out is added back word for word." />
    {j.loading && <p className="empty">Loading your progress…</p>}
    {upToDate && !digest && <section className="panel"><h2>You're up to date</h2><p>You have seen course version {latest}.</p>
      <button className="outlineBtn" onClick={() => load('v1')}>Show the v1 → {latest} changes again</button></section>}
    {loading && <section className="panel" aria-busy="true"><h2>Reading the changes…</h2><p>The local model is summarising {from} → {latest}. This takes about 10 to 20 seconds on this computer.</p></section>}
    {error && <div className="errorBox" role="alert">{error} <button className="outlineBtn" onClick={() => from && load(from)}>Retry</button></div>}
    {digest && <div className="twoCol">
      <section className="panel" aria-labelledby="sum">
        <div className="sectionHead"><h2 id="sum">In plain English</h2><AiBadge mode={digest.mode} model={digest.model} recordedAt={digest.recorded_at} /></div>
        <p className="lead">{digest.summary}</p>
        <ul className="digestList">{digest.items.map((it, i) => <li key={i}><p>{it.text}</p>
          <span className="chips">{it.change_ids.map(id => <span key={id} className="chip">{id}</span>)}{it.from_facts && <span className="chip warnChip">added back from the facts</span>}</span></li>)}</ul>
        {!!digest.repaired && <p className="muted">The model skipped {digest.repaired} change{digest.repaired > 1 ? 's' : ''}; the exact wording was added back.</p>}
        <div className="detailActions">
          <button className="primaryBtn" onClick={() => latest && j.markSeen(latest)} disabled={!latest || from === latest}>{from === latest ? 'Marked as seen' : `Got it, use ${latest}`}</button>
          <Link className="outlineBtn" href="/">Back to the road</Link>
        </div>
      </section>
      <section className="panel" aria-labelledby="facts">
        <h2 id="facts">Exact changes ({digest.from} → {digest.to})</h2>
        <p className="muted">Computed by comparing the two versions. This list is the source of truth.</p>
        <ol className="factList">{digest.facts.map(f => <li key={f.id}><span className="chip">{f.id}</span> {f.fact}</li>)}</ol>
      </section>
    </div>}
  </>;
}
