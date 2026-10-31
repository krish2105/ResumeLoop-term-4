"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTheme} from '@/components/AppShell';
import {useStudio} from '@/components/StudioBits';
import {hasWebGL} from '@/lib/road';
import {useJourney} from '@/lib/useJourney';

const StoryScene = dynamic(() => import('@/components/StoryScene'), {ssr: false, loading: () => <div className="roadLoading">Lighting the constellation…</div>});

type StopDef = {key: string; title: string; method: string; href: string; evidence: (c: Counts) => number; lines: (c: Counts) => string[]};
type Counts = Record<string, number>;

const STOPS: StopDef[] = [
  {key: 'empathise', title: 'Empathise', method: 'IDEO-style interviews and contextual observation with consented participants.', href: '/studio/empathy',
    evidence: c => c.realNotes, lines: c => [`${c.realNotes} real research notes (${c.fictionalNotes} fictional examples not counted)`, `${c.consented} with consent to analysis`]},
  {key: 'define', title: 'Define', method: 'Codes become an empathy map and themes; every claim links back to a quote.', href: '/studio/empathy',
    evidence: c => c.realCodes, lines: c => [`${c.realCodes} accepted codes from real notes`, `${c.themes} themes`, `${c.aiAccepted} AI suggestions accepted, ${c.aiRejected} rejected by a person`]},
  {key: 'ideate', title: 'Ideate', method: 'How might we questions, ideas and votes; three alternatives scored, including non-software options.', href: '/studio/ideate',
    evidence: c => c.ideas, lines: c => [`${c.hmw} How might we questions`, `${c.ideas} ideas, ${c.votes} votes`, `${c.scorers} people scored the alternatives`]},
  {key: 'prototype', title: 'Prototype', method: 'ResumeLoop: a 3D road and list view over a deterministic planner, with a grounded local AI coach.', href: '/',
    evidence: c => c.planned, lines: c => [`${c.tasks} fictional course tasks, ${c.planned} planned for the current time budget`, 'Planner is tested; AI answers must cite sources or abstain']},
  {key: 'test', title: 'Test', method: 'A frozen A/B usability protocol: unaided success, time, wrong actions and ease.', href: '/studio/experiments',
    evidence: c => c.realSessions, lines: c => [`${c.frozen} frozen protocol(s)`, `${c.realSessions} real sessions (${c.fictionalSessions} fictional practice sessions not counted)`]},
  {key: 'impact', title: 'Impact · SDG 4', method: 'SDG 4 Quality Education, especially lifelong learning for adults (targets 4.3 and 4.4). Impact is a hypothesis until tested.', href: '/studio/ethics',
    evidence: c => (c.realSessions > 0 ? 1 : 0), lines: c => [c.realSessions ? 'Usability evidence exists; report it with its sample size' : 'No outcome evidence yet: present this as a hypothesis', 'Governance: local AI, consent gates, human approval, AI log']},
];

export default function StoryPage() {
  const s = useStudio();
  const j = useJourney();
  const {resolved, reducedMotion} = useTheme();
  const [index, setIndex] = useState(0);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [presenters, setPresenters] = useState<Record<string, string>>({});
  useEffect(() => { setWebgl(hasWebGL()); try { setPresenters(JSON.parse(localStorage.getItem('rl-presenters') || '{}')); } catch { /* ignore */ } }, []);
  const setPresenter = (key: string, name: string) => setPresenters(p => { const n = {...p, [key]: name}; try { localStorage.setItem('rl-presenters', JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const counts = useMemo<Counts>(() => {
    const notes = s.of('notes'); const real = new Set(notes.filter(n => !n.synthetic).map(n => n.id));
    const codes = s.of('codes').filter(c => c.status === 'accepted');
    const ai = s.of('codes').filter(c => c.origin === 'ai');
    const sessions = s.of('sessions'); const exps = s.of('experiments');
    return {realNotes: real.size, fictionalNotes: notes.length - real.size, consented: notes.filter(n => !n.synthetic && n.consent?.anonymised_notes).length,
      realCodes: codes.filter(c => real.has(c.parent_id || '')).length, themes: s.of('themes').length,
      aiAccepted: ai.filter(c => c.status === 'accepted').length, aiRejected: ai.filter(c => c.status === 'rejected').length,
      hmw: s.of('hmw').length, ideas: s.of('ideas').length, votes: s.of('votes').length, scorers: new Set(s.of('scores').map(x => x.scorer)).size,
      tasks: j.plan?.items.length || 0, planned: j.plan?.sequence.length || 0, frozen: exps.filter(e => e.frozen_at).length,
      realSessions: sessions.filter(x => !x.synthetic).length, fictionalSessions: sessions.filter(x => x.synthetic).length};
  }, [s, j.plan]);
  const stops = STOPS.map(st => ({key: st.key, title: st.title, evidence: st.evidence(counts)}));
  const go = useCallback((d: number) => setIndex(i => Math.max(0, Math.min(STOPS.length - 1, i + d))), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea,select,button')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [go]);
  const stop = STOPS[index];
  return <div className="journey story">
    <h1 className="sr-only">Story mode: the ResumeLoop design thinking journey</h1>
    <div className="roadStage">{webgl === false ? <div className="roadFallback panel"><h2>3D view unavailable</h2><p>Use the cards below; they contain everything the 3D view shows.</p></div>
      : webgl ? <StoryScene stops={stops} index={index} theme={resolved} reducedMotion={reducedMotion} /> : null}</div>
    <section className="roadPanel storyCard" aria-live="polite" aria-label={`Stop ${index + 1} of ${STOPS.length}`}>
      <span className="eyebrow">Stop {index + 1} of {STOPS.length}</span>
      <h2>{stop.title}</h2>
      <p>{stop.method}</p>
      <ul className="factList">{stop.lines(counts).map(l => <li key={l}>{l}</li>)}</ul>
      <label className="nameField">Presenter for this stop<input value={presenters[stop.key] || ''} onChange={e => setPresenter(stop.key, e.target.value)} placeholder="Name (optional)" /></label>
      <div className="detailActions">
        <button className="outlineBtn" onClick={() => go(-1)} disabled={index === 0}>Previous</button>
        <button className="primaryBtn" onClick={() => go(1)} disabled={index === STOPS.length - 1}>Next stop</button>
        <Link className="textBtn" href={stop.href}>Open the evidence</Link>
      </div>
      <ol className="storyDots" aria-label="Stops">{STOPS.map((st, i) => <li key={st.key}><button aria-current={i === index ? 'step' : undefined} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} aria-label={`Go to ${st.title}`}>{i + 1}</button></li>)}</ol>
      <p className="muted">Arrow keys or space move between stops. Counts come live from the studio; fictional examples never count as evidence.</p>
    </section>
  </div>;
}
