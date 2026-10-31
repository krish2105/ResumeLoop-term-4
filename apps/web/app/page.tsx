"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {useTheme} from '@/components/AppShell';
import {SaveBadge, Warnings} from '@/components/JourneyBits';
import {hasWebGL, roadNodes, STATE_LABEL} from '@/lib/road';
import {useJourney} from '@/lib/useJourney';

const NightRoad = dynamic(() => import('@/components/NightRoad'), {ssr: false, loading: () => <div className="roadLoading">Lighting the road…</div>});

export default function JourneyPage() {
  const j = useJourney();
  const {resolved, reducedMotion} = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => setWebgl(hasWebGL()), []);
  const nodes = useMemo(() => (j.plan ? roadNodes(j.plan) : []), [j.plan]);
  const item = j.plan?.items.find(i => i.id === (selected ?? j.plan?.next_action));
  const changed = j.course && j.progress && j.progress.state.seen_version !== j.course.version;

  if (j.error) return <div className="journey"><div className="panel roadError" role="alert"><h2>The road could not load</h2><p>{j.error}</p><button className="primaryBtn" onClick={j.reload}>Retry</button></div></div>;
  return <div className="journey">
    <h1 className="sr-only">Your recovery journey</h1>
    <div className="roadStage">
      {webgl === false ? <div className="roadFallback panel"><h2>3D view unavailable</h2><p>This browser cannot draw WebGL. The same plan is available as a list.</p><Link className="primaryBtn" href="/plan">Open the list view</Link></div>
        : j.plan && webgl ? <NightRoad nodes={nodes} selected={selected} onSelect={setSelected} theme={resolved} reducedMotion={reducedMotion} />
        : <div className="roadLoading">{j.loading ? 'Loading your progress…' : 'Preparing the road…'}</div>}
    </div>

    <section className="roadPanel roadTop" aria-label="Time budget">
      <div className="budgetRow">
        <label htmlFor="budget"><span className="eyebrow">Time you have now</span><strong>{j.progress?.state.budget_minutes ?? '—'} min</strong></label>
        <SaveBadge state={j.save} onReload={j.reload} />
      </div>
      <input id="budget" type="range" min={0} max={180} step={5} value={j.progress?.state.budget_minutes ?? 60}
        onChange={e => j.setBudget(Number(e.target.value))} aria-describedby="budget-help" disabled={!j.progress} />
      <p id="budget-help" className="muted">{j.plan ? (j.plan.sequence.length ? `${j.plan.sequence.length} tasks lit, ${j.plan.planned_minutes} of ${j.plan.budget_minutes} min used.` : j.plan.empty_reason) : 'Planning…'}</p>
      {changed && <Link className="changeBanner" href="/digest">The course changed ({j.progress!.state.seen_version} → {j.course!.version}). See what changed</Link>}
      {j.plan && <Warnings warnings={j.plan.warnings} />}
    </section>

    <section className="roadPanel roadList" aria-label="Stars on your road">
      <h2>Stars on your road</h2>
      <ol className="starList">
        {nodes.map(n => <li key={n.id}><button className={'starBtn ' + n.state + (selected === n.id ? ' selected' : '')} aria-pressed={selected === n.id} onClick={() => setSelected(n.id)}>
          <span className={'stateDot ' + n.state} aria-hidden="true" /><span>{n.title}</span><small>{STATE_LABEL[n.state]}{n.minutes ? ` · ${n.minutes} min` : ''}</small></button></li>)}
      </ol>
      <p className="legend"><span className="stateDot completed" aria-hidden="true" />Completed <span className="stateDot next" aria-hidden="true" />Next <span className="stateDot planned" aria-hidden="true" />Planned <span className="stateDot locked" aria-hidden="true" />Locked or later</p>
    </section>

    {item && <section className="roadPanel roadDetail" aria-label="Selected task" aria-live="polite">
      <span className="eyebrow">Session {item.session} · {item.kind}</span>
      <h2>{item.title}</h2>
      <p>{item.reason}{item.minutes ? ` · ${item.minutes} min` : ''}</p>
      {item.due && <p className={'dueLine ' + item.due_status}>Due {new Date(item.due).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai'})} (Dubai) · {item.due_status === 'verified' ? 'verified by coordinator' : item.due_status === 'conflict' ? 'sources disagree' : 'not verified'}</p>}
      <div className="detailActions">
        <button className="primaryBtn" onClick={() => j.toggleComplete(item.id)} disabled={item.state === 'locked'}>{item.state === 'completed' ? 'Mark as not done' : 'Mark complete'}</button>
        {item.state !== 'completed' && <button className="outlineBtn" onClick={() => j.start(j.progress?.state.current_action === item.id ? null : item.id)}>{j.progress?.state.current_action === item.id ? 'Stop' : 'Start now'}</button>}
        <Link className="outlineBtn" href={`/coach?about=${item.id}`}>Ask the coach</Link>
      </div>
      <p className="muted">Source {item.source_ref} · fictional course {j.plan?.version}</p>
    </section>}
  </div>;
}
