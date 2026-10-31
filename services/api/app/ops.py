"""Operations: request IDs, structured access logs, in-process metrics, and SQLite backup/restore."""
import json
import logging
import shutil
import sqlite3
import statistics
import time
import uuid
from collections import defaultdict, deque
from pathlib import Path

from fastapi import APIRouter, Depends, Request

from .storage import db, schema_version

log = logging.getLogger('resumeloop.access')
if not log.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(message)s'))
    log.addHandler(handler)
    log.setLevel(logging.INFO)
    log.propagate = False

_latency: dict[str, deque] = defaultdict(lambda: deque(maxlen=500))
_counts: dict[str, int] = defaultdict(int)
_errors: dict[str, int] = defaultdict(int)
STARTED = time.time()
router = APIRouter(prefix='/api')


def route_key(request: Request) -> str:
    route = request.scope.get('route')
    return f"{request.method} {getattr(route, 'path', request.url.path)}"


SECURITY_HEADERS = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Cross-Origin-Resource-Policy': 'same-site',
}


async def access_middleware(request: Request, call_next):
    """Adds X-Request-ID, logs one JSON line per request (no bodies, no personal data), records latency."""
    rid = request.headers.get('x-request-id') or uuid.uuid4().hex[:16]
    start = time.perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        response.headers['X-Request-ID'] = rid
        # Learner data must never come from a browser cache (Safari reused a stale GET after a refresh).
        for name, value in SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        return response
    finally:
        ms = round((time.perf_counter() - start) * 1000, 1)
        key = route_key(request)
        _counts[key] += 1
        _latency[key].append(ms)
        if status >= 500:
            _errors[key] += 1
        log.info(json.dumps({'rid': rid, 'method': request.method, 'route': key.split(' ', 1)[1], 'status': status, 'ms': ms}))


@router.get('/metrics')
def metrics(conn: sqlite3.Connection = Depends(db)):
    routes = {}
    for key, values in _latency.items():
        v = sorted(values)
        routes[key] = {'count': _counts[key], 'errors_5xx': _errors[key], 'p50_ms': statistics.median(v),
                       'p95_ms': v[max(0, int(len(v) * 0.95) - 1)]}
    return {'uptime_s': round(time.time() - STARTED), 'schema_version': schema_version(conn), 'routes': routes}


def backup(source: Path, dest_dir: Path) -> Path:
    """Consistent online backup using SQLite's backup API (safe while the API is running)."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"resumeloop-{time.strftime('%Y%m%d-%H%M%S')}.sqlite3"
    src = sqlite3.connect(str(source))
    out = sqlite3.connect(str(dest))
    try:
        src.backup(out)
    finally:
        out.close()
        src.close()
    return dest


def restore(backup_file: Path, target: Path) -> Path | None:
    """Replace the database with a backup; the current file is kept alongside as *.before-restore."""
    check = sqlite3.connect(str(backup_file))
    try:
        if check.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Backup failed its integrity check')
    finally:
        check.close()
    kept = None
    if target.exists():
        kept = target.with_suffix(target.suffix + '.before-restore')
        shutil.copy2(target, kept)
    for suffix in ('-wal', '-shm'):
        Path(str(target) + suffix).unlink(missing_ok=True)
    shutil.copy2(backup_file, target)
    return kept
