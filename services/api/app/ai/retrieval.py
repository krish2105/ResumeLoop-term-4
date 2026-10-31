"""Retrieval over the fictional course notes: cached embeddings with a keyword fallback."""
import hashlib
import json
import math
import re
import sqlite3

from ..course import load_course

STOP = set('a an and are as at be by can do does for from has have how i if in is it my of on or the this to was what when where which who why will with you your'.split())
EMBED_THRESHOLD = 0.5


def chunks() -> list[dict]:
    out = []
    for s in load_course().sources:
        for n, para in enumerate([p.strip() for p in s.text.split('\n\n') if p.strip()], start=1):
            out.append({'chunk_id': f'{s.id}-p{n}', 'source_id': s.id, 'session': s.session, 'title': s.title, 'text': para})
    return out


def tokens(text: str) -> list[str]:
    return [t for t in re.findall(r'[a-z0-9]+', text.lower()) if t not in STOP and len(t) > 1]


def keyword_scores(query: str, items: list[dict]) -> list[float]:
    q = set(tokens(query))
    n = len(items)
    df = {t: sum(t in set(tokens(c['text'] + ' ' + c['title'])) for c in items) for t in q}
    scores = []
    for c in items:
        words = tokens(c['text'] + ' ' + c['title'])
        s = sum(words.count(t) / (1 + 0.1 * len(words)) * math.log(1 + n / (1 + df[t])) for t in q if t in words)
        scores.append(s)
    return scores


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def cached_vectors(conn: sqlite3.Connection, llm, items: list[dict]) -> list[list[float]] | None:
    model = llm.embed_model
    vectors: dict[str, list[float]] = {}
    missing = []
    for c in items:
        h = hashlib.sha256(c['text'].encode()).hexdigest()
        row = conn.execute('SELECT vector_json FROM embeddings WHERE chunk_id=? AND model=? AND text_sha256=?', (c['chunk_id'], model, h)).fetchone()
        if row:
            vectors[c['chunk_id']] = json.loads(row['vector_json'])
        else:
            missing.append((c, h))
    if missing:
        fresh = llm.embed([c['text'] for c, _ in missing])
        if fresh is None:
            return None
        with conn:
            for (c, h), v in zip(missing, fresh):
                conn.execute('INSERT OR REPLACE INTO embeddings VALUES (?,?,?,?)', (c['chunk_id'], model, h, json.dumps(v)))
                vectors[c['chunk_id']] = v
    return [vectors[c['chunk_id']] for c in items]


def search(conn: sqlite3.Connection, llm, query: str, k: int = 4) -> dict:
    items = chunks()
    vectors = cached_vectors(conn, llm, items)
    qv = llm.embed([query]) if vectors is not None else None
    if vectors is not None and qv:
        scores = [cosine(qv[0], v) for v in vectors]
        method, threshold = 'embeddings', EMBED_THRESHOLD
    else:
        scores = keyword_scores(query, items)
        method, threshold = 'keywords', 0.05
    ranked = sorted(zip(scores, items), key=lambda x: -x[0])[:k]
    hits = [{**c, 'score': round(s, 3)} for s, c in ranked if s >= threshold]
    return {'method': method, 'threshold': threshold, 'hits': hits,
            'best_score': round(ranked[0][0], 3) if ranked else 0.0}
