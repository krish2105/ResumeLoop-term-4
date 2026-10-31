"""Versioned, typed course-action contract for the FICTIONAL demo course.

Unknown values stay unknown: a missing duration is `None`, never a default.
"""
import json
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
    course: str
    notice: str
    source_owner: str
    timezone: str
    versions: list[CourseVersion]
    sources: list[Source]
    demo_learner: DemoLearner


@lru_cache(maxsize=1)
def load_course() -> Course:
    return Course.model_validate(json.loads(COURSE_FILE.read_text(encoding='utf-8')))


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
