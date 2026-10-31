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


Short = Field(default='', max_length=600)


class Observation(Base):
    participant_code: str | None = Field(default=None, pattern=r'^P\d{2,3}$')
    setting: str = Field(min_length=3, max_length=160)
    user_type: Literal['extreme-high', 'extreme-low', 'mainstream', 'analogous']
    what_happened: str = Field(min_length=10, max_length=1500)
    workaround: str = Short
    insight: str = Short
    synthetic: bool = False

    @field_validator('what_happened')
    @classmethod
    def no_contact(cls, v: str) -> str:
        if CONTACT.search(v):
            raise ValueError('Remove emails and phone numbers before saving an observation')
        return v


class Persona(Base):
    label: str = Field(min_length=3, max_length=80)
    quote: str = Field(default='', max_length=300)
    goals: str = Short
    frustrations: str = Short
    context: str = Short
    evidence_ids: list[str] = Field(default_factory=list, max_length=40)


class Pov(Base):
    user: str = Field(min_length=3, max_length=160)
    need: str = Field(min_length=3, max_length=200)
    insight: str = Field(min_length=3, max_length=300)
    theme_id: str | None = None


class Frame(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    caption: str = Field(default='', max_length=300)


class Storyboard(Base):
    title: str = Field(min_length=3, max_length=120)
    scenario: str = Short
    frames: list[Frame] = Field(min_length=1, max_length=9)


class Hill(Base):
    who: str = Field(min_length=3, max_length=160)
    what: str = Field(min_length=3, max_length=300)
    wow: str = Field(min_length=3, max_length=300)
    measure: str = Field(default='', max_length=200)


class Scenario(Base):
    what_if: str = Field(min_length=8, max_length=300)
    impact: str = Short
    response: str = Short


class Stage(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=60)
    doing: str = Field(default='', max_length=400)
    thinking: str = Field(default='', max_length=400)
    feeling: int = Field(default=3, ge=1, le=5)
    pain: str = Field(default='', max_length=400)
    opportunity: str = Field(default='', max_length=400)


class Journey(Base):
    title: str = Field(min_length=3, max_length=120)
    phase: Literal['current', 'future']
    persona_id: str | None = None
    stages: list[Stage] = Field(min_length=1, max_length=10)
    evidence_note: str = Field(default='', max_length=400)


class Sprint(Base):
    prompt: str = Field(min_length=5, max_length=200)
    sketches: list[str] = Field(max_length=8)
    minutes: int = Field(default=8, ge=1, le=30)


class Feedback(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    kind: Literal['like', 'wish', 'question', 'idea']
    text: str = Field(min_length=2, max_length=400)
    source: str = Field(default='', max_length=60)


class Prototype(Base):
    version: str = Field(min_length=1, max_length=20)
    title: str = Field(min_length=3, max_length=120)
    fidelity: Literal['paper', 'clickable', 'working']
    what_changed: str = Short
    why: str = Short
    feedback: list[Feedback] = Field(default_factory=list, max_length=40)


class Risk(Base):
    risk: str = Field(min_length=5, max_length=300)
    category: Literal['privacy', 'bias', 'accuracy', 'autonomy', 'security', 'wellbeing']
    likelihood: int = Field(ge=1, le=3)
    impact: int = Field(ge=1, le=3)
    mitigation: str = Short
    owner: str = Field(default='', max_length=60)
    status: Literal['open', 'mitigated'] = 'open'


class Roleplay(Base):
    scenario: str = Field(min_length=10, max_length=600)
    roles: list[str] = Field(min_length=2, max_length=8)
    decision: str = Short
    rationale: str = Short


class Reflection(Base):
    entry_date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    concept: str = Field(min_length=3, max_length=160)
    explanation: str = Field(default='', max_length=4000)
    organisation_value: str = Field(default='', max_length=4000)
    example: str = Field(default='', max_length=4000)
    ai_assistance: Literal['none', 'spelling-only', 'other'] = 'none'
    ai_note: str = Field(default='', max_length=300)


class Member(Base):
    name: str = Field(min_length=1, max_length=80)
    role: str = Field(default='', max_length=80)


class Contribution(Base):
    member: str = Field(min_length=1, max_length=80)
    area: Literal['research', 'synthesis', 'ideation', 'prototype', 'testing', 'presentation', 'reflection']
    description: str = Field(min_length=3, max_length=400)


class Milestone(Base):
    title: str = Field(min_length=3, max_length=160)
    when_text: str = Field(default='', max_length=80)
    weight: int | None = Field(default=None, ge=0, le=100)
    status: Literal['unverified', 'verified', 'done'] = 'unverified'
    source: str = Field(default='', max_length=120)


class RubricCheck(Base):
    component: str = Field(min_length=3, max_length=80)
    criterion: str = Field(min_length=3, max_length=120)
    status: Literal['missing', 'partial', 'ready'] = 'missing'
    evidence: str = Field(default='', max_length=600)


class SdgCanvas(Base):
    goal: str = Field(min_length=3, max_length=120)
    targets: str = Field(default='', max_length=300)
    problem: str = Short
    impact_hypothesis: str = Short
    indicator: str = Short
    evidence: str = Short
    risks: str = Short


class Reading(Base):
    week: int | None = Field(default=None, ge=1, le=12)
    title: str = Field(min_length=3, max_length=200)
    authors: str = Field(default='', max_length=200)
    year: int | None = Field(default=None, ge=1990, le=2030)
    source_kind: Literal['article', 'case', 'book']
    required: bool = False
    status: Literal['to-read', 'reading', 'done'] = 'to-read'
    summary: str = Field(default='', max_length=3000)
    key_concepts: str = Field(default='', max_length=600)
    questions: str = Field(default='', max_length=600)


class Flashcard(Base):
    reading_id: str | None = None
    front: str = Field(min_length=3, max_length=300)
    back: str = Field(min_length=1, max_length=800)
    box: int = Field(default=1, ge=1, le=5)
    due: str = Field(default='2000-01-01', pattern=r'^\d{4}-\d{2}-\d{2}$')
    reviews: int = Field(default=0, ge=0)
    correct: int = Field(default=0, ge=0)


class Participation(Base):
    session_date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    session_label: str = Field(min_length=2, max_length=120)
    prepared: bool = False
    readings_done: int = Field(default=0, ge=0, le=20)
    contributions: str = Field(default='', max_length=1000)
    questions_asked: int = Field(default=0, ge=0, le=50)
    quiz_feeling: int | None = Field(default=None, ge=1, le=5)


class Participant(Base):
    code: str = Field(pattern=r'^P\d{2,3}$')
    segment: Literal['learner', 'coordinator', 'other']
    user_type: Literal['extreme-high', 'extreme-low', 'mainstream', 'analogous']
    consent: Literal['invited', 'consented', 'declined', 'withdrawn'] = 'invited'
    consent_date: str | None = Field(default=None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    planned: str = Field(default='', max_length=80)
    done: bool = False
    note: str = Field(default='', max_length=400)

    @field_validator('note')
    @classmethod
    def no_contact(cls, v: str) -> str:
        if CONTACT.search(v):
            raise ValueError('Keep contact details outside ResumeLoop')
        return v


class Moment(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    t: int = Field(ge=0, le=36000)
    tag: Literal['says', 'does', 'thinks', 'feels', 'need', 'note']
    text: str = Field(min_length=1, max_length=600)


class Interview(Base):
    participant_code: str = Field(pattern=r'^P\d{2,3}$')
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    guide: Literal['learner', 'coordinator']
    duration_s: int = Field(default=0, ge=0, le=36000)
    moments: list[Moment] = Field(default_factory=list, max_length=200)
    converted_note_id: str | None = None

    @field_validator('moments')
    @classmethod
    def no_contact_moments(cls, v):
        if any(CONTACT.search(m.text) for m in v):
            raise ValueError('Remove emails and phone numbers from interview notes')
        return v


KINDS: dict[str, tuple[type[BaseModel], str | None]] = {
    'notes': (Note, None), 'codes': (Code, 'notes'), 'themes': (Theme, None), 'hmw': (Hmw, 'themes'),
    'ideas': (Idea, 'hmw'), 'votes': (Vote, 'ideas'), 'scores': (Score, None),
    'experiments': (Experiment, None), 'sessions': (Session, 'experiments'),
    'observations': (Observation, None), 'personas': (Persona, None), 'povs': (Pov, None), 'storyboards': (Storyboard, None),
    'hills': (Hill, None), 'scenarios': (Scenario, None), 'journeys': (Journey, None), 'sprints': (Sprint, None),
    'prototypes': (Prototype, None), 'risks': (Risk, None), 'roleplays': (Roleplay, None), 'reflections': (Reflection, None),
    'members': (Member, None), 'contributions': (Contribution, None), 'milestones': (Milestone, None),
    'rubric': (RubricCheck, None), 'sdg': (SdgCanvas, None),
    'readings': (Reading, None), 'flashcards': (Flashcard, None), 'participation': (Participation, None),
    'participants': (Participant, None), 'interviews': (Interview, None),
}


class Create(BaseModel):
    model_config = ConfigDict(extra='forbid')
    parent_id: str | None = None
    body: dict


def out(row) -> dict:
    # Metadata last, so a body field can never shadow the collection name or id.
    return {**json.loads(row['body_json']), 'id': row['id'], 'kind': row['kind'], 'parent_id': row['parent_id'],
            'created_at': row['created_at'], 'updated_at': row['updated_at']}


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


COMPONENTS = [('Class participation (in-class quizzes)', 10), ('Individual assignments (reading quizzes)', 10),
              ('Group assignment and Week 12 UN SDG presentation', 40), ('Reflective paper', 40)]
RUBRIC = {
    'Individual (§3.3)': ['Use of a relevant framework', 'Analysis of data and information', 'Understanding of key issues',
                          'Decision among alternatives', 'Articulation of thoughts'],
    'Group (§3.4)': ['Use of a relevant framework', 'Analysis of data and information', 'Understanding of key issues',
                     'Quality of content (research and relevance)', 'Quality of recommendation (feasibility and impact)',
                     'Quality of presentation', 'Quality of visual presentation', 'Individual oral presentation and defence'],
    'Reflective paper (§3.5)': ['Concept explained in my own words', 'How it helps an organisation achieve its objectives',
                                'Detailed, practical real-world example'],
}


@examples_router.post('/course-hub')
def seed_course_hub(conn: sqlite3.Connection = Depends(db)):
    """Assessment components and rubric criteria from the outline (as recorded in docs/ASSESSMENT.md).
    Dates stay unverified: the outline's schedules conflict and faculty have not confirmed them."""
    if conn.execute("SELECT 1 FROM studio_items WHERE kind='milestones'").fetchone():
        return {'ok': True, 'loaded': 0}
    n = 0
    for title, weight in COMPONENTS:
        insert(conn, 'milestones', None, validate(Milestone, {'title': title, 'weight': weight, 'when_text': 'date not confirmed',
                                                               'status': 'unverified', 'source': 'Unit outline §2.5 / §3.1'}))
        n += 1
    for component, criteria in RUBRIC.items():
        for c in criteria:
            insert(conn, 'rubric', None, validate(RubricCheck, {'component': component, 'criterion': c}))
            n += 1
    insert(conn, 'sdg', None, validate(SdgCanvas, {'goal': 'SDG 4 Quality Education (proposed, confirm with faculty)',
                                                   'targets': '4.3 equal access to education; 4.4 skills for youth and adults'}))
    return {'ok': True, 'loaded': n + 1}


READINGS = [  # Bibliographic references from the unit outline (sections 2.4 and 2.7); no course text is reproduced.
    (None, 'The Field Guide to Human-Centered Design', 'IDEO', 2019, 'book', True),
    (1, 'Use Design Thinking to Navigate Ambiguity', 'Harvard Business Review', 2025, 'article', True),
    (2, 'AI Wars in 2025', 'HBS case 725-484', 2025, 'case', True),
    (3, 'How People Are Really Using Gen AI in 2025', 'Harvard Business Review', 2025, 'article', True),
    (4, 'Innovation: Our Shared Responsibility', 'Anthony, Cobban, Painchaud, Parker', 2020, 'article', True),
    (4, 'The Kind of Creative Thinking That Fuelled WeChat\'s Success', 'Birkinshaw, Ke, de Diego', 2019, 'article', True),
    (4, 'How LinkedIn Redesigned Its HQ for Hybrid Work', 'Britz, Norwood', 2022, 'article', True),
    (4, 'An Art and a Science: How to Apply Design Thinking in Data Science Challenges', 'Parzen, Lin, Ng, Li', 2023, 'case', True),
    (5, 'AI-Generated "Workshop" Is Destroying Productivity', 'Harvard Business Review', 2025, 'article', True),
    (5, 'SBR: IBM Design Thinking Case Study', 'Datar, Migdal, Hamilton', 2021, 'case', True),
    (6, '5 Critical Skills Leaders Need in the Age of AI', 'Harvard Business Review', 2025, 'article', True),
    (7, 'The Right Way to Lead Design Thinking', 'Bason, Austin', 2019, 'article', True),
    (7, 'What Happens When Data Scientists and Designers Work Together', 'Malmgren, Wettersten', 2018, 'article', True),
    (7, 'Design Thinking and Innovation at Apple', 'Case study', None, 'case', True),
    (8, 'SBR 2: SAP Design Thinking Case Study', 'Saucedo, Shiv', 2016, 'case', True),
    (9, 'Hope and Grit: How Human-Centered Product Design Enhanced Student Mental Health', 'Rochlin', 2022, 'case', True),
    (10, 'Moderna: Democratizing Artificial Intelligence', 'Bojinov, Lakhani, Hildebrandt, Weber', 2025, 'case', True),
    (11, 'Leveraging AI in Business: 3 Real-World Examples', 'Article', None, 'article', True),
    (None, 'Design Thinking', 'Brown', 2008, 'article', False),
    (None, 'Design for Action', 'Martin, Brown', 2015, 'article', False),
    (None, 'Design Thinking Comes of Age', 'Kolko', 2015, 'article', False),
    (None, 'AI and Strategy: Lessons from Real-World Cases', 'Chan Kim, Mauborgne, Mi', 2025, 'article', False),
]


@examples_router.post('/readings')
def seed_readings(conn: sqlite3.Connection = Depends(db)):
    if conn.execute("SELECT 1 FROM studio_items WHERE kind='readings'").fetchone():
        return {'ok': True, 'loaded': 0}
    for week, title, authors, year, kind, required in READINGS:
        insert(conn, 'readings', None, validate(Reading, {'week': week, 'title': title, 'authors': authors, 'year': year,
                                                          'source_kind': kind, 'required': required}))
    return {'ok': True, 'loaded': len(READINGS)}


class Grade(BaseModel):
    model_config = ConfigDict(extra='forbid')
    correct: bool
    today: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')


LEITNER_DAYS = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16}


@router.post('/flashcards/{item_id}/review')
def review_card(item_id: str, x: Grade, conn: sqlite3.Connection = Depends(db)):
    """Leitner spaced repetition: correct moves a card up a box (longer gap); wrong sends it back to box 1."""
    from datetime import date, timedelta
    card = json.loads(get_row(conn, 'flashcards', item_id)['body_json'])
    box = min(5, card['box'] + 1) if x.correct else 1
    due = (date.fromisoformat(x.today) + timedelta(days=LEITNER_DAYS[box])).isoformat()
    card.update(box=box, due=due, reviews=card['reviews'] + 1, correct=card['correct'] + int(x.correct))
    with conn:
        conn.execute('UPDATE studio_items SET body_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', (json.dumps(validate(Flashcard, card)), item_id))
    return out(get_row(conn, 'flashcards', item_id))


@router.post('/interviews/{item_id}/to-note')
def interview_to_note(item_id: str, conn: sqlite3.Connection = Depends(db)):
    """Turn a captured interview into a research note plus coded moments (needs recorded consent)."""
    iv = json.loads(get_row(conn, 'interviews', item_id)['body_json'])
    if iv.get('converted_note_id'):
        raise HTTPException(409, 'Already converted to a note')
    p = conn.execute("SELECT body_json FROM studio_items WHERE kind='participants' AND json_extract(body_json,'$.code')=?", (iv['participant_code'],)).fetchone()
    if p is None or json.loads(p['body_json'])['consent'] != 'consented':
        raise HTTPException(409, 'Record consent for this participant in the tracker first')
    text = '\n'.join(f"[{m['t'] // 60:02d}:{m['t'] % 60:02d}] {m['text']}" for m in iv['moments'])
    if len(text) < 20:
        raise HTTPException(422, 'Capture a few moments before converting')
    note = insert(conn, 'notes', None, validate(Note, {'participant_code': iv['participant_code'], 'context': f"Interview {iv['date']} ({iv['guide']} guide)",
                                                       'text': text, 'consent': {'participation': True, 'anonymised_notes': True, 'quotes': False}, 'synthetic': False}))
    for m in iv['moments']:
        if m['tag'] in CATEGORIES_SET:
            insert(conn, 'codes', note['id'], {'label': m['text'][:60], 'quote': m['text'][:600], 'category': m['tag'], 'status': 'accepted',
                                                'origin': 'human', 'theme_id': None, 'contributor': None})
    iv['converted_note_id'] = note['id']
    with conn:
        conn.execute('UPDATE studio_items SET body_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', (json.dumps(iv), item_id))
    return {'note': note, 'codes': sum(m['tag'] in CATEGORIES_SET for m in iv['moments'])}


CATEGORIES_SET = {'says', 'does', 'thinks', 'feels', 'need'}
