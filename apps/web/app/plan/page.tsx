"use client";
import Link from 'next/link';
import {PageHead} from '@/components/AppShell';
import {SaveBadge, Warnings} from '@/components/JourneyBits';
import {STATE_LABEL} from '@/lib/road';
import {useJourney} from '@/lib/useJourney';

export default function PlanPage() {
  const j = useJourney();
  const plan = j.plan;
  return <>
    <PageHead eyebrow="List view of your journey" title="Your recovery plan" intro="The same plan as the 3D road, as an accessible list. The planner is deterministic: it explains every task it includes or leaves out.">
      <SaveBadge state={j.save} onReload={j.reload} />
    </PageHead>
    {j.error && <div className="errorBox" role="alert">{j.error} <button className="outlineBtn" onClick={j.reload}>Retry</button></div>}
    {j.loading && <p className="empty">Loading your progress…</p>}
    {plan && j.progress && <>
      <section className="panel planControls">
        <label htmlFor="budget2" className="fieldLabel">Time you have now: {j.progress.state.budget_minutes} minutes</label>
        <input id="budget2" type="range" min={0} max={180} step={5} value={j.progress.state.budget_minutes} onChange={e => j.setBudget(Number(e.target.value))} />
        <p>{plan.sequence.length ? `${plan.sequence.length} tasks planned, ${plan.planned_minutes} of ${plan.budget_minutes} minutes used, ${plan.remaining_minutes} left.` : plan.empty_reason}</p>
        <Warnings warnings={plan.warnings} />
        {j.progress.state.seen_version !== j.course?.version && <p><Link href="/digest">The course changed since your last visit. See what changed.</Link></p>}
      </section>
      <section className="panel" aria-labelledby="tonight">
        <h2 id="tonight">Planned now, in order</h2>
        {plan.sequence.length === 0 ? <p className="empty">{plan.empty_reason}. Try a larger time budget.</p> :
          <ol className="planList">{plan.sequence.map(id => plan.items.find(i => i.id === id)!).map(i => <li key={i.id}>
            <div><strong>{i.title}</strong><small>{i.minutes} min · session {i.session} · {i.reason}</small></div>
            <div className="rowActions"><button className="outlineBtn" onClick={() => j.start(j.progress?.state.current_action === i.id ? null : i.id)}>{j.progress?.state.current_action === i.id ? 'Stop' : 'Start'}</button>
              <button className="primaryBtn" onClick={() => j.toggleComplete(i.id)}>Mark complete</button></div></li>)}</ol>}
      </section>
      <section className="panel" aria-labelledby="all">
        <h2 id="all">Every task in the course ({plan.version})</h2>
        <div className="tableWrap"><table><thead><tr><th>Task</th><th>State</th><th>Why</th><th>Done</th></tr></thead><tbody>
          {plan.items.map(i => <tr key={i.id}><td><strong>{i.title}</strong><small className="block">Session {i.session} · {i.kind} · {i.minutes ?? '?'} min</small></td>
            <td><span className={'status state-' + (i.id === plan.next_action ? 'next' : i.state)}>{i.id === plan.next_action ? 'Next' : STATE_LABEL[i.state]}</span></td>
            <td>{i.reason}</td>
            <td><input type="checkbox" aria-label={`Completed: ${i.title}`} checked={i.state === 'completed'} onChange={() => j.toggleComplete(i.id)} /></td></tr>)}
        </tbody></table></div>
      </section>
      <section className="panel">
        <h2>Start over</h2><p>Resets this demo learner to the fictional starting point.</p>
        <button className="outlineBtn" onClick={() => { if (confirm('Reset progress to the fictional starting point?')) j.reset(); }}>Reset progress</button>
      </section>
    </>}
  </>;
}
