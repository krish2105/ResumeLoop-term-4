// One interface, two implementations: live (local FastAPI + Ollama) and demo (bundled fixtures,
// visitor edits kept in this browser). Every screen talks to `client` and never to fetch directly.
import fixtures from '../demo/fixtures.json';
import {buildPlan, PlanInputError} from './planner';
import type {CourseInfo, Diff, Plan, Progress, ProgressState} from './types';

export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
export const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8014';

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) { super(message); this.status = status; this.detail = detail; }
}

export async function api<T>(path: string, init?: RequestInit & {timeoutMs?: number}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API + path, {...init, headers: {'Content-Type': 'application/json', ...(init?.headers || {})},
      signal: AbortSignal.timeout(init?.timeoutMs ?? 15000)});
  } catch (e) {
    throw new ApiError(0, 'The local API is not reachable. Start it and retry.', String(e));
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === 'string' ? detail : detail?.message || `Request failed (${response.status})`;
    throw new ApiError(response.status, message, detail);
  }
  return body as T;
}

const json = (body: unknown, method = 'POST') => ({method, body: JSON.stringify(body)});

// ---------- browser store for the demo ----------
export const store = {
  get<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem('rl-demo-' + key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem('rl-demo-' + key, JSON.stringify(value)); } catch { /* private mode: edits last for this page only */ }
  },
  clear() {
    try { Object.keys(localStorage).filter(k => k.startsWith('rl-demo-')).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }
  },
};

type Courses = Record<string, CourseInfo>;
const demoCourses = fixtures.courses as unknown as Courses;
const latest = () => demoCourses[Object.keys(demoCourses).sort().at(-1) as string];
const demoDefault = (): Progress => ({version: 0, updated_at: null, state: {
  completed: fixtures.demo_learner.completed, budget_minutes: fixtures.demo_learner.budget_minutes,
  seen_version: fixtures.demo_learner.seen_version, current_action: null, notes: {}}});

export const learning = {
  course: (version?: string): Promise<CourseInfo> => DEMO
    ? Promise.resolve(version ? demoCourses[version] : latest())
    : api(`/api/course${version ? `?version=${version}` : ''}`),
  diff: (from = 'v1'): Promise<Diff> => DEMO ? Promise.resolve(fixtures.diff as Diff) : api(`/api/course/diff?from_version=${from}`),
  plan: async (budget: number, completed: string[], version?: string): Promise<Plan> => {
    if (!DEMO) return api('/api/plan', json({budget_minutes: budget, completed, version}));
    const course = version ? demoCourses[version] : latest();
    try { return {...buildPlan(course.actions, budget, new Set(completed)), version: course.version}; }
    catch (e) { throw new ApiError(422, 'The course source is inconsistent', e instanceof PlanInputError ? e.errors : String(e)); }
  },
  progress: async (): Promise<Progress> => DEMO ? store.get('progress', demoDefault()) : api('/api/learner/progress'),
  saveProgress: async (expected: number, state: ProgressState): Promise<Progress> => {
    if (!DEMO) return api('/api/learner/progress', json({expected_version: expected, state}, 'PUT'));
    const current = store.get('progress', demoDefault());
    if (current.version !== expected) throw new ApiError(409, 'Progress changed in another tab. Reload before saving.');
    const next = {version: expected + 1, state, updated_at: new Date().toISOString()};
    store.set('progress', next);
    return next;
  },
  resetProgress: async () => { if (DEMO) store.set('progress', demoDefault()); else await api('/api/learner/progress', {method: 'DELETE'}); },
};
