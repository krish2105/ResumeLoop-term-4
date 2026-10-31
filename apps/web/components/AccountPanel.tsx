"use client";
import {useEffect, useState} from 'react';
import {api} from '@/lib/client';

type Me = {auth_required: boolean; org_id: string; user: {email: string; role: string; org_name: string} | null};

export function AccountPanel() {
  const [me, setMe] = useState<Me | null>(null);
  const [members, setMembers] = useState<{email: string; role: string}[]>([]);
  const [audit, setAudit] = useState<{actor: string; action: string; target: string; at: string}[]>([]);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nm, setNm] = useState({email: '', password: '', role: 'learner'});
  const err = (e: unknown) => setMsg(e instanceof Error ? e.message : String(e));
  const load = async () => {
    try {
      const m = await api<Me>('/api/auth/me'); setMe(m);
      const admin = !m.auth_required || m.user?.role === 'admin';
      if (m.auth_required && admin) setMembers(await api('/api/org/members'));
      if (!m.auth_required || m.user?.role !== 'learner') setAudit(await api('/api/account/audit'));
    } catch (e) { err(e); }
  };
  useEffect(() => { load(); }, []);
  const isAdmin = me && (!me.auth_required || me.user?.role === 'admin');
  const exportData = async () => {
    try {
      const data = await api('/api/account/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], {type: 'application/json'}));
      const a = document.createElement('a'); a.href = url; a.download = `resumeloop-export-${me?.org_id}.json`; a.click(); URL.revokeObjectURL(url);
      setMsg('Export downloaded.'); load();
    } catch (e) { err(e); }
  };
  const del = async () => {
    try { const r = await api<{deleted: Record<string, number>}>('/api/account/delete', {method: 'POST', body: JSON.stringify({confirm})});
      setMsg('Deleted: ' + Object.entries(r.deleted).map(([k, v]) => `${v} ${k}`).join(', ')); setConfirm(''); load(); } catch (e) { err(e); }
  };
  const addMember = async () => {
    try { await api('/api/org/members', {method: 'POST', body: JSON.stringify(nm)}); setNm({email: '', password: '', role: 'learner'}); setMsg('Member added.'); load(); } catch (e) { err(e); }
  };
  if (!me) return null;
  return <section className="panel" aria-labelledby="acct-h">
    <h2 id="acct-h">Account and data</h2>
    {msg && <p className="toast" role="status">{msg}</p>}
    {me.auth_required && me.user ? <div className="sectionHead"><p>Signed in as <strong>{me.user.email}</strong> · {me.user.role} · {me.user.org_name}</p>
      <button className="outlineBtn" onClick={async () => { try { await api('/api/auth/logout', {method: 'POST'}); } catch { /* ignore */ } localStorage.removeItem('rl-token'); location.href = '/login'; }}>Sign out</button></div>
      : <p>Single-user mode (organisation <code>{me.org_id}</code>). Set <code>RL_AUTH=required</code> on the API to switch on accounts, organisations and roles.</p>}
    {me.auth_required && isAdmin && <div className="sectionGap"><h3>Members</h3>
      <ul className="factList">{members.map(m => <li key={m.email}>{m.email} · {m.role}</li>)}</ul>
      <div className="formGrid"><label>Email<input type="email" value={nm.email} onChange={e => setNm({...nm, email: e.target.value})} /></label>
        <label>Temporary password<input type="password" value={nm.password} onChange={e => setNm({...nm, password: e.target.value})} /></label>
        <label>Role<select value={nm.role} onChange={e => setNm({...nm, role: e.target.value})}><option value="learner">Learner</option><option value="coordinator">Coordinator</option><option value="admin">Admin</option></select></label></div>
      <button className="outlineBtn" onClick={addMember}>Add member</button></div>}
    {isAdmin && <div className="sectionGap"><h3>Your data</h3>
      <div className="detailActions"><button className="outlineBtn" onClick={exportData}>Export all data (JSON)</button></div>
      <label className="fieldLabel" htmlFor="del">To delete everything permanently, type <code>DELETE {me.org_id}</code></label>
      <div className="askForm"><input id="del" value={confirm} onChange={e => setConfirm(e.target.value)} /><button className="outlineBtn dangerBtn" disabled={confirm !== `DELETE ${me.org_id}`} onClick={del}>Delete all data</button></div></div>}
    {audit.length > 0 && <details className="sectionGap"><summary>Audit trail ({audit.length} recent events)</summary>
      <ul className="factList">{audit.slice(0, 60).map((a, i) => <li key={i}><span className="mono">{a.at}</span> {a.actor}: {a.action} {a.target}</li>)}</ul></details>}
  </section>;
}
