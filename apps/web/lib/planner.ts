// TypeScript port of services/api/app/planner.py for the backend-free Vercel demo.
// Kept dependency-free so `node scripts/planner-parity.ts` can check it against Python output.
import type {CourseAction, Plan, PlanItem} from './types';

const KIND_RANK: Record<string, number> = {recap: 0, reading: 1, exercise: 2, assessment: 3, reflection: 4};

export class PlanInputError extends Error {
  errors: string[];
  constructor(errors: string[]) { super(errors.join('; ')); this.errors = errors; }
}

export function validateGraph(actions: CourseAction[]): void {
  const errors = new Set<string>();
  const seen = new Set<string>();
  for (const a of actions) { if (seen.has(a.id)) errors.add(`duplicate action id ${a.id}`); seen.add(a.id); }
  for (const a of actions) for (const p of a.prerequisites) {
    if (!seen.has(p)) errors.add(`${a.id} needs unknown prerequisite ${p}`);
    if (p === a.id) errors.add(`${a.id} lists itself as a prerequisite`);
  }
  if (!errors.size) {
    const graph = new Map(actions.map(a => [a.id, a.prerequisites]));
    const state = new Map<string, number>();
    const visit = (node: string, path: string[]) => {
      if (state.get(node) === 2) return;
      if (state.get(node) === 1) { errors.add('prerequisite cycle: ' + [...path.slice(path.indexOf(node)), node].join(' -> ')); return; }
      state.set(node, 1);
      for (const next of graph.get(node) || []) visit(next, [...path, node]);
      state.set(node, 2);
    };
    for (const id of graph.keys()) visit(id, []);
  }
  if (errors.size) throw new PlanInputError([...errors].sort());
}

function priority(a: CourseAction): string[] {
  const due = a.due_status === 'verified' && a.due ? a.due : '9999';
  return [due, String(a.session).padStart(3, '0'), String(KIND_RANK[a.kind]), a.id];
}

function compare(a: CourseAction, b: CourseAction): number {
  const pa = priority(a), pb = priority(b);
  for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  return 0;
}

export function buildPlan(actions: CourseAction[], budget: number, completed: Set<string>): Plan {
  if (budget < 0) throw new PlanInputError(['budget_minutes must be zero or more']);
  validateGraph(actions);
  const known = new Set(actions.map(a => a.id));
  const unknownDone = [...completed].filter(id => !known.has(id)).sort();
  const done = new Set([...completed].filter(id => known.has(id)));
  let remaining = budget;
  const chosen: CourseAction[] = [];
  const picked = new Set<string>();
  for (;;) {
    const ready = actions.filter(a => !done.has(a.id) && !picked.has(a.id) && a.minutes !== null && a.minutes <= remaining
      && a.prerequisites.every(p => done.has(p) || picked.has(p)));
    if (!ready.length) break;
    const best = ready.reduce((x, y) => (compare(x, y) <= 0 ? x : y));
    chosen.push(best); picked.add(best.id); remaining -= best.minutes as number;
  }
  const reason = (a: CourseAction): Omit<PlanItem, keyof CourseAction> => {
    if (done.has(a.id)) return {state: 'completed', reason: 'Already completed'};
    if (picked.has(a.id)) {
      return {state: 'planned', order: chosen.findIndex(c => c.id === a.id) + 1,
        reason: a.due_status === 'verified' ? 'Verified deadline first' : `Earliest unlocked session ${a.session} task`};
    }
    if (a.minutes === null) return {state: 'abstained', reason: 'Duration unknown in the source, so it is not scheduled'};
    const missing = a.prerequisites.filter(p => !done.has(p) && !picked.has(p));
    if (missing.length) return {state: 'locked', reason: 'Needs ' + missing.join(', ') + ' first', needs: missing};
    return {state: 'does-not-fit', reason: `Needs ${a.minutes} min, ${remaining} min left`};
  };
  const items = [...actions]
    .sort((x, y) => x.session - y.session || KIND_RANK[x.kind] - KIND_RANK[y.kind] || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
    .map(a => ({...a, ...reason(a)}) as PlanItem);
  const warnings = new Set<string>();
  for (const a of chosen) if (a.due_status === 'unverified' || a.due_status === 'conflict') {
    warnings.add(`${a.title}: the deadline ${a.due_status === 'unverified' ? 'is not verified' : 'differs between sources'}; check with the coordinator`);
  }
  for (const a of actions) if (!done.has(a.id) && a.due_status === 'conflict' && !picked.has(a.id)) warnings.add(`${a.title}: sources disagree on the deadline`);
  if (unknownDone.length) warnings.add('Ignored completed IDs not in this course version: ' + unknownDone.join(', '));
  return {
    method: 'deterministic planner, not AI', budget_minutes: budget, planned_minutes: budget - remaining,
    remaining_minutes: remaining, next_action: chosen[0]?.id ?? null, sequence: chosen.map(c => c.id), items,
    warnings: [...warnings].sort(),
    empty_reason: chosen.length ? null : (done.size === actions.length ? 'Everything is completed' : 'Nothing unlocked fits this time budget'),
  };
}
