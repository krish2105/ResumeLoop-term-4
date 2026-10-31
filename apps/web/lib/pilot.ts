// Browser-only pilot. A coordinator shares an approved course file; each learner loads it on their own device.
// Checks mirror services/api/app/coordinator.py. Nothing leaves the browser except files people choose to download,
// and there is no AI here: the digest is computed and the coach shows the closest course passage.
import {describe, diffVersions} from './changes';
import {PlanInputError, validateGraph} from './planner';
import type {Change, CourseAction, CourseInfo, Source} from './types';

export type PilotVersion = {version: string; published_at: string; actions: CourseAction[]};
export type PilotCourse = {course: string; notice: string; source_owner: string; timezone: string; versions: PilotVersion[]; sources: Source[]};
export type PilotRecord = {course: PilotCourse; sha256: string; loaded_at: string; confirmed_by: 'coordinator' | 'learner'};

const KEY = 'rl-demo-pilot';  // the rl-demo- prefix means "Clear demo data" removes it too
const KINDS = ['recap', 'reading', 'exercise', 'assessment', 'reflection'];
const DUE = ['none', 'unverified', 'verified', 'conflict'];
const TOP_KEYS = ['course', 'notice', 'source_owner', 'timezone', 'versions', 'sources', 'demo_learner'];
const ACTION_KEYS = ['id', 'title', 'session', 'kind', 'minutes', 'prerequisites', 'due', 'due_status', 'source_ref'];
export const MAX_FILE_BYTES = 1_000_000;

// ---------- checking a course file ----------
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, min: number, max: number) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const int = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

function checkAction(a: unknown, where: string, errors: string[]): CourseAction | null {
  if (!isObj(a)) { errors.push(`${where}: must be an object`); return null; }
  const before = errors.length;
  for (const k of Object.keys(a)) if (!ACTION_KEYS.includes(k)) errors.push(`${where}.${k}: unknown field`);
  if (typeof a.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,39}$/.test(a.id)) errors.push(`${where}.id: lower-case letters, digits and dashes, 2-40 characters`);
  if (!str(a.title, 3, 120)) errors.push(`${where}.title: 3-120 characters`);
  if (!int(a.session, 1, 20)) errors.push(`${where}.session: a whole number from 1 to 20`);
  if (!KINDS.includes(a.kind as string)) errors.push(`${where}.kind: one of ${KINDS.join(', ')}`);
  if (a.minutes !== undefined && a.minutes !== null && !int(a.minutes, 1, 240)) errors.push(`${where}.minutes: 1-240, or null when unknown`);
  const prereqs = a.prerequisites ?? [];
  if (!Array.isArray(prereqs) || prereqs.length > 12 || prereqs.some(p => typeof p !== 'string')) errors.push(`${where}.prerequisites: up to 12 task ids`);
  if (a.due !== undefined && a.due !== null && typeof a.due !== 'string') errors.push(`${where}.due: a date string or null`);
  if (a.due_status !== undefined && !DUE.includes(a.due_status as string)) errors.push(`${where}.due_status: one of ${DUE.join(', ')}`);
  if (typeof a.source_ref !== 'string' || !/^S\d{1,2}$/.test(a.source_ref)) errors.push(`${where}.source_ref: like S3`);
  if (errors.length > before) return null;
  return {id: a.id as string, title: (a.title as string).trim(), session: a.session as number, kind: a.kind as CourseAction['kind'],
    minutes: (a.minutes as number | null | undefined) ?? null, prerequisites: prereqs as string[], due: (a.due as string | null | undefined) ?? null,
    due_status: (a.due_status as CourseAction['due_status'] | undefined) ?? 'none', source_ref: a.source_ref as string};
}

/** Same rules as the server import: schema, unique ids and versions, a valid prerequisite graph, known sources. */
export function checkPackage(raw: unknown): {course: PilotCourse | null; errors: string[]} {
  const errors: string[] = [];
  if (!isObj(raw)) return {course: null, errors: ['The file must contain one JSON object. Start from the template.']};
  for (const k of Object.keys(raw)) if (!TOP_KEYS.includes(k)) errors.push(`${k}: unknown field`);
  if (!str(raw.course, 3, 200)) errors.push('course: a name of 3-200 characters');
  if (raw.notice !== undefined && !str(raw.notice, 0, 600)) errors.push('notice: up to 600 characters');
  if (!str(raw.source_owner, 2, 200)) errors.push('source_owner: who owns the course content (2-200 characters)');
  if (!str(raw.timezone, 3, 60)) errors.push('timezone: for example Asia/Dubai');
  const versions: PilotVersion[] = [];
  if (!Array.isArray(raw.versions) || !raw.versions.length || raw.versions.length > 50) errors.push('versions: 1-50 versions');
  else raw.versions.forEach((v, i) => {
    if (!isObj(v)) { errors.push(`versions.${i}: must be an object`); return; }
    if (typeof v.version !== 'string' || !/^v\d{1,3}$/.test(v.version)) errors.push(`versions.${i}.version: like v1`);
    if (typeof v.published_at !== 'string') errors.push(`versions.${i}.published_at: a date string`);
    if (!Array.isArray(v.actions) || !v.actions.length || v.actions.length > 200) { errors.push(`versions.${i}.actions: 1-200 tasks`); return; }
    const actions = v.actions.map((a, j) => checkAction(a, `versions.${i}.actions.${j}`, errors));
    if (actions.every(Boolean)) versions.push({version: v.version as string, published_at: v.published_at as string, actions: actions as CourseAction[]});
  });
  const sources: Source[] = [];
  if (raw.sources !== undefined) {
    if (!Array.isArray(raw.sources) || raw.sources.length > 200) errors.push('sources: up to 200 passages');
    else raw.sources.forEach((s, i) => {
      if (!isObj(s) || typeof s.id !== 'string' || !/^S\d{1,2}$/.test(s.id) || !Number.isInteger(s.session) || typeof s.title !== 'string' || typeof s.text !== 'string')
        errors.push(`sources.${i}: needs id (like S3), session, title and text`);
      else sources.push({id: s.id, session: s.session as number, title: s.title, text: s.text});
    });
  }
  if (errors.length) return {course: null, errors: errors.slice(0, 40)};
  const ids = sources.map(s => s.id);
  if (new Set(ids).size !== ids.length) errors.push('sources: duplicate source id');
  const names = versions.map(v => v.version);
  if (new Set(names).size !== names.length) errors.push('versions: duplicate version name');
  for (const v of versions) {
    try { validateGraph(v.actions); } catch (e) { if (e instanceof PlanInputError) errors.push(...e.errors.map(x => `${v.version}: ${x}`)); else throw e; }
    const missing = ids.length ? [...new Set(v.actions.map(a => a.source_ref))].filter(r => !ids.includes(r)).sort() : [];
    if (missing.length) errors.push(`${v.version}: tasks cite unknown sources ${missing.join(', ')}`);
  }
  if (errors.length) return {course: null, errors: errors.slice(0, 40)};
  const r = raw as Obj;
  return {course: {course: (r.course as string).trim(), notice: ((r.notice as string) || '').trim(), source_owner: (r.source_owner as string).trim(),
    timezone: (r.timezone as string).trim(), versions, sources}, errors: []};
}

export async function fingerprint(course: PilotCourse): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(course));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- the active pilot in this browser ----------
export function activePilot(): PilotRecord | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as PilotRecord : null; } catch { return null; }
}
export function setPilot(record: PilotRecord): void { localStorage.setItem(KEY, JSON.stringify(record)); }
export function leavePilot(): void { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

export function pilotCourses(p: PilotRecord): Record<string, CourseInfo> {
  const c = p.course;
  return Object.fromEntries(c.versions.map(v => [v.version, {
    course: c.course, notice: c.notice || `Pilot course from ${c.source_owner}, loaded in this browser only.`, source_owner: c.source_owner,
    timezone: c.timezone, schema_version: 'course-actions/v1', versions: c.versions.map(x => x.version), version: v.version,
    published_at: v.published_at, actions: v.actions, sources: c.sources, source_type: 'PILOT' as const}]));
}
const version = (p: PilotRecord, name?: string) => p.course.versions.find(v => v.version === name) || p.course.versions[0];
const newest = (p: PilotRecord) => p.course.versions[p.course.versions.length - 1];

export function pilotChanges(p: PilotRecord, from?: string): {from: string; to: string; changes: Change[]} {
  const old = version(p, from), now = newest(p);
  return {from: old.version, to: now.version, changes: diffVersions(old.actions, now.actions)};
}

export function pilotDigest(p: PilotRecord, from?: string) {
  const d = pilotChanges(p, from);
  const facts = d.changes.map(c => ({id: c.id, fact: describe(c)}));
  return {from: d.from, to: d.to, mode: 'fallback' as const, model: null, facts,
    summary: d.changes.length ? `${d.changes.length} changes between ${d.from} and ${d.to}, computed from the course versions.` : 'Nothing changed since your last visit.',
    items: facts.map(f => ({change_ids: [f.id], text: f.fact, from_facts: true}))};
}

// ---------- coach: keyword search over the course passages (no AI in the browser) ----------
const STOP = new Set('a an and are as at be by can do does for from has have how i if in is it my of on or the this to was what when where which who why will with you your'.split(' '));
const tokens = (t: string) => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => !STOP.has(w) && w.length > 1);

type Chunk = {id: string; source_id: string; title: string; text: string};
function chunks(p: PilotRecord): Chunk[] {
  return p.course.sources.flatMap(s => s.text.split('\n\n').map(x => x.trim()).filter(Boolean)
    .map((text, i) => ({id: `${s.id}-p${i + 1}`, source_id: s.id, title: s.title, text})));
}

function keywordScores(query: string, items: Chunk[]): number[] {
  const q = [...new Set(tokens(query))];
  const words = items.map(c => tokens(c.text + ' ' + c.title));
  const df = Object.fromEntries(q.map(t => [t, words.filter(w => w.includes(t)).length]));
  return words.map(w => q.filter(t => w.includes(t))
    .reduce((s, t) => s + w.filter(x => x === t).length / (1 + 0.1 * w.length) * Math.log(1 + items.length / (1 + df[t])), 0));
}

export function pilotCoach(p: PilotRecord, question: string, aboutId?: string | null) {
  const about = aboutId ? newest(p).actions.find(a => a.id === aboutId) : undefined;
  const items = chunks(p);
  const scores = keywordScores(question + (about ? ` (${about.title})` : ''), items);
  const order = items.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  let picked = order.slice(0, 4).filter(i => scores[i] >= 0.05);
  const pinned = about ? order.find(i => items[i].source_id === about.source_ref) : undefined;
  if (pinned !== undefined && !picked.includes(pinned)) picked = [pinned, ...picked.slice(0, 3)];
  const sources = picked.map(i => ({id: items[i].id, title: items[i].title, text: items[i].text, score: Math.round(scores[i] * 1000) / 1000}));
  if (about) {
    const changed = pilotChanges(p).changes.filter(c => c.action_id === about.id);
    sources.push({id: `CL-${about.id}`, title: 'Course change log (computed from the versions)', score: 1,
      text: (changed.length ? changed.map(describe).join(' ') : `${about.title}: no changes.`) + ` (course version ${p.course.versions[0].version} to version ${newest(p).version})`});
  }
  if (!sources.length) return {mode: 'abstained' as const, model: null, abstained: true, offer_escalation: true, citations: [], sources: [], retrieval: 'keywords',
    answer: "I can't find this in the course sources, so I won't guess. You can ask the coordinator instead."};
  const asksChange = /\b(chang|new|differ|updat|added|removed)/i.test(question);
  // Without a model nothing can combine passages, so show the two closest; the change log leads for "what changed".
  const top = (asksChange && sources.find(s => s.id.startsWith('CL-'))) || sources[0];
  const shown = [top, ...sources.filter(s => s !== top && !s.id.startsWith('CL-')).slice(0, 1)];
  return {mode: 'fallback' as const, model: null, abstained: false, offer_escalation: true, citations: shown.map(s => s.id), sources, retrieval: 'keywords',
    answer: `There is no AI in the browser pilot, so here are the closest course passages. ${shown.map(s => `[${s.id}] ${s.text}`).join(' ')}`};
}

export function pilotSuggestions(p: PilotRecord): string[] {
  const actions = newest(p).actions;
  const due = actions.find(a => a.due), exercise = actions.find(a => a.kind === 'exercise' && a.prerequisites.length);
  return ['What changed in the course?', ...(due ? [`When is ${due.title} due?`] : []), ...(exercise ? [`What do I need before ${exercise.title}?`] : [])];
}

// ---------- progress files: a learner shares, a coordinator combines ----------
export const CODE = /^[A-Za-z0-9-]{2,20}$/;
export type ProgressFile = {kind: 'resumeloop-progress'; schema: 'progress/v1'; course: string; course_sha256: string; learner_code: string;
  exported_at: string; completed: string[]; seen_version: string; budget_minutes: number; open_questions: string[]};

export function progressFile(p: PilotRecord, code: string, state: {completed: string[]; seen_version: string; budget_minutes: number}, openQuestions: string[]): ProgressFile {
  if (!CODE.test(code)) throw new Error('Use the short code your coordinator gave you (2-20 letters, digits or dashes), not your name.');
  return {kind: 'resumeloop-progress', schema: 'progress/v1', course: p.course.course, course_sha256: p.sha256, learner_code: code,
    exported_at: new Date().toISOString(), completed: state.completed, seen_version: state.seen_version, budget_minutes: state.budget_minutes,
    open_questions: openQuestions.slice(0, 20)};
}

export function readProgressFile(raw: unknown, p: PilotRecord): {file: ProgressFile | null; error?: string} {
  if (!isObj(raw) || raw.kind !== 'resumeloop-progress' || raw.schema !== 'progress/v1') return {file: null, error: 'not a ResumeLoop progress file'};
  if (raw.course_sha256 !== p.sha256) return {file: null, error: 'made for a different course file (fingerprints differ)'};
  if (typeof raw.learner_code !== 'string' || !CODE.test(raw.learner_code)) return {file: null, error: 'learner code is missing or invalid'};
  if (!Array.isArray(raw.completed) || raw.completed.some(x => typeof x !== 'string')) return {file: null, error: 'completed tasks are not a list'};
  return {file: raw as unknown as ProgressFile};
}

export function rollUp(files: ProgressFile[], p: PilotRecord) {
  const latest = newest(p);
  const ids = new Set(latest.actions.map(a => a.id));
  const byCode = new Map<string, ProgressFile>();
  for (const f of files) { const prev = byCode.get(f.learner_code); if (!prev || prev.exported_at < f.exported_at) byCode.set(f.learner_code, f); }
  const learners = [...byCode.values()].sort((a, b) => a.learner_code.localeCompare(b.learner_code)).map(f => ({
    code: f.learner_code, done: f.completed.filter(id => ids.has(id)).length, of: ids.size, seenLatest: f.seen_version === latest.version,
    open: f.open_questions.length, exported: f.exported_at.slice(0, 16).replace('T', ' ')}));
  const tasks = latest.actions.map(a => ({id: a.id, title: a.title, done: learners.filter(l => byCode.get(l.code)!.completed.includes(a.id)).length}));
  const questions = [...byCode.values()].flatMap(f => f.open_questions.map(q => ({code: f.learner_code, q})));
  return {learners, tasks, questions, latest: latest.version};
}
