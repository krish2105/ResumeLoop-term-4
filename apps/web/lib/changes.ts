// TypeScript port of diff_versions (app/course.py) and describe (app/ai/features.py) for the browser pilot.
// Dependency-free so `node scripts/changes-parity.ts` can check it against the Python output in the fixtures.
import type {Change, CourseAction} from './types';

const DIFF_FIELDS = ['title', 'minutes', 'prerequisites', 'due', 'due_status', 'session', 'kind'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DUE_WORDS: Record<string, string> = {none: 'no deadline', unverified: 'not verified', verified: 'verified by the coordinator',
  conflict: 'sources disagree, unconfirmed'};
const FIELD_NAMES: Record<string, string> = {due: 'deadline', due_status: 'deadline status', minutes: 'duration', prerequisites: 'prerequisites'};

export function diffVersions(old: CourseAction[], next: CourseAction[]): Change[] {
  const before = new Map(old.map(a => [a.id, a]));
  const after = new Map(next.map(a => [a.id, a]));
  const changes: Change[] = [];
  const add = (type: Change['type'], a: CourseAction, extra: Partial<Change> = {}) =>
    changes.push({id: `C${changes.length + 1}`, type, action_id: a.id, title: a.title, session: a.session, source_ref: a.source_ref, ...extra});
  for (const [id, a] of after) if (!before.has(id)) add('added', a, {minutes: a.minutes});
  for (const [id, a] of before) if (!after.has(id)) add('removed', a);
  const both = [...after.keys()].filter(id => before.has(id))
    .sort((x, y) => after.get(x)!.session - after.get(y)!.session || (x < y ? -1 : x > y ? 1 : 0));
  for (const id of both) for (const field of DIFF_FIELDS) {
    const b = before.get(id)![field], n = after.get(id)![field];
    if (JSON.stringify(b) !== JSON.stringify(n)) add('changed', after.get(id)!, {field, before: b, after: n});
  }
  return changes;
}

function fmt(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ') || 'none';
  if (v === null || v === undefined) return 'none';
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):\d{2}\+04:00$/);
    if (m) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]} ${m[4]}:${m[5]} Dubai time`;
    if (v in DUE_WORDS) return `"${DUE_WORDS[v]}"`;
  }
  return String(v);
}

export function describe(c: Change): string {
  if (c.type === 'added') return `New task added: ${c.title} (session ${c.session}, ${c.minutes || 'unknown'} min).`;
  if (c.type === 'removed') return `Task removed: ${c.title} (session ${c.session}).`;
  const field = FIELD_NAMES[c.field!] || c.field;
  const unit = c.field === 'minutes' ? ' min' : '';
  return `${c.title}: ${field} changed from ${fmt(c.before)}${unit} to ${fmt(c.after)}${unit}.`;
}
