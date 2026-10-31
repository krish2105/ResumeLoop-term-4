"use client";
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {createContext, useContext, useEffect, useState} from 'react';
import {DEMO} from '@/lib/client';

type Mode = 'light' | 'dark' | 'system';
type Theme = {resolved: 'light' | 'dark'; reducedMotion: boolean};
const ThemeContext = createContext<Theme>({resolved: 'dark', reducedMotion: false});
export const useTheme = () => useContext(ThemeContext);

const NAV: {heading: string; links: [string, string][]}[] = [
  {heading: 'Learner', links: [['/', 'Journey'], ['/plan', 'Plan (list view)'], ['/digest', 'What changed'], ['/coach', 'Coach'], ['/escalations', 'Coordinator queue']]},
  {heading: 'Design studio', links: [['/studio/empathy', 'Empathy studio'], ['/studio/ideate', 'Ideate'], ['/studio/experiments', 'Experiment lab'], ['/studio/ethics', 'Ethics and governance'], ['/story', 'Story mode']]},
  {heading: 'Data', links: [['/review', 'Review queue'], ['/imports', 'Imports'], ['/settings', 'Settings']]},
];

export default function AppShell({children}: {children: React.ReactNode}) {
  const path = usePathname();
  const [mode, setMode] = useState<Mode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const current = NAV.flatMap(g => g.links).find(([href]) => href === path)?.[1] || 'ResumeLoop';
  const fullBleed = path === '/' || path === '/story';
  return <ThemeContext.Provider value={{resolved, reducedMotion}}>
    <a className="skipLink" href="#main-content">Skip to content</a>
    <div className={'appShell' + (menuOpen ? ' menuOpen' : '')}>
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">R</span><div><strong>ResumeLoop</strong><small>Find your way back to learning</small></div>
          <button className="menuToggle outlineBtn" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? 'Close' : 'Menu'}</button></div>
        <nav id="main-nav" aria-label="Main navigation">
          {NAV.map(group => <div key={group.heading} className="navGroup"><div className="navHeading">{group.heading}</div>
            {group.links.map(([href, label]) => <Link key={href} href={href} className={path === href ? 'nav active' : 'nav'} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}
          </div>)}
        </nav>
        <div className="sideFoot"><strong>{DEMO ? 'Public demo' : 'Local app'}</strong><p>{DEMO ? 'Fictional course and recorded AI answers. Your edits stay in this browser.' : 'Fictional course data. AI runs on this computer through Ollama.'}</p></div>
      </aside>
      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar"><div className="breadcrumb">RESUMELOOP <span>/</span> {current}</div>
          <div className="toolbar">{DEMO && <span className="pill demoPill">Demo · fictional data</span>}
            <label htmlFor="theme" className="sr-only">Appearance</label>
            <select id="theme" value={mode} onChange={e => setMode(e.target.value as Mode)}><option value="system">System</option><option value="light">Light (dawn)</option><option value="dark">Dark (night)</option></select></div>
        </header>
        <div className={fullBleed ? 'fullBleed' : 'content'}>{children}</div>
      </main>
    </div>
  </ThemeContext.Provider>;
}

export function PageHead({eyebrow, title, intro, children}: {eyebrow: string; title: string; intro: string; children?: React.ReactNode}) {
  return <div className="hero"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>{children}</div>;
}
