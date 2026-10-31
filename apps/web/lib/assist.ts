// AI-assisted features. Live: local FastAPI + Ollama. Demo: answers recorded from the same
// endpoints by scripts/record_demo_ai.py, always labelled with model and date.
import fixtures from '../demo/fixtures.json';
import {api, DEMO, store} from './client';

export type AiStatus = {available: boolean; embeddings: boolean; gen_model: string; embed_model: string; runtime: string; recorded_at?: string};
export type DigestItem = {change_ids: string[]; text: string; from_facts?: boolean};
export type Digest = {from: string; to: string; mode: 'ai' | 'fallback'; model: string | null; summary: string; items: DigestItem[];
  facts: {id: string; fact: string}[]; repaired?: number; recorded_at?: string};
export type CoachSource = {id: string; title: string; text: string; score: number};
export type CoachAnswer = {mode: 'ai' | 'fallback' | 'abstained' | 'demo'; model: string | null; abstained: boolean; offer_escalation: boolean;
  answer: string; citations: string[]; sources: CoachSource[]; retrieval?: string; recorded_at?: string};
export type Draft = {mode: 'ai' | 'fallback'; model: string | null; subject: string; body: string; notice: string; recorded_at?: string};
export type Escalation = {id: string; status: 'queued' | 'answered' | 'withdrawn'; subject: string; body: string; about: string | null;
  drafted_by: string; answer: string | null; created_at: string; updated_at: string; external_delivery: string; replayed?: boolean};
export type AiLogEntry = {id: number; feature: string; model: string; status: string; created_at: string; detail: Record<string, unknown>};

type Recorded = {recorded_at?: string; model?: string; digest?: Digest; coach?: {question: string; about: string | null; response: CoachAnswer}[];
  draft?: Draft; log?: AiLogEntry[]};
export const recorded = (fixtures.recorded_ai || {}) as Recorded;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const SUGGESTED = (recorded.coach || []).map(c => c.question).length
  ? (recorded.coach || []).map(c => c.question)
  : ['When is the reading check quiz due?', 'What goes in an empathy map?', 'What changed in the point-of-view exercise?'];

export const assist = {
  status: (): Promise<AiStatus> => DEMO
    ? Promise.resolve({available: false, embeddings: false, gen_model: recorded.model || 'qwen2.5:7b', embed_model: 'bge-m3', runtime: 'recorded answers (public demo)', recorded_at: recorded.recorded_at})
    : api('/api/ai/status'),
  digest: (from = 'v1'): Promise<Digest> => {
    if (!DEMO) return api('/api/digest', {method: 'POST', body: JSON.stringify({from_version: from}), timeoutMs: 120000});
    if (recorded.digest) return Promise.resolve({...recorded.digest, recorded_at: recorded.recorded_at});
    return Promise.reject(new Error('No recorded digest in this demo build.'));
  },
  coach: (question: string, about?: string | null): Promise<CoachAnswer> => {
    if (!DEMO) return api('/api/coach', {method: 'POST', body: JSON.stringify({question, about: about || null}), timeoutMs: 120000});
    const hit = (recorded.coach || []).find(c => norm(c.question) === norm(question) && (c.about || null) === (about || null))
      || (recorded.coach || []).find(c => norm(c.question) === norm(question));
    if (hit) return Promise.resolve({...hit.response, recorded_at: recorded.recorded_at});
    return Promise.resolve({mode: 'demo', model: null, abstained: true, offer_escalation: false, citations: [], sources: [],
      answer: 'The public demo only has recorded answers for the suggested questions. Run the local app to ask anything with the live model.'});
  },
  draft: (question: string, about?: string | null, context?: string): Promise<Draft> => {
    if (!DEMO) return api('/api/escalations/draft', {method: 'POST', body: JSON.stringify({question, about: about || null, context: context || null}), timeoutMs: 120000});
    return Promise.resolve({mode: 'fallback', model: null, subject: `Question about ${about || 'my course task'}`.slice(0, 120),
      body: `Hello, I am catching up after missing a session. ${question} Could you confirm the correct information? Thank you.`,
      notice: 'Demo draft from the fixed template. Nothing is sent; it stays in this browser.'});
  },
  escalations: async (): Promise<Escalation[]> => DEMO ? store.get<Escalation[]>('escalations', []) : api('/api/escalations'),
  createEscalation: async (x: {idempotency_key: string; subject: string; body: string; about: string | null; drafted_by: string}): Promise<Escalation> => {
    if (!DEMO) return api('/api/escalations', {method: 'POST', body: JSON.stringify({...x, approved_by_learner: true})});
    const all = store.get<Escalation[]>('escalations', []);
    const existing = all.find(e => e.id === x.idempotency_key);
    if (existing) return {...existing, replayed: true};
    const e: Escalation = {id: x.idempotency_key, status: 'queued', subject: x.subject, body: x.body, about: x.about, drafted_by: x.drafted_by,
      answer: null, created_at: now(), updated_at: now(), external_delivery: 'none (stays in this browser)'};
    store.set('escalations', [e, ...all]);
    return e;
  },
  updateEscalation: async (id: string, status: 'answered' | 'withdrawn', answer?: string): Promise<Escalation> => {
    if (!DEMO) return api(`/api/escalations/${id}`, {method: 'PATCH', body: JSON.stringify({status, answer: answer || null})});
    const all = store.get<Escalation[]>('escalations', []);
    const next = all.map(e => e.id === id ? {...e, status, answer: status === 'answered' ? answer || null : null, updated_at: now()} : e);
    store.set('escalations', next);
    return next.find(e => e.id === id)!;
  },
  log: async (): Promise<{counts: Record<string, number>; entries: AiLogEntry[]}> => {
    if (!DEMO) return api('/api/ai/log');
    const entries = recorded.log || [];
    const counts: Record<string, number> = {};
    entries.forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return {counts, entries};
  },
};

export function newKey(): string {
  return (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}
