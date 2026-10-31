"use client";
import {PageHead} from '@/components/AppShell';
import {AccountPanel} from '@/components/AccountPanel';
import {DEMO, store} from '@/lib/client';

export default function SettingsPage() {
  return <>
    <PageHead eyebrow="Data" title="Settings and account" intro="Appearance, motion and data safety." />
    <section className="panel"><h2>Appearance</h2><p>Choose Light (dusk paper), Dark (ember night) or System at the top right. The choice is saved in this browser. If your system asks for reduced motion, the 3D road stops twinkling and the camera jumps instead of gliding.</p></section>
    <section className="panel"><h2>Data safety</h2>
      <p>{DEMO ? 'This public demo uses a fictional course and recorded AI answers. Anything you change is stored only in this browser.' : 'The local app stores fictional data in SQLite on this computer. AI runs locally through Ollama; nothing is sent to a cloud model.'}</p>
      <p>{DEMO ? 'Never enter real learner or participant data in the demo.' : 'Accounts, organisations and roles switch on with RL_AUTH=required; each organisation sees only its own data. Even so, this is a prototype: get your institution\'s approval before storing real learner records.'}</p>
      {DEMO && <button className="outlineBtn" onClick={() => { if (confirm('Clear everything this demo stored in your browser?')) { store.clear(); location.reload(); } }}>Clear demo data in this browser</button>}
    </section>
    {!DEMO && <AccountPanel />}
  </>;
}
