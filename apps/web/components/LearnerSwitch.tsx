"use client";
import {useEffect, useState} from 'react';
import {learnerId} from '@/lib/client';

const VALID = /^[a-z0-9][a-z0-9-]{2,39}$/;

/** Switch between learner profiles on this device. Profiles are short codes, never real names. */
export function LearnerSwitch() {
  const [list, setList] = useState<string[]>(['demo-learner']);
  const [current, setCurrent] = useState('demo-learner');
  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem('rl-learners') || '["demo-learner"]')); } catch { /* ignore */ }
    setCurrent(learnerId());
  }, []);
  const choose = (v: string) => {
    let id = v;
    if (v === '__new') {
      const raw = (prompt('New learner code (lowercase letters, digits, dashes; no real names)', 'learner-p01') || '').trim().toLowerCase();
      if (!VALID.test(raw)) { if (raw) alert('Use 3–40 lowercase letters, digits or dashes.'); return; }
      id = raw;
      const next = [...new Set([...list, id])];
      try { localStorage.setItem('rl-learners', JSON.stringify(next)); } catch { /* ignore */ }
      setList(next);
    }
    try { localStorage.setItem('rl-learner', id); } catch { /* ignore */ }
    setCurrent(id);
    location.reload();
  };
  return <><label htmlFor="learner" className="sr-only">Learner profile</label>
    <select id="learner" className="learnerSelect" value={current} onChange={e => choose(e.target.value)}>
      {list.map(l => <option key={l} value={l}>{l === 'demo-learner' ? 'Demo learner' : l}</option>)}
      <option value="__new">Add learner…</option>
    </select></>;
}
