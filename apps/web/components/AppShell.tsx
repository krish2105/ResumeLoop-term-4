"use client";
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {createContext, useContext, useEffect, useState} from 'react';
import {DEMO} from '@/lib/client';
import type {ArtName} from '@/lib/art';
import {Art} from './Art';
import {activePilot} from '@/lib/pilot';
import {LearnerSwitch} from './LearnerSwitch';
import {Splitter, useResizable} from './Splitter';

type Mode = 'light' | 'dark' | 'system';
type Theme = {resolved: 'light' | 'dark'; reducedMotion: boolean};
const ThemeContext = createContext<Theme>({resolved: 'dark', reducedMotion: false});
export const useTheme = () => useContext(ThemeContext);

/** Screens that need the local API; the public site leaves them out of the menu. */
export const LOCAL_ONLY = ['/review', '/imports'];
export const NAV: {heading: string; links: [string, string][]}[] = [
  {heading: 'Learner', links: [['/', 'Journey'], ['/plan', 'Plan (list view)'], ['/digest', 'What changed'], ['/coach', 'Coach'], ['/escalations', 'Coordinator queue']]},
  {heading: 'Design studio', links: [['/studio/research', 'Research ops'], ['/studio/observe', 'Observe'], ['/studio/empathy', 'Empathy studio'], ['/studio/synthesis', 'Synthesis board'], ['/studio/define', 'Define'], ['/studio/envision', 'Envision'],
    ['/studio/ideate', 'Ideate'], ['/studio/journeys', 'Journey maps'], ['/studio/prototypes', 'Prototype log'], ['/studio/experiments', 'Experiment lab'], ['/studio/ethics', 'Ethics and governance']]},
  {heading: 'Class prep', links: [['/learn', 'Readings and quizzes']]},
  {heading: 'Present and reflect', links: [['/story', 'Story mode'], ['/reflect', 'Reflection journal'], ['/report', 'Evidence report'], ['/course', 'Course hub']]},
  {heading: 'Coordinator and data', links: [['/coordinator', 'Coordinator workspace'], ['/review', 'Review queue'], ['/imports', 'Imports'], ['/settings', 'Settings and account'], ['/privacy', 'Privacy']]},
];

export default function AppShell({children}: {children: React.ReactNode}) {
  const path = usePathname();
  const nav = DEMO ? NAV.map(g => ({...g, links: g.links.filter(([href]) => !LOCAL_ONLY.includes(href))})) : NAV;
  const [mode, setMode] = useState<Mode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pilotName, setPilotName] = useState('');
  useEffect(() => { if (DEMO) setPilotName(activePilot()?.course.course || ''); }, []);
  const side = useResizable('sidebar', {initial: 248, min: 200, max: 380, edge: 'left'});
  useEffect(() => {
    try { const saved = localStorage.getItem('ResumeLoop-theme') as Mode | null; if (saved && ['light', 'dark', 'system'].includes(saved)) setMode(saved); } catch { /* storage blocked */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem('ResumeLoop-theme', mode); } catch { /* storage blocked */ }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => { setResolved(mode === 'system' ? (media.matches ? 'dark' : 'light') : mode); setReducedMotion(motion.matches); };
    apply(); media.addEventListener('change', apply); motion.addEventListener('change', apply);
    return () => { media.removeEventListener('change', apply); motion.removeEventListener('change', apply); };
  }, [mode, ready]);
  useEffect(() => { document.documentElement.dataset.theme = resolved; }, [resolved]);
  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => { if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);
  const current = NAV.flatMap(g => g.links).find(([href]) => href === path)?.[1] || 'ResumeLoop';
  const fullBleed = path === '/' || path === '/story';
  return <ThemeContext.Provider value={{resolved, reducedMotion}}>
    <a className="skipLink" href="#main-content">Skip to content</a>
    <div className={'appShell' + (menuOpen ? ' menuOpen' : '') + (side.collapsed ? ' sideCollapsed' : '')} style={{'--sidebarW': `${side.size}px`} as React.CSSProperties}>
      <aside className="sidebar" id="sidebar" aria-label="Sidebar">
        <div className="brand"><span className="brandMark" aria-hidden="true">R</span><div><strong>ResumeLoop</strong><small>Find your way back to learning</small></div>
          <button className="menuToggle outlineBtn" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? 'Close' : 'Menu'}</button></div>
        <nav id="main-nav" aria-label="Main navigation">
          {nav.map(group => <div key={group.heading} className="navGroup"><div className="navHeading">{group.heading}</div>
            {group.links.map(([href, label]) => <Link key={href} href={href} className={path === href ? 'nav active' : 'nav'} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}
          </div>)}
        </nav>
      </aside>
      <Splitter r={side} label="Resize sidebar" controls="sidebar" />
      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div className="crumbRow">{side.collapsed && <button className="outlineBtn showSide" onClick={() => side.setCollapsed(false)}>Show menu</button>}
            <div className="breadcrumb">RESUMELOOP <span>/</span> {current}</div></div>
          <div className="toolbar">{DEMO && <span className="pill demoPill" title={pilotName || undefined}>{pilotName ? 'Browser pilot' : 'Demo · fictional data'}</span>}
            <LearnerSwitch />
            <label htmlFor="theme" className="sr-only">Appearance</label>
            <select id="theme" value={mode} onChange={e => setMode(e.target.value as Mode)}><option value="system">System</option><option value="light">Light (dusk paper)</option><option value="dark">Dark (ember night)</option></select></div>
        </header>
        <div className={fullBleed ? 'fullBleed' : 'content'}>{children}</div>
      </main>
    </div>
  </ThemeContext.Provider>;
}

export function PageHead({eyebrow, title, intro, children, art}: {eyebrow: string; title: string; intro: string; children?: React.ReactNode; art?: ArtName}) {
  return <div className={'hero' + (art ? ' heroArt' : '')}><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p>{art && children}</div>
    {art ? <Art name={art} className="heroPicture" sizes="(max-width: 760px) 100vw, 560px" decorative eager /> : children}</div>;
}
