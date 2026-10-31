"""Versioned, typed course-action contract for the FICTIONAL demo course.

Unknown values stay unknown: a missing duration is `None`, never a default.
"""
import json
import os
import sqlite3
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ROOT = Path(__file__).resolve().parents[3]
COURSE_FILE = ROOT / 'data' / 'sample' / 'fictional_course.json'
SCHEMA_VERSION = 'course-actions/v1'
DIFF_FIELDS = ('title', 'minutes', 'prerequisites', 'due', 'due_status', 'session', 'kind')


class CourseAction(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    id: str = Field(pattern=r'^[a-z0-9][a-z0-9-]{1,39}$')
    title: str = Field(min_length=3, max_length=120)
    session: int = Field(ge=1, le=20)
    kind: Literal['recap', 'reading', 'exercise', 'assessment', 'reflection']
    minutes: int | None = Field(default=None, ge=1, le=240)
    prerequisites: list[str] = Field(default_factory=list, max_length=12)
    due: str | None = None
    due_status: Literal['none', 'unverified', 'verified', 'conflict'] = 'none'
    source_ref: str = Field(pattern=r'^S\d{1,2}$')


class CourseVersion(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: str = Field(pattern=r'^v\d{1,3}$')
    published_at: str
    actions: list[CourseAction] = Field(min_length=1, max_length=200)


class Source(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(pattern=r'^S\d{1,2}$')
    session: int
    title: str
    text: str


class DemoLearner(BaseModel):
    model_config = ConfigDict(extra='forbid')
    learner_id: str
    last_completed_session: int
    completed: list[str]
    budget_minutes: int
    seen_version: str


class Course(BaseModel):
    model_config = ConfigDict(extra='forbid')
    course: str = Field(min_length=3, max_length=200)
    notice: str = Field(default='', max_length=600)
    source_owner: str = Field(min_length=2, max_length=200)
    timezone: str = Field(min_length=3, max_length=60)
    versions: list[CourseVersion] = Field(min_length=1, max_length=50)
    sources: list[Source] = Field(default_factory=list, max_length=200)
    demo_learner: DemoLearner = Field(default_factory=lambda: DemoLearner(
        learner_id='demo-learner', last_completed_session=0, completed=[], budget_minutes=60, seen_version='v1'))


@lru_cache(maxsize=1)
def fictional_course() -> Course:
    return Course.model_validate(json.loads(COURSE_FILE.read_text(encoding='utf-8')))


# Active course per database file: a coordinator-imported package when one is active, else the fictional course.
_active: dict[str, Course | None] = {}


def _read_active(path: str) -> Course | None:
    if not Path(path).exists():
        return None
    conn = sqlite3.connect(path)
    try:
        row = conn.execute('SELECT package_json FROM course_packages WHERE active=1 ORDER BY rowid DESC LIMIT 1').fetchone()
    except sqlite3.OperationalError:
        return None
    finally:
        conn.close()
    return Course.model_validate(json.loads(row[0])) if row else None


def load_course() -> Course:
    if os.environ.get('RL_FICTIONAL_ONLY') == '1':
        return fictional_course()
    from . import main
    key = str(main.STATE)
    if key not in _active:
        _active[key] = _read_active(key)
    return _active[key] or fictional_course()


def set_active(course: 'Course | None') -> None:
    from . import main
    _active[str(main.STATE)] = course


def get_version(version: str) -> CourseVersion:
    for v in load_course().versions:
        if v.version == version:
            return v
    raise KeyError(version)


def latest_version() -> CourseVersion:
    return load_course().versions[-1]


def diff_versions(old: CourseVersion, new: CourseVersion) -> list[dict]:
    """Deterministic list of changes. These are the facts the AI digest may only rephrase."""
    before = {a.id: a for a in old.actions}
    after = {a.id: a for a in new.actions}
    changes: list[dict] = []

    def add(kind, action, **extra):
        changes.append({'id': f'C{len(changes) + 1}', 'type': kind, 'action_id': action.id,
                        'title': action.title, 'session': action.session, 'source_ref': action.source_ref, **extra})

    for aid, a in after.items():
        if aid not in before:
            add('added', a, minutes=a.minutes)
    for aid, a in before.items():
        if aid not in after:
            add('removed', a)
    for aid in sorted(set(before) & set(after), key=lambda x: (after[x].session, x)):
        for field in DIFF_FIELDS:
            old_value, new_value = getattr(before[aid], field), getattr(after[aid], field)
            if old_value != new_value:
                add('changed', after[aid], field=field, before=old_value, after=new_value)
    return changes
