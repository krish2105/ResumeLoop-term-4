"use client";
import {useSearchParams} from 'next/navigation';
import {Suspense, useEffect, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {Art} from '@/components/Art';
import {api, DEMO} from '@/lib/client';

export default function LoginPage() {
  return <Suspense fallback={<p className="empty">Loading…</p>}><Login /></Suspense>;
}

function Login() {
  const params = useSearchParams();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [org, setOrg] = useState('');
  const [msg, setMsg] = useState('');
  const [required, setRequired] = useState<boolean | null>(null);
  useEffect(() => { if (!DEMO) api<{auth_required: boolean}>('/api/health').then(h => setRequired(h.auth_required)).catch(() => setRequired(null)); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    if (password.length < 10) { setMsg('Use at least 10 characters for the password.'); return; }
    try {
      const r = await api<{token: string}>(mode === 'in' ? '/api/auth/login' : '/api/auth/signup', {method: 'POST',
        body: JSON.stringify(mode === 'in' ? {email, password} : {email, password, org_name: org})});
      localStorage.setItem('rl-token', r.token);
      location.href = params.get('next') || '/';
    } catch (err) { setMsg(err instanceof Error ? err.message : String(err)); }
  };
  if (DEMO || required === false) return <>
    <PageHead eyebrow="Account" title="No sign-in needed here" intro={DEMO ? 'The public demo runs in your browser with fictional data only.' : 'This local app runs in single-user mode. Set RL_AUTH=required on the API to turn on accounts and organisations.'} />
    <Art name="initial-paper-cut-light-style" dark="initial-paper-cut-dark-style" className="authArt" sizes="(max-width: 760px) 100vw, 560px" decorative eager />
  </>;
  return <>
    <PageHead eyebrow="Account" title={mode === 'in' ? 'Sign in' : 'Create an organisation'} intro="Each organisation's courses, research notes and learner progress are kept separate from every other organisation." />
    <div className="authLayout">
    <section className="panel authCard">
      <form className="editor" onSubmit={submit} noValidate>
        <label className="fieldLabel" htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="fieldLabel" htmlFor="pw">Password (10+ characters)</label><input id="pw" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
        {mode === 'up' && <><label className="fieldLabel" htmlFor="on">Organisation name</label><input id="on" value={org} onChange={e => setOrg(e.target.value)} placeholder="Evening MBA programme" /></>}
        <p className="fieldError" role="alert">{msg}</p>
        <button className="primaryBtn" type="submit">{mode === 'in' ? 'Sign in' : 'Create organisation'}</button>
      </form>
      <button className="textBtn" onClick={() => { setMode(m => m === 'in' ? 'up' : 'in'); setMsg(''); }}>{mode === 'in' ? 'New here? Create an organisation' : 'Have an account? Sign in'}</button>
    </section>
    <Art name="initial-paper-cut-light-style" dark="initial-paper-cut-dark-style" className="authArt" sizes="(max-width: 760px) 100vw, 560px" decorative eager />
    </div>
  </>;
}
