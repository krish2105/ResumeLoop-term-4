"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTheme} from '@/components/AppShell';
import {Splitter, useResizable} from '@/components/Splitter';
import {useStudio} from '@/components/StudioBits';
import {hasWebGL} from '@/lib/road';
import {useJourney} from '@/lib/useJourney';

const StoryScene = dynamic(() => import('@/components/StoryScene'), {ssr: false, loading: () => <div className="roadLoading">Lighting the constellations…</div>});

type Counts = Record<string, number>;
const n = (k: number, word: string) => `${k} ${word}${k === 1 ? '' : 's'}`;
type StopDef = {key: string; title: string; method: string; href: string; evidence: (c: Counts) => number; lines: (c: Counts) => string[]};

const STOPS: StopDef[] = [
  {key: 'empathise', title: 'Empathise', method: 'IDEO-style interviews and observation, including extreme users and analogous settings, with consent.', href: '/studio/observe',
    evidence: c => c.realNotes + c.realObs, lines: c => [`${n(c.realNotes, 'research note')} and ${n(c.realObs, 'observation')} (${n(c.fictional, 'fictional example')} not counted)`, `${n(c.consented, 'note')} consented for analysis`, `${n(c.personas, 'persona')}, ${c.evidencedPersonas} backed by evidence`]},
  {key: 'define', title: 'Define', method: 'Codes become an empathy map and themes, then a point-of-view statement and a storyboard.', href: '/studio/define',
    evidence: c => c.realCodes + c.povs, lines: c => [`${c.realCodes} accepted codes from real notes · ${c.themes} themes`, `${c.povs} point-of-view statements · ${c.storyboards} storyboards`, `${c.aiAccepted} AI code suggestions accepted, ${c.aiRejected} rejected by a person`]},
  {key: 'ideate', title: 'Envision and ideate', method: 'Hill statements set the target; How might we, Crazy 8s and votes generate options; three alternatives are scored.', href: '/studio/envision',
    evidence: c => c.hills + c.ideas, lines: c => [`${c.hills} Hills · ${c.scenarios} what-if scenarios`, `${c.hmw} How might we · ${c.ideas} ideas · ${c.sketches} Crazy 8s sketches · ${c.votes} votes`, `${c.scorers} people scored the alternatives`]},
  {key: 'prototype', title: 'Prototype', method: 'ResumeLoop: an ember road over a deterministic planner, a grounded local AI coach, and journey maps of today and tomorrow.', href: '/studio/prototypes',
    evidence: c => c.versions + c.journeys, lines: c => [`${n(c.versions, 'logged version')} with ${c.feedback} feedback item${c.feedback === 1 ? '' : 's'}`, `${c.journeys} journey maps (${c.futureJourneys} future)`, `${c.tasks} fictional course tasks; ${c.planned} planned for the current budget`]},
  {key: 'test', title: 'Test', method: 'A frozen A/B usability protocol: unaided success, time, wrong actions and ease.', href: '/studio/experiments',
    evidence: c => c.realSessions, lines: c => [`${c.frozen} frozen protocol(s)`, `${n(c.realSessions, 'real session')} (${n(c.fictionalSessions, 'fictional practice session')} not counted)`]},
  {key: 'impact', title: 'Impact · SDG 4', method: 'Quality education and lifelong learning for working adults (targets 4.3 and 4.4). Impact is a hypothesis until tested.', href: '/course',
    evidence: c => c.realSessions ? 1 : 0, lines: c => [c.realSessions ? 'Usability evidence exists; report it with its sample size' : 'No outcome evidence yet: present impact as a hypothesis', `${c.risks} AI risks logged (${c.openHigh} high and still open) · ${c.reflections} reflection entries`, `${c.rubricReady}/${c.rubric} rubric criteria self-rated ready`]},
];

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
  const counts = useMemo<Counts>(() => {
    const notes = s.of('notes'); const real = new Set(notes.filter(n => !n.synthetic).map(n => n.id));
    const obs = s.of('observations'); const codes = s.of('codes'); const ai = codes.filter(c => c.origin === 'ai');
    const sessions = s.of('sessions'); const personas = s.of('personas'); const protos = s.of('prototypes'); const journeys = s.of('journeys');
    const risks = s.of('risks'); const rubric = s.of('rubric');
    return {realNotes: real.size, realObs: obs.filter(o => !o.synthetic).length, fictional: notes.length - real.size + obs.filter(o => o.synthetic).length,
      consented: notes.filter(n => !n.synthetic && n.consent?.anonymised_notes).length, personas: personas.length, evidencedPersonas: personas.filter(p => p.evidence_ids?.length).length,
      realCodes: codes.filter(c => c.status === 'accepted' && real.has(c.parent_id || '')).length, themes: s.of('themes').length, povs: s.of('povs').length, storyboards: s.of('storyboards').length,
      aiAccepted: ai.filter(c => c.status === 'accepted').length, aiRejected: ai.filter(c => c.status === 'rejected').length,
      hills: s.of('hills').length, scenarios: s.of('scenarios').length, hmw: s.of('hmw').length, ideas: s.of('ideas').length, votes: s.of('votes').length,
      sketches: s.of('sprints').reduce((a, x) => a + (x.sketches?.length || 0), 0), scorers: new Set(s.of('scores').map(x => x.scorer)).size,
      versions: protos.length, feedback: protos.reduce((a, p) => a + (p.feedback?.length || 0), 0), journeys: journeys.length, futureJourneys: journeys.filter(x => x.phase === 'future').length,
      tasks: j.plan?.items.length || 0, planned: j.plan?.sequence.length || 0, frozen: s.of('experiments').filter(e => e.frozen_at).length,
      realSessions: sessions.filter(x => !x.synthetic).length, fictionalSessions: sessions.filter(x => x.synthetic).length,
      risks: risks.length, openHigh: risks.filter(r => r.status === 'open' && r.likelihood * r.impact >= 6).length, reflections: s.of('reflections').length,
      rubric: rubric.length, rubricReady: rubric.filter(r => r.status === 'ready').length};
  }, [s, j.plan]);
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
        </div>
        <ol className="storyDots" aria-label="Stops">{STOPS.map((st, i) => <li key={st.key}><button aria-current={i === index ? 'step' : undefined} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} aria-label={`Go to ${st.title}`}>{i + 1}</button></li>)}</ol>
        <p className="muted">Arrow keys or space move between stops. Counts come live from the studio; fictional examples never count as evidence.</p>
      </section>
    </aside>
  </div>;
}
