// Studio data access. Live: FastAPI studio routes. Demo: the same operations on browser storage,
// with the key backend rules mirrored (exact quotes, consent, HMW prefix, frozen protocols, one vote).
import fixtures from '../demo/fixtures.json';
import {api, ApiError, DEMO, store} from './client';

export type Item = {id: string; kind: string; parent_id: string | null; created_at: string; updated_at: string; [k: string]: any}; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Kind = 'notes' | 'codes' | 'themes' | 'hmw' | 'ideas' | 'votes' | 'scores' | 'experiments' | 'sessions';
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
    const kinds: Kind[] = ['notes', 'codes', 'themes', 'hmw', 'ideas', 'votes', 'scores', 'experiments', 'sessions'];
    return (await Promise.all(kinds.map(k => api<Item[]>(`/api/studio/${k}`)))).flat();
  },
  create: async (kind: Kind, body: Record<string, unknown>, parent_id?: string | null): Promise<Item> => {
    if (!DEMO) return api(`/api/studio/${kind}`, {method: 'POST', body: JSON.stringify({parent_id: parent_id || null, body})});
    const items = all();
    const parent = parent_id ? items.find(i => i.id === parent_id) : undefined;
    demoCheck(kind, parent, body);
    const rest = kind === 'scores' ? items.filter(i => !(i.kind === 'scores' && i.alternative === body.alternative && i.criterion === body.criterion && i.scorer === body.scorer)) : items;
    const item: Item = {id: uid(), kind, parent_id: parent_id || null, created_at: stamp(), updated_at: stamp(), status: kind === 'codes' ? 'accepted' : undefined, origin: 'human', ...body};
    save([...rest, item]);
    return item;
  },
  update: async (kind: Kind, id: string, patch: Record<string, unknown>): Promise<Item> => {
    if (!DEMO) return api(`/api/studio/${kind}/${id}`, {method: 'PATCH', body: JSON.stringify(patch)});
    const items = all();
    const cur = items.find(i => i.id === id) || fail(404, 'Unknown item');
    if (kind === 'experiments' && cur.frozen_at && ['title', 'hypothesis', 'conditions', 'tasks', 'metrics'].some(k => k in patch)) fail(409, 'The protocol is frozen');
    const next = {...cur, ...patch, updated_at: stamp()};
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
