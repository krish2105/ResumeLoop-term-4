// Descriptive statistics for small formative usability studies. No significance testing:
// a handful of sessions cannot support it, and the UI says so.
import type {Item} from './studio';

export type Row = {task: number; condition: 'A' | 'B'; success: boolean; seconds: number; wrong_actions: number; ease: number};

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function summarise(sessions: Item[], tasks: string[]) {
  const rows = sessions.flatMap(s => (s.results as Row[]).map(r => ({...r, participant: s.participant_code as string})));
  const cell = (task: number, condition: 'A' | 'B') => {
    const rs = rows.filter(r => r.task === task && r.condition === condition);
    const secs = rs.map(r => r.seconds);
    return {n: rs.length, success: rs.filter(r => r.success).length, medianSeconds: median(secs),
      min: secs.length ? Math.min(...secs) : null, max: secs.length ? Math.max(...secs) : null,
      medianWrong: median(rs.map(r => r.wrong_actions)), medianEase: median(rs.map(r => r.ease))};
  };
  const perTask = tasks.map((name, task) => {
    const a = cell(task, 'A'), b = cell(task, 'B');
    const paired = [...new Set(rows.filter(r => r.task === task).map(r => r.participant))].flatMap(p => {
      const ra = rows.find(r => r.participant === p && r.task === task && r.condition === 'A');
      const rb = rows.find(r => r.participant === p && r.task === task && r.condition === 'B');
      return ra && rb ? [rb.seconds - ra.seconds] : [];
    });
    return {task, name, a, b, pairedN: paired.length, medianDifference: median(paired), sign: signTest(paired)};
  });
  return {participants: new Set(sessions.map(s => s.participant_code)).size, sessions: sessions.length,
    synthetic: sessions.some(s => s.synthetic), perTask};
}

export const fmtNum = (x: number | null, digits = 0) => (x === null ? '—' : x.toFixed(digits));

/** Exact two-sided sign test on paired differences (ties dropped). Small-sample friendly, assumption-light. */
export function signTest(diffs: number[]): {n: number; bFaster: number; aFaster: number; ties: number; p: number | null} {
  const bFaster = diffs.filter(d => d < 0).length, aFaster = diffs.filter(d => d > 0).length, ties = diffs.length - bFaster - aFaster;
  const n = bFaster + aFaster;
  if (!n) return {n, bFaster, aFaster, ties, p: null};
  const choose = (a: number, b: number) => { let r = 1; for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i; return r; };
  let tail = 0;
  for (let k = 0; k <= Math.min(bFaster, aFaster); k++) tail += choose(n, k);
  return {n, bFaster, aFaster, ties, p: Math.min(1, (2 * tail) / 2 ** n)};
}
