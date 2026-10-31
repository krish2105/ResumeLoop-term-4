"""Coordinator workspace: import an authorised course package, switch the active course, see learners and
what they ask about. Packages use the same shape as data/sample/fictional_course.json."""
import hashlib
import json
import sqlite3
import uuid
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, ValidationError

from .course import Course, diff_versions, fictional_course, load_course, set_active
from .planner import PlanInputError, validate_graph
from .storage import db

router = APIRouter(prefix='/api')


class PackageIn(BaseModel):
    model_config = ConfigDict(extra='forbid')
    package: dict


def check(package: dict) -> tuple[Course | None, list[str]]:
    try:
        course = Course.model_validate(package)
    except ValidationError as exc:
        return None, [('.'.join(str(p) for p in e['loc']) + ': ' + e['msg']) for e in exc.errors()][:40]
    errors = []
    ids = [s.id for s in course.sources]
    if len(ids) != len(set(ids)):
        errors.append('sources: duplicate source id')
    versions = [v.version for v in course.versions]
    if len(versions) != len(set(versions)):
        errors.append('versions: duplicate version name')
    for v in course.versions:
        try:
            validate_graph(v.actions)
        except PlanInputError as exc:
            errors += [f'{v.version}: {e}' for e in exc.errors]
        missing = sorted({a.source_ref for a in v.actions} - set(ids)) if ids else []
        if missing:
            errors.append(f'{v.version}: actions cite unknown sources {", ".join(missing)}')
    if course.demo_learner.seen_version not in versions:
        errors.append('demo_learner.seen_version must name one of the versions')
    return course, errors


@router.post('/course/import/preview')
def preview(x: PackageIn):
    course, errors = check(x.package)
    if course is None or errors:
        return {'ok': False, 'errors': errors}
    current = load_course()
    return {'ok': True, 'errors': [], 'course': course.course, 'source_owner': course.source_owner, 'timezone': course.timezone,
            'versions': [{'version': v.version, 'actions': len(v.actions), 'published_at': v.published_at} for v in course.versions],
            'sources': len(course.sources), 'replaces': current.course,
            'changes_vs_current': diff_versions(current.versions[-1], course.versions[-1])}


@router.post('/course/import')
def import_package(x: PackageIn, conn: sqlite3.Connection = Depends(db)):
    course, errors = check(x.package)
    if course is None or errors:
        raise HTTPException(422, {'message': 'The course package has problems', 'errors': errors})
    raw = json.dumps(course.model_dump(), sort_keys=True)
    digest = hashlib.sha256(raw.encode()).hexdigest()
    with conn:
        conn.execute('BEGIN IMMEDIATE')
        existing = conn.execute('SELECT id FROM course_packages WHERE sha256=?', (digest,)).fetchone()
        conn.execute('UPDATE course_packages SET active=0')
        if existing:
            conn.execute('UPDATE course_packages SET active=1 WHERE id=?', (existing['id'],))
            pid, replayed = existing['id'], True
        else:
            pid, replayed = str(uuid.uuid4()), False
            conn.execute('INSERT INTO course_packages (id, sha256, title, package_json, active) VALUES (?,?,?,?,1)', (pid, digest, course.course, raw))
    set_active(course)
    return {'ok': True, 'id': pid, 'sha256': digest, 'replayed': replayed, 'active': course.course}


@router.get('/course/packages')
def packages(conn: sqlite3.Connection = Depends(db)):
    rows = conn.execute('SELECT id, sha256, title, active, imported_at FROM course_packages ORDER BY rowid DESC').fetchall()
    return {'active': load_course().course, 'fictional': fictional_course().course, 'packages': [dict(r) for r in rows]}


@router.post('/course/packages/{package_id}/activate')
def activate(package_id: str, conn: sqlite3.Connection = Depends(db)):
    row = conn.execute('SELECT package_json FROM course_packages WHERE id=?', (package_id,)).fetchone()
    if row is None:
        raise HTTPException(404, 'Unknown course package')
    with conn:
        conn.execute('UPDATE course_packages SET active=CASE WHEN id=? THEN 1 ELSE 0 END', (package_id,))
    set_active(Course.model_validate(json.loads(row['package_json'])))
    return {'ok': True, 'active': load_course().course}


@router.post('/course/reset')
def reset(conn: sqlite3.Connection = Depends(db)):
    with conn:
        conn.execute('UPDATE course_packages SET active=0')
    set_active(None)
    return {'ok': True, 'active': fictional_course().course}


@router.get('/learners')
def learners(conn: sqlite3.Connection = Depends(db)):
    rows = conn.execute('SELECT learner_id, version, state_json, updated_at FROM learner_progress ORDER BY learner_id').fetchall()
    total = len(load_course().versions[-1].actions)
    return [{'learner_id': r['learner_id'], 'completed': len(json.loads(r['state_json'])['completed']), 'of': total,
             'saves': r['version'], 'updated_at': r['updated_at']} for r in rows]


@router.get('/coordinator/insights')
def insights(conn: sqlite3.Connection = Depends(db)):
    coach = conn.execute("SELECT status, detail_json FROM ai_log WHERE feature='coach'").fetchall()
    cited = Counter(c for r in coach for c in json.loads(r['detail_json']).get('cited', []))
    titles = {f'{s.id}-p{i}': s.title for s in load_course().sources for i in range(1, 10)}
    open_q = conn.execute("SELECT body_json FROM escalations WHERE status='queued'").fetchall()
    return {'coach_calls': len(coach), 'answered': sum(r['status'] == 'ok' for r in coach),
            'declined': sum(r['status'] in ('abstained', 'invalid') for r in coach),
            'top_sources': [{'chunk': k, 'title': titles.get(k, k), 'citations': n} for k, n in cited.most_common(6)],
            'open_questions': [json.loads(r['body_json'])['subject'] for r in open_q][:20]}
