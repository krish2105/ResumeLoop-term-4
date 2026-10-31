"""AI-assisted learner routes: digest, coach, escalation queue, AI status and decision log."""
import json
import sqlite3
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .ai import features
from .ai.llm import get_llm
from .course import diff_versions, get_version, latest_version
from .storage import db

router = APIRouter(prefix='/api')
STATUSES = {'queued', 'answered', 'withdrawn'}


class DigestRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    from_version: str = 'v1'


class CoachRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    question: str = Field(min_length=3, max_length=500)
    about: str | None = Field(default=None, max_length=40)


class DraftRequest(CoachRequest):
    context: str | None = Field(default=None, max_length=1500)


class EscalationCreate(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    idempotency_key: str = Field(min_length=8, max_length=80)
    subject: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=20, max_length=1200)
    about: str | None = Field(default=None, max_length=40)
    drafted_by: str = Field(pattern='^(ai|fallback|learner)$')
    approved_by_learner: bool


class EscalationUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    status: str = Field(pattern='^(answered|withdrawn)$')
    answer: str | None = Field(default=None, max_length=1200)


def action(about: str | None) -> dict | None:
    if not about:
        return None
    found = next((a for a in latest_version().actions if a.id == about), None)
    if found is None:
        raise HTTPException(404, 'Unknown course task')
    return found.model_dump()


@router.get('/ai/status')
def ai_status():
    return get_llm().status()


@router.post('/digest')
def digest(x: DigestRequest, conn: sqlite3.Connection = Depends(db)):
    try:
        old, new = get_version(x.from_version), latest_version()
    except KeyError:
        raise HTTPException(404, 'Unknown course version') from None
    changes = diff_versions(old, new)
    return {'from': old.version, 'to': new.version, 'changes': changes,
            'facts': [{'id': c['id'], 'fact': features.describe(c)} for c in changes],
            **features.digest(conn, get_llm(), changes)}


@router.post('/coach')
def coach(x: CoachRequest, conn: sqlite3.Connection = Depends(db)):
    return features.coach(conn, get_llm(), x.question, action(x.about))


@router.post('/escalations/draft')
def draft(x: DraftRequest, conn: sqlite3.Connection = Depends(db)):
    return {**features.escalation_draft(conn, get_llm(), x.question, action(x.about), x.context),
            'notice': 'Draft only. Nothing is sent until you approve it, and even then it stays in the local queue.'}


def row_out(row) -> dict:
    return {'id': row['id'], 'status': row['status'], 'created_at': row['created_at'], 'updated_at': row['updated_at'],
            **json.loads(row['body_json'])}


@router.get('/escalations')
def list_escalations(conn: sqlite3.Connection = Depends(db)):
    return [row_out(r) for r in conn.execute('SELECT * FROM escalations ORDER BY created_at DESC, rowid DESC LIMIT 200')]


@router.post('/escalations')
def create_escalation(x: EscalationCreate, conn: sqlite3.Connection = Depends(db)):
    if not x.approved_by_learner:
        raise HTTPException(422, 'The learner must approve the message before it is queued')
    action(x.about)
    with conn:
        conn.execute('BEGIN IMMEDIATE')
        existing = conn.execute('SELECT * FROM escalations WHERE idempotency_key=?', (x.idempotency_key,)).fetchone()
        if existing:
            return {**row_out(existing), 'replayed': True}
        body = x.model_dump(exclude={'idempotency_key'}) | {'answer': None, 'external_delivery': 'none (local queue only)'}
        conn.execute('INSERT INTO escalations (id, idempotency_key, status, body_json) VALUES (?,?,?,?)',
                     (str(uuid.uuid4()), x.idempotency_key, 'queued', json.dumps(body)))
        row = conn.execute('SELECT * FROM escalations WHERE idempotency_key=?', (x.idempotency_key,)).fetchone()
    return {**row_out(row), 'replayed': False}


@router.patch('/escalations/{escalation_id}')
def update_escalation(escalation_id: str, x: EscalationUpdate, conn: sqlite3.Connection = Depends(db)):
    row = conn.execute('SELECT * FROM escalations WHERE id=?', (escalation_id,)).fetchone()
    if row is None:
        raise HTTPException(404, 'Unknown escalation')
    if row['status'] != 'queued':
        raise HTTPException(409, f"Already {row['status']}")
    if x.status == 'answered' and not (x.answer and len(x.answer) >= 3):
        raise HTTPException(422, 'An answer is required')
    body = json.loads(row['body_json']) | {'answer': x.answer if x.status == 'answered' else None}
    with conn:
        conn.execute('UPDATE escalations SET status=?, body_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
                     (x.status, json.dumps(body), escalation_id))
    return row_out(conn.execute('SELECT * FROM escalations WHERE id=?', (escalation_id,)).fetchone())


@router.get('/ai/log')
def ai_log(conn: sqlite3.Connection = Depends(db)):
    rows = conn.execute('SELECT * FROM ai_log ORDER BY id DESC LIMIT 200').fetchall()
    counts = {r['status']: r['n'] for r in conn.execute('SELECT status, COUNT(*) n FROM ai_log GROUP BY status')}
    return {'counts': counts, 'entries': [{**dict(r), 'detail': json.loads(r['detail_json'])} for r in rows]}
