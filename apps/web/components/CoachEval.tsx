import fixtures from '@/demo/fixtures.json';

type Row = {kind: string; q: string; mode: string; hit?: boolean; abstained?: boolean; safe?: boolean; citations?: string[]; expect?: string[]; seconds: number};
type Eval = {run_at: string; model: string; embed_model: string; metrics: Record<string, number | null>; rows: Row[]} | null;

const pct = (x: number | null | undefined) => (x == null ? '—' : `${Math.round(x * 100)}%`);

/** Results of scripts/eval_coach.py: a fixed gold set run against the local model, recorded with its date. */
export function CoachEval() {
  const ev = (fixtures as unknown as {coach_eval?: Eval}).coach_eval;
  const n = (k: string) => ev ? ev.rows.filter(r => r.kind === k).length : 0;
  return <section className="panel sectionGap" aria-labelledby="ev-h">
    <h2 id="ev-h">Coach evaluation</h2>
    {!ev ? <p className="empty">Not run yet. Run scripts/eval_coach.py with Ollama, then rebuild the fixtures.</p> : <>
      <p>{ev.rows.length} fixed questions (data/eval/coach_gold.json) run against {ev.model} with {ev.embed_model} on {ev.run_at.slice(0, 10)}.</p>
      <div className="statGrid miniStats4">
        <div className="stat"><small>Answered when it should</small><strong>{pct(ev.metrics.answer_rate)}</strong><span>{n('answerable')} answerable questions</span></div>
        <div className="stat"><small>Cited the right passage</small><strong>{pct(ev.metrics.citation_hit_rate)}</strong><span>of the answers given</span></div>
        <div className="stat"><small>Declined when it should</small><strong>{pct(ev.metrics.abstain_rate)}</strong><span>{n('unanswerable')} out-of-scope questions</span></div>
        <div className="stat"><small>Resisted injection</small><strong>{pct(ev.metrics.injection_safe)}</strong><span>{n('injection')} manipulation attempts</span></div>
      </div>
      <details className="sectionGap"><summary>Every question and outcome</summary>
        <div className="tableWrap" role="region" tabIndex={0} aria-label="Evaluation rows, scroll horizontally"><table><thead><tr><th>Type</th><th>Question</th><th>Outcome</th><th>Seconds</th></tr></thead><tbody>
          {ev.rows.map((r, i) => <tr key={i}><td>{r.kind}</td><td>{r.q}</td>
            <td>{r.kind === 'answerable' ? (r.mode === 'ai' ? (r.hit ? `cited ${r.citations?.join(', ')}` : `answered, wrong source (${r.citations?.join(', ') || 'none'})`) : 'declined (missed)')
              : r.kind === 'unanswerable' ? (r.abstained ? 'declined (correct)' : 'answered (wrong)') : (r.safe ? 'safe' : 'unsafe output')}</td><td className="mono">{r.seconds}</td></tr>)}
        </tbody></table></div></details>
      {ev.metrics.quote_validity != null && <p className="muted">Code suggestions: {pct(ev.metrics.quote_validity)} quoted the note exactly (the rest were rejected automatically). Digest grouped {pct(ev.metrics.digest_coverage_before_repair)} of changes before missing facts were re-added.</p>}
      <p className="muted">A small fixed set on fictional notes. CI replays this exact recording on every push; it catches regressions, it does not prove real-world accuracy.</p>
    </>}
  </section>;
}
