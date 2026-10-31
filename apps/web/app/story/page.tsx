"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTheme} from '@/components/AppShell';
import {Splitter, useResizable} from '@/components/Splitter';
import {useStudio} from '@/components/StudioBits';
import {hasWebGL} from '@/lib/road';
import {computeCounts, STOPS, type Counts} from '@/lib/story';
import {useJourney} from '@/lib/useJourney';

const StoryScene = dynamic(() => import('@/components/StoryScene'), {ssr: false, loading: () => <div className="roadLoading">Lighting the constellations…</div>});

export default function StoryPage() {
  const s = useStudio();
  const j = useJourney();
  const {resolved, reducedMotion} = useTheme();
  const [index, setIndex] = useState(0);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [presenters, setPresenters] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const panel = useResizable('story-panel', {initial: 420, min: 320, max: 600, edge: 'right'});
  useEffect(() => { setWebgl(hasWebGL()); try { setPresenters(JSON.parse(localStorage.getItem('rl-presenters') || '{}')); setNotes(JSON.parse(localStorage.getItem('rl-presenter-notes') || '{}')); } catch { /* ignore */ } }, []);
  const setNote = (key: string, text: string) => setNotes(p => { const n = {...p, [key]: text}; try { localStorage.setItem('rl-presenter-notes', JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const setPresenter = (key: string, name: string) => setPresenters(p => { const n = {...p, [key]: name}; try { localStorage.setItem('rl-presenters', JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const counts = useMemo<Counts>(() => computeCounts(s.of, j.plan), [s, j.plan]);
  const stops = STOPS.map(st => ({key: st.key, title: st.title, evidence: st.evidence(counts)}));
  const go = useCallback((d: number) => setIndex(i => Math.max(0, Math.min(STOPS.length - 1, i + d))), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea,select,button,[role=separator]')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [go]);
  const stop = STOPS[index];
  return <div className={'journey2' + (panel.collapsed ? ' panelCollapsed' : '')} style={{'--panelW': `${panel.size}px`} as React.CSSProperties}>
    <h1 className="sr-only">Story mode: the ResumeLoop design thinking journey</h1>
    <section className="stage3d" aria-label="3D story view">{webgl === false ? <div className="roadFallback panel"><h2>3D view unavailable</h2><p>The panel contains everything the 3D view shows.</p></div>
      : webgl ? <StoryScene stops={stops} index={index} theme={resolved} reducedMotion={reducedMotion} /> : null}
      <div className="hud" aria-hidden="true"><span className="mono">{index + 1}/{STOPS.length}</span> {stop.title}</div>
      {panel.collapsed && <button className="outlineBtn showPanel" onClick={() => panel.setCollapsed(false)}>Show panel</button>}
    </section>
    <Splitter r={panel} label="Resize the story panel" controls="story-panel" />
    <aside className="roadSide" id="story-panel" aria-label="Story stop">
      <section className="sideCard detailCard storyCard" aria-live="polite" aria-label={`Stop ${index + 1} of ${STOPS.length}`}>
        <span className="eyebrow">Stop {index + 1} of {STOPS.length}</span>
        <h2>{stop.title}</h2>
        <p>{stop.method}</p>
        <ul className="factList">{stop.lines(counts).map(l => <li key={l}>{l}</li>)}</ul>
        <label className="nameField">Presenter for this stop<input value={presenters[stop.key] || ''} onChange={e => setPresenter(stop.key, e.target.value)} placeholder="Name (optional)" /></label>
        <label className="nameField">Speaker notes (saved on this device)<textarea rows={3} value={notes[stop.key] || ''} onChange={e => setNote(stop.key, e.target.value)} placeholder="The one point to make here, and the evidence you will show" /></label>
        <div className="detailActions">
          <button className="outlineBtn" onClick={() => go(-1)} disabled={index === 0}>Previous</button>
          <button className="primaryBtn" onClick={() => go(1)} disabled={index === STOPS.length - 1}>Next stop</button>
          <Link className="textBtn" href={stop.href}>Open the evidence</Link>
          <Link className="textBtn" href="/deck">Export slides</Link>
        </div>
        <ol className="storyDots" aria-label="Stops">{STOPS.map((st, i) => <li key={st.key}><button aria-current={i === index ? 'step' : undefined} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} aria-label={`Go to ${st.title}`}>{i + 1}</button></li>)}</ol>
        <p className="muted">Arrow keys or space move between stops. Counts come live from the studio; fictional examples never count as evidence.</p>
      </section>
    </aside>
  </div>;
}
