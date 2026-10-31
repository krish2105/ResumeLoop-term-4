"""AI features. The model only phrases or suggests; code decides what is true.

Every output is validated against the inputs it was given. Invalid or missing output becomes a
labelled fallback or an abstention, and every call is written to `ai_log` for the ethics panel.
"""
import hashlib
import json
import re
import sqlite3

from .retrieval import search

GROUNDING = ('You are ResumeLoop, a careful study assistant for a FICTIONAL demo course. '
             'Use only the facts you are given. Never invent dates, tasks, grades or policies. Reply with JSON only.')
CATEGORIES = ('says', 'does', 'thinks', 'feels', 'need')


def log(conn: sqlite3.Connection, llm, feature: str, status: str, prompt: str, detail: dict) -> None:
    with conn:
        conn.execute('INSERT INTO ai_log (feature, model, status, prompt_sha256, detail_json) VALUES (?,?,?,?,?)',
                     (feature, llm.gen_model, status, hashlib.sha256(prompt.encode()).hexdigest(), json.dumps(detail)))


def describe(c: dict) -> str:
    if c['type'] == 'added':
        return f"New task added: {c['title']} (session {c['session']}, {c.get('minutes') or 'unknown'} min)."
    if c['type'] == 'removed':
        return f"Task removed: {c['title']} (session {c['session']})."
    field = {'due': 'deadline', 'due_status': 'deadline status', 'minutes': 'duration', 'prerequisites': 'prerequisites'}.get(c['field'], c['field'])
    return f"{c['title']}: {field} changed from {fmt(c['before'])} to {fmt(c['after'])}."


DUE_WORDS = {'none': 'no deadline', 'unverified': 'not verified', 'verified': 'verified by the coordinator',
             'conflict': 'sources disagree, unconfirmed'}


def fmt(v) -> str:
    if isinstance(v, list):
        return ', '.join(v) or 'none'
    if v is None:
        return 'none'
    if isinstance(v, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+04:00', v):
        from datetime import datetime
        return datetime.fromisoformat(v).strftime('%-d %b %Y %H:%M') + ' Dubai time'
    if isinstance(v, str) and v in DUE_WORDS:
        return f'"{DUE_WORDS[v]}"'
    return str(v)


# ---------- What-changed digest ----------
def digest(conn, llm, changes: list[dict]) -> dict:
    facts = [{'id': c['id'], 'fact': describe(c)} for c in changes]
    fallback = {'mode': 'fallback', 'model': None, 'summary': f'{len(changes)} changes since your last visit.',
                'items': [{'change_ids': [f['id']], 'text': f['fact']} for f in facts]}
    if not changes:
        return {**fallback, 'summary': 'Nothing changed since your last visit.'}
    prompt = ('Explain these course changes to a returning learner in plain, calm English. '
              'Group related changes. Every change id must appear in exactly one item. '
              'Return {"summary": "one sentence", "items": [{"change_ids": ["C1"], "text": "what changed and what to do"}]}.\n'
              + json.dumps(facts))
    out = llm.chat_json(GROUNDING, prompt)
    valid_ids = [f['id'] for f in facts]
    try:
        items = [{'change_ids': [str(i) for i in it['change_ids']], 'text': str(it['text']).strip()} for it in out['items']]
        used = [i for it in items for i in it['change_ids']]
        ok = (set(used) <= set(valid_ids) and len(used) == len(set(used)) and all(it['text'] for it in items)
              and isinstance(out.get('summary'), str))
    except (TypeError, KeyError):
        ok = False
    if not ok:
        log(conn, llm, 'digest', 'fallback' if out is None else 'invalid', prompt, {'changes': len(changes)})
        return fallback
    # Repair: any change the model skipped is appended verbatim, so no fact can silently disappear.
    skipped = [f for f in facts if f['id'] not in used]
    items += [{'change_ids': [f['id']], 'text': f['fact'], 'from_facts': True} for f in skipped]
    log(conn, llm, 'digest', 'ok', prompt, {'changes': len(changes), 'items': len(items), 'repaired': len(skipped)})
    return {'mode': 'ai', 'model': llm.gen_model, 'summary': out['summary'].strip(), 'items': items,
            'repaired': len(skipped)}


MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december'
FACT = re.compile(rf'\b(\d{{1,2}})\s+({MONTHS})\b|\b({MONTHS})\s+(\d{{1,2}})\b|\b(\d{{1,3}})\s*(?:minutes?|mins?)\b', re.I)
WORDS = {'five': 5, 'ten': 10, 'fifteen': 15, 'twenty': 20, 'twenty-five': 25, 'thirty': 30, 'thirty-five': 35, 'forty': 40}


def facts_in(text: str) -> set[str]:
    """Normalised dates ('26 november') and durations ('30 min') mentioned in a text."""
    t = text.lower()
    for w, n in WORDS.items():
        t = re.sub(rf'\b{w}\s+(minutes?)', f'{n} \\1', t)
    found = set()
    for m in FACT.finditer(t):
        if m.group(1):
            found.add(f'{int(m.group(1))} {m.group(2)}')
        elif m.group(3):
            found.add(f'{int(m.group(4))} {m.group(3)}')
        else:
            found.add(f'{int(m.group(5))} min')
    return found


# ---------- Grounded coach ----------
def coach(conn, llm, question: str, about: dict | None = None) -> dict:
    query = question + (f" ({about['title']})" if about else '')
    found = search(conn, llm, query)
    hits = found['hits']
    sources = [{'id': h['chunk_id'], 'title': h['title'], 'text': h['text'], 'score': h['score']} for h in hits]
    abstain = {'mode': 'abstained', 'model': llm.gen_model, 'abstained': True, 'offer_escalation': True,
               'answer': "I can't find this in the course sources, so I won't guess. You can ask the coordinator instead.",
               'citations': [], 'sources': sources, 'retrieval': found['method']}
    if not hits:
        log(conn, llm, 'coach', 'abstained', query, {'reason': 'no source above threshold', 'best': found['best_score']})
        return abstain
    numbered = '\n\n'.join(f"[{h['chunk_id']}] {h['title']}\n{h['text']}" for h in hits)
    prompt = (f'Sources:\n{numbered}\n\nQuestion: {question}\n'
              + (f"The learner is looking at: {about['title']} ({about.get('minutes')} min).\n" if about else '')
              + 'Answer in at most 4 sentences using only the sources. Cite every claim with source ids like [S3-p2]. '
                'If the sources do not answer the question, set "answerable" to false. '
                'Return {"answerable": true, "answer": "...", "citations": ["S3-p2"]}.')
    out = llm.chat_json(GROUNDING, prompt)
    if out is None:
        top = hits[0]
        log(conn, llm, 'coach', 'fallback', prompt, {'reason': 'model unavailable'})
        return {'mode': 'fallback', 'model': None, 'abstained': False, 'offer_escalation': True,
                'answer': f"AI is offline. The closest course passage is [{top['chunk_id']}]: {top['text']}",
                'citations': [top['chunk_id']], 'sources': sources, 'retrieval': found['method']}
    allowed = {h['chunk_id'] for h in hits}
    answer = str(out.get('answer', '')).strip()
    cited = set(re.findall(r'\[(S\d+-p\d+)\]', answer)) | {str(c) for c in out.get('citations', []) if isinstance(c, str)}
    # Facts guard: every date and duration in the answer must appear in the passages it cites.
    cited_text = ' '.join(h['text'] for h in hits if h['chunk_id'] in cited).lower()
    unsupported = [f for f in facts_in(answer) if f not in facts_in(cited_text)]
    if unsupported:
        log(conn, llm, 'coach', 'invalid', prompt, {'reason': 'unsupported facts', 'facts': unsupported})
        return abstain
    if not out.get('answerable', False) or not answer or not cited or not cited <= allowed:
        log(conn, llm, 'coach', 'abstained' if not out.get('answerable', False) else 'invalid', prompt,
            {'cited': sorted(cited), 'allowed': sorted(allowed)})
        return abstain
    log(conn, llm, 'coach', 'ok', prompt, {'cited': sorted(cited)})
    return {'mode': 'ai', 'model': llm.gen_model, 'abstained': False, 'offer_escalation': False, 'answer': answer,
            'citations': sorted(cited), 'sources': sources, 'retrieval': found['method']}


# ---------- Coordinator escalation draft ----------
def escalation_draft(conn, llm, question: str, about: dict | None, context: str | None) -> dict:
    title = about['title'] if about else 'my course task'
    fallback = {'mode': 'fallback', 'model': None, 'subject': f'Question about {title}'[:120],
                'body': f'Hello, I am catching up after missing a session. {question.strip()} '
                        'Could you confirm the correct information? Thank you.'}
    prompt = ('Draft a short, polite message from a learner to their course coordinator. Keep the learner\'s question, '
              'do not add facts, do not promise anything, no names. 2-4 sentences. '
              f'Return {{"subject": "...", "body": "..."}}.\nTask: {title}\nQuestion: {question}\nContext: {context or "none"}')
    out = llm.chat_json(GROUNDING, prompt)
    try:
        subject, body = str(out['subject']).strip(), str(out['body']).strip()
        ok = 3 <= len(subject) <= 120 and 20 <= len(body) <= 1200
    except (TypeError, KeyError):
        ok = False
    log(conn, llm, 'escalation_draft', 'ok' if ok else ('fallback' if out is None else 'invalid'), prompt, {})
    return {'mode': 'ai', 'model': llm.gen_model, 'subject': subject, 'body': body} if ok else fallback


# ---------- Qualitative coding suggestions ----------
def normalise(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip().lower()


def suggest_codes(conn, llm, note: str) -> dict:
    prompt = ('Suggest qualitative codes for this fictional research note. Each code needs a short label, '
              'an exact quote copied word for word from the note, and a category from says, does, thinks, feels, need. '
              'Return {"codes": [{"label": "...", "quote": "...", "category": "says"}]} with at most 5 codes.\n'
              f'Note:\n{note}')
    out = llm.chat_json(GROUNDING, prompt)
    if out is None:
        log(conn, llm, 'code_suggestions', 'fallback', prompt, {})
        return {'mode': 'fallback', 'model': None, 'codes': [], 'rejected': 0,
                'message': 'AI is offline. Add codes by hand.'}
    text = normalise(note)
    good, rejected = [], 0
    for c in (out.get('codes') or [])[:8]:
        try:
            label, quote, cat = str(c['label']).strip(), str(c['quote']).strip(), str(c['category']).strip().lower()
        except (TypeError, KeyError):
            rejected += 1
            continue
        if label and quote and cat in CATEGORIES and normalise(quote) in text and len(label) <= 60:
            good.append({'label': label, 'quote': quote, 'category': cat})
        else:
            rejected += 1
    log(conn, llm, 'code_suggestions', 'ok', prompt, {'kept': len(good), 'rejected': rejected})
    return {'mode': 'ai', 'model': llm.gen_model, 'codes': good[:5], 'rejected': rejected}


# ---------- How-might-we suggestions ----------
def suggest_hmw(conn, llm, insight: str) -> dict:
    prompt = ('Turn this design insight into up to 4 "How might we" questions. Broad enough for many ideas, '
              f'narrow enough to be useful. Return {{"questions": ["How might we ..."]}}.\nInsight: {insight}')
    out = llm.chat_json(GROUNDING, prompt)
    qs = [str(q).strip() for q in (out or {}).get('questions', []) if isinstance(q, str)]
    qs = [q if q.endswith('?') else q + '?' for q in qs if q.lower().startswith('how might we') and len(q) <= 200][:4]
    status = 'ok' if qs else ('fallback' if out is None else 'invalid')
    log(conn, llm, 'hmw_suggestions', status, prompt, {'kept': len(qs)})
    return {'mode': 'ai' if qs else 'fallback', 'model': llm.gen_model if qs else None, 'questions': qs}
