"""Design Thinking studio: research notes, codes, themes, HMW, ideas, votes, alternative scores,
experiments and sessions. Typed per kind; AI only creates `suggested` codes that a human must accept.
"""
import hashlib
import json
import re
import sqlite3
import uuid
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from .ai import features
from .ai.llm import get_llm
from .storage import db

router = APIRouter(prefix='/api/studio')
EXAMPLES = Path(__file__).resolve().parents[3] / 'data' / 'sample' / 'fictional_studio.json'
CONTACT = re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d\s().-]{7,}\d')


class Base(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    contributor: str | None = Field(default=None, max_length=60)


class Consent(BaseModel):
    model_config = ConfigDict(extra='forbid')
    participation: bool
    anonymised_notes: bool
    quotes: bool = False


class Note(Base):
    participant_code: str = Field(pattern=r'^P\d{2,3}$')
    context: str = Field(default='', max_length=160)
    text: str = Field(min_length=20, max_length=6000)
    consent: Consent
    synthetic: bool = False

    @field_validator('text')
    @classmethod
    def no_contact_details(cls, v: str) -> str:
        if CONTACT.search(v):
            raise ValueError('Remove emails and phone numbers before saving a research note')
        return v


class Code(Base):
    label: str = Field(min_length=2, max_length=60)
    quote: str = Field(min_length=3, max_length=600)
    category: Literal['says', 'does', 'thinks', 'feels', 'need']
    status: Literal['suggested', 'accepted', 'rejected'] = 'accepted'
    origin: Literal['ai', 'human'] = 'human'
    theme_id: str | None = None


class Theme(Base):
    title: str = Field(min_length=3, max_length=120)
    insight: str = Field(default='', max_length=600)


class Hmw(Base):
    question: str = Field(min_length=10, max_length=200)
    origin: Literal['ai', 'human'] = 'human'

    @field_validator('question')
    @classmethod
    def starts_hmw(cls, v: str) -> str:
        if not v.lower().startswith('how might we'):
            raise ValueError('Start with "How might we"')
        return v


class Idea(Base):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(default='', max_length=1000)
    alternative: Literal['lms-checklist', 'coordinator-brief', 'resumeloop', 'other'] = 'other'


class Vote(Base):
    voter: str = Field(min_length=1, max_length=60)


class Score(Base):
    alternative: Literal['lms-checklist', 'coordinator-brief', 'resumeloop']
    criterion: Literal['source traceability', 'accessibility', 'learner effort', 'privacy', 'coordinator effort']
    value: int = Field(ge=1, le=5)
    scorer: str = Field(min_length=1, max_length=60)


class Experiment(Base):
    title: str = Field(min_length=5, max_length=160)
    hypothesis: str = Field(min_length=10, max_length=600)
    conditions: list[str] = Field(min_length=2, max_length=2)
    tasks: list[str] = Field(min_length=1, max_length=8)
    metrics: list[str] = Field(min_length=1, max_length=8)
    frozen_at: str | None = None
    protocol_sha256: str | None = None


class Result(BaseModel):
    model_config = ConfigDict(extra='forbid')
    task: int = Field(ge=0, le=7)
    condition: Literal['A', 'B']
    success: bool
    seconds: float = Field(ge=0, le=3600)
    wrong_actions: int = Field(ge=0, le=100)
    ease: int = Field(ge=1, le=7)


class Session(Base):
    participant_code: str = Field(pattern=r'^P\d{2,3}$')
    order: Literal['AB', 'BA']
    synthetic: bool = False
    results: list[Result] = Field(default_factory=list, max_length=32)
    notes: str = Field(default='', max_length=2000)


KINDS: dict[str, tuple[type[BaseModel], str | None]] = {
    'notes': (Note, None), 'codes': (Code, 'notes'), 'themes': (Theme, None), 'hmw': (Hmw, 'themes'),
    'ideas': (Idea, 'hmw'), 'votes': (Vote, 'ideas'), 'scores': (Score, None),
    'experiments': (Experiment, None), 'sessions': (Session, 'experiments'),
}


class Create(BaseModel):
    model_config = ConfigDict(extra='forbid')
    parent_id: str | None = None
    body: dict


def out(row) -> dict:
    return {'id': row['id'], 'kind': row['kind'], 'parent_id': row['parent_id'], 'created_at': row['created_at'],
            'updated_at': row['updated_at'], **json.loads(row['body_json'])}


def get_row(conn, kind: str, item_id: str):
    row = conn.execute('SELECT * FROM studio_items WHERE id=? AND kind=?', (item_id, kind)).fetchone()
    if row is None:
        raise HTTPException(404, f'Unknown {kind[:-1] if kind.endswith("s") else kind} item')
    return row


def model_for(kind: str) -> tuple[type[BaseModel], str | None]:
    if kind not in KINDS:
        raise HTTPException(404, 'Unknown studio collection')
    return KINDS[kind]


def validate(model: type[BaseModel], body: dict) -> dict:
    try:
        return model.model_validate(body).model_dump()
    except ValidationError as exc:
        errors = [{'field': '.'.join(str(p) for p in e['loc']), 'message': e['msg'].removeprefix('Value error, ')} for e in exc.errors()]
        raise HTTPException(422, {'message': 'Fix the highlighted fields', 'errors': errors}) from None


def protocol_hash(exp: dict) -> str:
    core = {k: exp[k] for k in ('title', 'hypothesis', 'conditions', 'tasks', 'metrics')}
    return hashlib.sha256(json.dumps(core, sort_keys=True).encode()).hexdigest()


def insert(conn, kind: str, parent_id: str | None, body: dict) -> dict:
    item_id = str(uuid.uuid4())
    with conn:
        conn.execute('INSERT INTO studio_items (id, kind, parent_id, body_json) VALUES (?,?,?,?)', (item_id, kind, parent_id, json.dumps(body)))
    return out(get_row(conn, kind, item_id))


@router.get('/{kind}')
def list_items(kind: str, parent: str | None = None, conn: sqlite3.Connection = Depends(db)):
    model_for(kind)
    q, args = 'SELECT * FROM studio_items WHERE kind=?', [kind]
    if parent:
        q, args = q + ' AND parent_id=?', args + [parent]
    return [out(r) for r in conn.execute(q + ' ORDER BY created_at, rowid', args)]


@router.post('/{kind}')
def create(kind: str, x: Create, conn: sqlite3.Connection = Depends(db)):
    model, parent_kind = model_for(kind)
    body = validate(model, x.body)
    if parent_kind:
        if not x.parent_id:
            if kind != 'hmw':
                raise HTTPException(422, f'{kind} need a parent {parent_kind[:-1]}')
        else:
            parent = get_row(conn, parent_kind, x.parent_id)
            if kind == 'sessions' and not json.loads(parent['body_json']).get('frozen_at'):
                raise HTTPException(409, 'Freeze the experiment protocol before recording sessions')
            if kind == 'codes':
                note = json.loads(parent['body_json'])['text']
                if features.normalise(body['quote']) not in features.normalise(note):
                    raise HTTPException(422, {'message': 'The quote must be copied exactly from the note', 'errors': []})
    if kind == 'votes':
        dup = conn.execute("SELECT 1 FROM studio_items WHERE kind='votes' AND parent_id=? AND json_extract(body_json,'$.voter')=?",
                           (x.parent_id, body['voter'])).fetchone()
        if dup:
            raise HTTPException(409, 'This person already voted for this idea')
    if kind == 'experiments':
        body.update(frozen_at=None, protocol_sha256=None)
    if kind == 'scores':
        with conn:
            conn.execute("""DELETE FROM studio_items WHERE kind='scores' AND json_extract(body_json,'$.alternative')=?
                AND json_extract(body_json,'$.criterion')=? AND json_extract(body_json,'$.scorer')=?""",
                         (body['alternative'], body['criterion'], body['scorer']))
    return insert(conn, kind, x.parent_id, body)


@router.patch('/{kind}/{item_id}')
def update(kind: str, item_id: str, patch: dict, conn: sqlite3.Connection = Depends(db)):
    model, _ = model_for(kind)
    row = get_row(conn, kind, item_id)
    current = json.loads(row['body_json'])
    if kind == 'experiments' and current.get('frozen_at') and set(patch) & {'title', 'hypothesis', 'conditions', 'tasks', 'metrics'}:
        raise HTTPException(409, 'The protocol is frozen. Create a new experiment version instead.')
    body = validate(model, {**current, **patch})
    with conn:
        conn.execute('UPDATE studio_items SET body_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', (json.dumps(body), item_id))
    return out(get_row(conn, kind, item_id))


@router.delete('/{kind}/{item_id}')
def delete(kind: str, item_id: str, conn: sqlite3.Connection = Depends(db)):
    model_for(kind)
    get_row(conn, kind, item_id)
    with conn:
        conn.execute('DELETE FROM studio_items WHERE id=? OR parent_id=?', (item_id, item_id))
    return {'ok': True}


@router.post('/experiments/{item_id}/freeze')
def freeze(item_id: str, conn: sqlite3.Connection = Depends(db)):
    row = get_row(conn, 'experiments', item_id)
    body = json.loads(row['body_json'])
    if body.get('frozen_at'):
        return out(row)
    stamp = conn.execute("SELECT strftime('%Y-%m-%dT%H:%M:%SZ','now')").fetchone()[0]
    body.update(frozen_at=stamp, protocol_sha256=protocol_hash(body))
    with conn:
        conn.execute('UPDATE studio_items SET body_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', (json.dumps(body), item_id))
    return out(get_row(conn, 'experiments', item_id))


@router.post('/notes/{item_id}/suggest-codes')
def suggest_codes(item_id: str, conn: sqlite3.Connection = Depends(db)):
    note = json.loads(get_row(conn, 'notes', item_id)['body_json'])
    if not note['consent']['anonymised_notes']:
        raise HTTPException(409, 'This participant did not consent to note analysis')
    result = features.suggest_codes(conn, get_llm(), note['text'])
    saved = [insert(conn, 'codes', item_id, {**c, 'status': 'suggested', 'origin': 'ai', 'theme_id': None, 'contributor': None})
             for c in result['codes']]
    return {**result, 'saved': saved}


class HmwRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    insight: str = Field(min_length=10, max_length=600)


@router.post('/themes/{item_id}/suggest-hmw')
def suggest_hmw(item_id: str, x: HmwRequest, conn: sqlite3.Connection = Depends(db)):
    get_row(conn, 'themes', item_id)
    return features.suggest_hmw(conn, get_llm(), x.insight)


examples_router = APIRouter(prefix='/api/studio-examples')


@examples_router.post('')
def load_examples(conn: sqlite3.Connection = Depends(db)):
    data = json.loads(EXAMPLES.read_text(encoding='utf-8'))
    if conn.execute("SELECT 1 FROM studio_items WHERE kind='notes' AND json_extract(body_json,'$.synthetic')=1").fetchone():
        return {'ok': True, 'loaded': 0, 'notice': data['notice']}
    consent = {'participation': True, 'anonymised_notes': True, 'quotes': True}
    for n in data['notes']:
        insert(conn, 'notes', None, validate(Note, {**n, 'consent': consent, 'synthetic': True}))
    exp = validate(Experiment, data['experiment'])
    insert(conn, 'experiments', None, {**exp, 'frozen_at': None, 'protocol_sha256': None, 'synthetic': True})
    return {'ok': True, 'loaded': len(data['notes']) + 1, 'notice': data['notice']}


@examples_router.delete('')
def clear_examples(conn: sqlite3.Connection = Depends(db)):
    ids = [r['id'] for r in conn.execute("SELECT id FROM studio_items WHERE kind IN ('notes','experiments') AND json_extract(body_json,'$.synthetic')=1")]
    with conn:
        for i in ids:
            conn.execute('DELETE FROM studio_items WHERE id=? OR parent_id=?', (i, i))
    return {'ok': True, 'removed': len(ids)}
