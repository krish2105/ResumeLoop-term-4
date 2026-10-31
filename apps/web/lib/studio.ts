// Studio data access. Live: FastAPI studio routes. Demo: the same operations on browser storage,
// with the key backend rules mirrored (exact quotes, consent, HMW prefix, frozen protocols, one vote).
import fixtures from '../demo/fixtures.json';
import {api, ApiError, DEMO, store} from './client';

export type Item = {id: string; kind: string; parent_id: string | null; created_at: string; updated_at: string; [k: string]: any}; // eslint-disable-line @typescript-eslint/no-explicit-any
export const KINDS = ['notes', 'codes', 'themes', 'hmw', 'ideas', 'votes', 'scores', 'experiments', 'sessions',
  'observations', 'personas', 'povs', 'storyboards', 'hills', 'scenarios', 'journeys', 'sprints', 'prototypes', 'risks', 'roleplays',
  'reflections', 'members', 'contributions', 'milestones', 'rubric', 'sdg', 'readings', 'flashcards', 'participation', 'participants', 'interviews'] as const;
export type Kind = typeof KINDS[number];

const LEITNER: Record<number, number> = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16};
// Bibliographic references from the unit outline (mirrors studio.py READINGS).
export const READING_LIST: [number | null, string, string, number | null, string, boolean][] = [
  [null, 'The Field Guide to Human-Centered Design', 'IDEO', 2019, 'book', true], [1, 'Use Design Thinking to Navigate Ambiguity', 'Harvard Business Review', 2025, 'article', true],
  [2, 'AI Wars in 2025', 'HBS case 725-484', 2025, 'case', true], [3, 'How People Are Really Using Gen AI in 2025', 'Harvard Business Review', 2025, 'article', true],
  [4, 'Innovation: Our Shared Responsibility', 'Anthony, Cobban, Painchaud, Parker', 2020, 'article', true], [4, "The Kind of Creative Thinking That Fuelled WeChat's Success", 'Birkinshaw, Ke, de Diego', 2019, 'article', true],
  [4, 'How LinkedIn Redesigned Its HQ for Hybrid Work', 'Britz, Norwood', 2022, 'article', true], [4, 'An Art and a Science: How to Apply Design Thinking in Data Science Challenges', 'Parzen, Lin, Ng, Li', 2023, 'case', true],
  [5, 'AI-Generated "Workshop" Is Destroying Productivity', 'Harvard Business Review', 2025, 'article', true], [5, 'SBR: IBM Design Thinking Case Study', 'Datar, Migdal, Hamilton', 2021, 'case', true],
  [6, '5 Critical Skills Leaders Need in the Age of AI', 'Harvard Business Review', 2025, 'article', true], [7, 'The Right Way to Lead Design Thinking', 'Bason, Austin', 2019, 'article', true],
  [7, 'What Happens When Data Scientists and Designers Work Together', 'Malmgren, Wettersten', 2018, 'article', true], [7, 'Design Thinking and Innovation at Apple', 'Case study', null, 'case', true],
  [8, 'SBR 2: SAP Design Thinking Case Study', 'Saucedo, Shiv', 2016, 'case', true], [9, 'Hope and Grit: How Human-Centered Product Design Enhanced Student Mental Health', 'Rochlin', 2022, 'case', true],
  [10, 'Moderna: Democratizing Artificial Intelligence', 'Bojinov, Lakhani, Hildebrandt, Weber', 2025, 'case', true], [11, 'Leveraging AI in Business: 3 Real-World Examples', 'Article', null, 'article', true],
  [null, 'Design Thinking', 'Brown', 2008, 'article', false], [null, 'Design for Action', 'Martin, Brown', 2015, 'article', false],
  [null, 'Design Thinking Comes of Age', 'Kolko', 2015, 'article', false], [null, 'AI and Strategy: Lessons from Real-World Cases', 'Chan Kim, Mauborgne, Mi', 2025, 'article', false],
];
// Mirrors services/api/app/studio.py COMPONENTS / RUBRIC (from the outline, as recorded in docs/ASSESSMENT.md).
export const COURSE_HUB = {
  components: [['Class participation (in-class quizzes)', 10], ['Individual assignments (reading quizzes)', 10],
    ['Group assignment and Week 12 UN SDG presentation', 40], ['Reflective paper', 40]] as [string, number][],
  rubric: {
    'Individual (§3.3)': ['Use of a relevant framework', 'Analysis of data and information', 'Understanding of key issues', 'Decision among alternatives', 'Articulation of thoughts'],
    'Group (§3.4)': ['Use of a relevant framework', 'Analysis of data and information', 'Understanding of key issues', 'Quality of content (research and relevance)',
      'Quality of recommendation (feasibility and impact)', 'Quality of presentation', 'Quality of visual presentation', 'Individual oral presentation and defence'],
    'Reflective paper (§3.5)': ['Concept explained in my own words', 'How it helps an organisation achieve its objectives', 'Detailed, practical real-world example'],
  } as Record<string, string[]>,
};
export const CATEGORIES = ['says', 'does', 'thinks', 'feels', 'need'] as const;
export const ALTERNATIVES = [['lms-checklist', 'Improved LMS checklist'], ['coordinator-brief', 'Coordinator recovery brief'], ['resumeloop', 'ResumeLoop plan']] as const;
export const CRITERIA = ['source traceability', 'accessibility', 'learner effort', 'privacy', 'coordinator effort'] as const;

type RecordedCodes = Record<string, {codes: {label: string; quote: string; category: string}[]; rejected: number; model: string}>;
type RecordedHmw = Record<string, {questions: string[]; model: string}>;
const rec = (fixtures.recorded_ai || {}) as unknown as {codes?: RecordedCodes; hmw?: RecordedHmw; recorded_at?: string};
const examples = (fixtures as unknown as {studio_examples?: {notice: string; notes: Record<string, unknown>[]; experiment: Record<string, unknown>}}).studio_examples;

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
const CONTACT = /[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d\s().-]{7,}\d/;
const stamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const all = (): Item[] => store.get<Item[]>('studio', []);
const save = (items: Item[]) => store.set('studio', items);
const fail = (status: number, message: string) => { throw new ApiError(status, message); };

function demoCheck(kind: Kind, parent: Item | undefined, body: Record<string, unknown>) {
  if (kind === 'notes') {
    if (!/^P\d{2,3}$/.test(String(body.participant_code))) fail(422, 'Participant code must look like P01');
    if (String(body.text || '').length < 20) fail(422, 'Notes need at least 20 characters');
    if (CONTACT.test(String(body.text))) fail(422, 'Remove emails and phone numbers before saving a research note');
  }
  if (kind === 'codes' && parent && !norm(parent.text).includes(norm(String(body.quote || '')))) fail(422, 'The quote must be copied exactly from the note');
  if (kind === 'hmw' && !String(body.question || '').toLowerCase().startsWith('how might we')) fail(422, 'Start with "How might we"');
  if (kind === 'sessions' && parent && !parent.frozen_at) fail(409, 'Freeze the experiment protocol before recording sessions');
  if (kind === 'votes' && all().some(v => v.kind === 'votes' && v.parent_id === parent?.id && v.voter === body.voter)) fail(409, 'This person already voted for this idea');
}

export const studio = {
  list: async (kind: Kind, parent?: string): Promise<Item[]> => DEMO
    ? all().filter(i => i.kind === kind && (!parent || i.parent_id === parent))
    : api(`/api/studio/${kind}${parent ? `?parent=${parent}` : ''}`),
  everything: async (): Promise<Item[]> => {
    if (DEMO) return all();
    return (await Promise.all(KINDS.map(k => api<Item[]>(`/api/studio/${k}`)))).flat();
  },
  create: async (kind: Kind, body: Record<string, unknown>, parent_id?: string | null): Promise<Item> => {
    if (!DEMO) return api(`/api/studio/${kind}`, {method: 'POST', body: JSON.stringify({parent_id: parent_id || null, body})});
    const items = all();
    const parent = parent_id ? items.find(i => i.id === parent_id) : undefined;
    demoCheck(kind, parent, body);
    const rest = kind === 'scores' ? items.filter(i => !(i.kind === 'scores' && i.alternative === body.alternative && i.criterion === body.criterion && i.scorer === body.scorer)) : items;
    const item: Item = {status: kind === 'codes' ? 'accepted' : undefined, origin: 'human', ...body, id: uid(), kind, parent_id: parent_id || null, created_at: stamp(), updated_at: stamp()};
    save([...rest, item]);
    return item;
  },
  update: async (kind: Kind, id: string, patch: Record<string, unknown>): Promise<Item> => {
    if (!DEMO) return api(`/api/studio/${kind}/${id}`, {method: 'PATCH', body: JSON.stringify(patch)});
    const items = all();
    const cur = items.find(i => i.id === id) || fail(404, 'Unknown item');
    if (kind === 'experiments' && cur.frozen_at && ['title', 'hypothesis', 'conditions', 'tasks', 'metrics'].some(k => k in patch)) fail(409, 'The protocol is frozen');
    const next = {...cur, ...patch, id: cur.id, kind: cur.kind, parent_id: cur.parent_id, created_at: cur.created_at, updated_at: stamp()};
    save(items.map(i => i.id === id ? next : i));
    return next;
  },
  remove: async (kind: Kind, id: string): Promise<void> => {
    if (!DEMO) { await api(`/api/studio/${kind}/${id}`, {method: 'DELETE'}); return; }
    save(all().filter(i => i.id !== id && i.parent_id !== id));
  },
  freeze: async (id: string): Promise<Item> => {
    if (!DEMO) return api(`/api/studio/experiments/${id}/freeze`, {method: 'POST'});
    const cur = all().find(i => i.id === id) || fail(404, 'Unknown experiment');
    if (cur.frozen_at) return cur;
    const core = JSON.stringify({conditions: cur.conditions, hypothesis: cur.hypothesis, metrics: cur.metrics, tasks: cur.tasks, title: cur.title});
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(core));
    const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    return studio.update('experiments', id, {frozen_at: new Date().toISOString().slice(0, 19) + 'Z', protocol_sha256: hash});
  },
  suggestCodes: async (noteId: string): Promise<{mode: string; model: string | null; saved: Item[]; rejected: number; message?: string; recorded_at?: string}> => {
    if (!DEMO) return api(`/api/studio/notes/${noteId}/suggest-codes`, {method: 'POST', timeoutMs: 120000});
    const note = all().find(i => i.id === noteId) || fail(404, 'Unknown note');
    if (!note.consent?.anonymised_notes) fail(409, 'This participant did not consent to note analysis');
    const r = rec.codes?.[note.participant_code];
    if (!r || !note.synthetic) return {mode: 'fallback', model: null, saved: [], rejected: 0, message: 'The public demo only has recorded suggestions for the fictional example notes. Code this note by hand, or run the local app.'};
    const saved: Item[] = [];
    for (const c of r.codes) saved.push(await studio.create('codes', {...c, status: 'suggested', origin: 'ai', theme_id: null}, noteId));
    return {mode: 'ai', model: r.model, saved, rejected: r.rejected, recorded_at: rec.recorded_at};
  },
  suggestHmw: async (themeId: string, insight: string): Promise<{mode: string; model: string | null; questions: string[]; recorded_at?: string}> => {
    if (!DEMO) return api(`/api/studio/themes/${themeId}/suggest-hmw`, {method: 'POST', body: JSON.stringify({insight}), timeoutMs: 120000});
    const r = Object.entries(rec.hmw || {}).find(([k]) => norm(k) === norm(insight))?.[1];
    return r ? {mode: 'ai', model: r.model, questions: r.questions, recorded_at: rec.recorded_at} : {mode: 'fallback', model: null, questions: []};
  },
  loadExamples: async (): Promise<{loaded: number; notice: string}> => {
    if (!DEMO) return api('/api/studio-examples', {method: 'POST'});
    if (!examples) fail(500, 'No examples in this build');
    if (all().some(i => i.kind === 'notes' && i.synthetic)) return {loaded: 0, notice: examples!.notice};
    for (const n of examples!.notes) await studio.create('notes', {...n, consent: {participation: true, anonymised_notes: true, quotes: true}, synthetic: true});
    await studio.create('experiments', {...examples!.experiment, frozen_at: null, protocol_sha256: null, synthetic: true});
    return {loaded: examples!.notes.length + 1, notice: examples!.notice};
  },
  seedReadings: async (): Promise<{loaded: number}> => {
    if (!DEMO) return api('/api/studio-examples/readings', {method: 'POST'});
    if (all().some(i => i.kind === 'readings')) return {loaded: 0};
    for (const [week, title, authors, year, source_kind, required] of READING_LIST) await studio.create('readings', {week, title, authors, year, source_kind, required, status: 'to-read', summary: '', key_concepts: '', questions: ''});
    return {loaded: READING_LIST.length};
  },
  reviewCard: async (id: string, correct: boolean): Promise<Item> => {
    const today = new Date().toISOString().slice(0, 10);
    if (!DEMO) return api(`/api/studio/flashcards/${id}/review`, {method: 'POST', body: JSON.stringify({correct, today})});
    const card = all().find(i => i.id === id) || fail(404, 'Unknown card');
    const box = correct ? Math.min(5, card.box + 1) : 1;
    const due = new Date(Date.parse(today) + LEITNER[box] * 86400000).toISOString().slice(0, 10);
    return studio.update('flashcards', id, {box, due, reviews: card.reviews + 1, correct: card.correct + (correct ? 1 : 0)});
  },
  interviewToNote: async (id: string): Promise<{codes: number}> => {
    if (!DEMO) return api(`/api/studio/interviews/${id}/to-note`, {method: 'POST'});
    const iv = all().find(i => i.id === id) || fail(404, 'Unknown interview');
    if (iv.converted_note_id) fail(409, 'Already converted to a note');
    const p = all().find(i => i.kind === 'participants' && i.code === iv.participant_code);
    if (!p || p.consent !== 'consented') fail(409, 'Record consent for this participant in the tracker first');
    const text = iv.moments.map((m: {t: number; text: string}) => `[${String(Math.floor(m.t / 60)).padStart(2, '0')}:${String(m.t % 60).padStart(2, '0')}] ${m.text}`).join('\n');
    if (text.length < 20) fail(422, 'Capture a few moments before converting');
    const note = await studio.create('notes', {participant_code: iv.participant_code, context: `Interview ${iv.date} (${iv.guide} guide)`, text,
      consent: {participation: true, anonymised_notes: true, quotes: false}, synthetic: false});
    let codes = 0;
    for (const m of iv.moments) if (['says', 'does', 'thinks', 'feels', 'need'].includes(m.tag)) { await studio.create('codes', {label: m.text.slice(0, 60), quote: m.text, category: m.tag, status: 'accepted', origin: 'human', theme_id: null}, note.id); codes++; }
    await studio.update('interviews', id, {converted_note_id: note.id});
    return {codes};
  },
  seedCourseHub: async (): Promise<{loaded: number}> => {
    if (!DEMO) return api('/api/studio-examples/course-hub', {method: 'POST'});
    if (all().some(i => i.kind === 'milestones')) return {loaded: 0};
    let n = 0;
    for (const [title, weight] of COURSE_HUB.components) { await studio.create('milestones', {title, weight, when_text: 'date not confirmed', status: 'unverified', source: 'Unit outline §2.5 / §3.1'}); n++; }
    for (const [component, criteria] of Object.entries(COURSE_HUB.rubric)) for (const criterion of criteria) { await studio.create('rubric', {component, criterion, status: 'missing', evidence: ''}); n++; }
    await studio.create('sdg', {goal: 'SDG 4 Quality Education (proposed, confirm with faculty)', targets: '4.3 equal access to education; 4.4 skills for youth and adults',
      problem: '', impact_hypothesis: '', indicator: '', evidence: '', risks: ''});
    return {loaded: n + 1};
  },
  clearExamples: async (): Promise<void> => {
    if (!DEMO) { await api('/api/studio-examples', {method: 'DELETE'}); return; }
    const ids = new Set(all().filter(i => (i.kind === 'notes' || i.kind === 'experiments') && i.synthetic).map(i => i.id));
    save(all().filter(i => !ids.has(i.id) && !ids.has(i.parent_id || '')));
  },
};

export function useName(): [string, (n: string) => void] {
  const get = () => { try { return localStorage.getItem('rl-name') || ''; } catch { return ''; } };
  const set = (n: string) => { try { localStorage.setItem('rl-name', n); } catch { /* ignore */ } };
  return [typeof window === 'undefined' ? '' : get(), set];
}
