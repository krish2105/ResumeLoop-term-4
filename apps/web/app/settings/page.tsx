"use client";
import {PageHead} from '@/components/AppShell';
import {DEMO, store} from '@/lib/client';

export default function SettingsPage() {
  return <>
    <PageHead eyebrow="Data" title="Settings" intro="Appearance, motion and data safety." />
    <section className="panel"><h2>Appearance</h2><p>Choose Light (dawn), Dark (night) or System at the top right. The choice is saved in this browser. If your system asks for reduced motion, the 3D road stops twinkling and the camera jumps instead of gliding.</p></section>
    <section className="panel"><h2>Data safety</h2>
      <p>{DEMO ? 'This public demo uses a fictional course and recorded AI answers. Anything you change is stored only in this browser.' : 'The local app stores fictional data in SQLite on this computer. AI runs locally through Ollama; nothing is sent to a cloud model.'}</p>
      <p>There is no sign-in and no tenant isolation, so never enter real learner, participant or institutional data.</p>
      {DEMO && <button className="outlineBtn" onClick={() => { if (confirm('Clear everything this demo stored in your browser?')) { store.clear(); location.reload(); } }}>Clear demo data in this browser</button>}
    </section>
  </>;
}
