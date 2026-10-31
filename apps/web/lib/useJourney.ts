"use client";
import {useCallback, useEffect, useRef, useState} from 'react';
import {ApiError, learning} from './client';
import type {CourseInfo, Plan, Progress, ProgressState} from './types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/** Learner progress + plan with autosave. Shared by the 3D road and the 2D twin. */
export function useJourney() {
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [save, setSave] = useState<SaveState>('idle');
  const [loading, setLoading] = useState(true);
  const versionRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [c, p] = await Promise.all([learning.course(), learning.progress()]);
      versionRef.current = p.version;
      setCourse(c); setProgress(p); setSave('idle');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!progress || !course) return;
    let live = true;
    learning.plan(progress.state.budget_minutes, progress.state.completed, course.version)
      .then(p => { if (live) setPlan(p); })
      .catch(e => { if (live) setError(e instanceof Error ? e.message : String(e)); });
    return () => { live = false; };
  }, [progress, course]);

  const persist = useCallback((state: ProgressState) => {
    if (timer.current) clearTimeout(timer.current);
    setSave('saving');
    timer.current = setTimeout(async () => {
      try {
        const saved = await learning.saveProgress(versionRef.current, state);
        versionRef.current = saved.version;
        setSave('saved');
      } catch (e) {
        setSave(e instanceof ApiError && e.status === 409 ? 'conflict' : 'error');
      }
    }, 450);
  }, []);

  const update = useCallback((change: (s: ProgressState) => ProgressState) => {
    setProgress(prev => {
      if (!prev) return prev;
      const state = change(prev.state);
      persist(state);
      return {...prev, state};
    });
  }, [persist]);

  const toggleComplete = (id: string) => update(s => ({...s,
    completed: s.completed.includes(id) ? s.completed.filter(x => x !== id) : [...s.completed, id],
    current_action: s.current_action === id ? null : s.current_action}));
  const setBudget = (minutes: number) => update(s => ({...s, budget_minutes: minutes}));
  const start = (id: string | null) => update(s => ({...s, current_action: id}));
  const setNote = (id: string, text: string) => update(s => ({...s, notes: {...s.notes, [id]: text}}));
  const markSeen = (version: string) => update(s => ({...s, seen_version: version}));
  const reset = async () => { await learning.resetProgress(); await load(); };

  return {course, progress, plan, error, save, loading, reload: load, toggleComplete, setBudget, start, setNote, markSeen, reset};
}
