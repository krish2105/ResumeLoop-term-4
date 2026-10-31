"""Course, plan and progress routes (learner recovery journey)."""
import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .course import SCHEMA_VERSION, diff_versions, get_version, latest_version, load_course
from .planner import PlanInputError, build_plan
from .storage import db

router = APIRouter(prefix='/api')


class PlanRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: str | None = None
    budget_minutes: int = Field(ge=0, le=600)
    completed: list[str] = Field(default_factory=list, max_length=200)


class ProgressState(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    completed: list[str] = Field(default_factory=list, max_length=200)
    budget_minutes: int = Field(ge=0, le=600)
    seen_version: str = Field(pattern=r'^v\d{1,3}$')
    current_action: str | None = Field(default=None, max_length=40)
    notes: dict[str, str] = Field(default_factory=dict)


class ProgressWrite(BaseModel):
    model_config = ConfigDict(extra='forbid')
    expected_version: int = Field(ge=0)
    state: ProgressState


def version_or_404(version: str | None):
    try:
        return get_version(version) if version else latest_version()
    except KeyError:
        raise HTTPException(404, 'Unknown course version') from None


@router.get('/course')
def course(version: str | None = None):
    c = load_course()
    v = version_or_404(version)
    return {'course': c.course, 'notice': c.notice, 'source_owner': c.source_owner, 'timezone': c.timezone,
            'schema_version': SCHEMA_VERSION, 'versions': [x.version for x in c.versions],
            'version': v.version, 'published_at': v.published_at,
            'actions': [a.model_dump() for a in v.actions], 'sources': [s.model_dump() for s in c.sources],
            'source_type': 'SYNTHETIC'}


@router.get('/course/diff')
def course_diff(from_version: str = 'v1', to_version: str | None = None):
    old, new = version_or_404(from_version), version_or_404(to_version)
    return {'from': old.version, 'to': new.version, 'changes': diff_versions(old, new), 'source_type': 'SYNTHETIC'}


@router.post('/plan')
def plan(x: PlanRequest):
    v = version_or_404(x.version)
    try:
        result = build_plan(v.actions, x.budget_minutes, set(x.completed))
    except PlanInputError as exc:
        raise HTTPException(422, {'message': 'The course source is inconsistent', 'errors': exc.errors}) from exc
    return {**result, 'version': v.version, 'source_type': 'SYNTHETIC'}


def default_progress() -> dict:
    d = load_course().demo_learner
    return {'completed': d.completed, 'budget_minutes': d.budget_minutes, 'seen_version': d.seen_version,
            'current_action': None, 'notes': {}}


@router.get('/learner/progress')
def get_progress(conn: sqlite3.Connection = Depends(db)):
    row = conn.execute('SELECT * FROM learner_progress WHERE learner_id=?', ('demo-learner',)).fetchone()
    if row is None:
        return {'version': 0, 'state': default_progress(), 'updated_at': None}
    return {'version': row['version'], 'state': json.loads(row['state_json']), 'updated_at': row['updated_at']}


@router.put('/learner/progress')
def put_progress(x: ProgressWrite, conn: sqlite3.Connection = Depends(db)):
    known = {a.id for v in load_course().versions for a in v.actions}
    unknown = sorted(set(x.state.completed) - known)
    if unknown:
        raise HTTPException(422, {'message': 'Unknown action IDs', 'errors': unknown})
    with conn:
        conn.execute('BEGIN IMMEDIATE')
        row = conn.execute('SELECT version FROM learner_progress WHERE learner_id=?', ('demo-learner',)).fetchone()
        current = row['version'] if row else 0
        if current != x.expected_version:
            raise HTTPException(409, {'message': 'Progress changed in another tab. Reload before saving.', 'current_version': current})
        state = json.dumps(x.state.model_dump())
        conn.execute('''INSERT INTO learner_progress (learner_id, version, state_json) VALUES (?,?,?)
            ON CONFLICT(learner_id) DO UPDATE SET version=excluded.version, state_json=excluded.state_json,
            updated_at=CURRENT_TIMESTAMP''', ('demo-learner', current + 1, state))
    return get_progress(conn)


@router.delete('/learner/progress')
def reset_progress(conn: sqlite3.Connection = Depends(db)):
    with conn:
        conn.execute('DELETE FROM learner_progress WHERE learner_id=?', ('demo-learner',))
    return {'ok': True}
