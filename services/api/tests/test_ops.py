import sqlite3

from app import storage
from app.ops import backup, restore


def test_migrations_apply_once_and_record_versions(tmp_path):
    conn = sqlite3.connect(str(tmp_path / 'm.sqlite3'))
    assert storage.migrate(conn) == [v for v, _, _ in storage.MIGRATIONS]
    assert storage.migrate(conn) == []
    assert storage.schema_version(conn) == storage.MIGRATIONS[-1][0]


def test_request_id_header_and_metrics(client):
    r = client.get('/api/health', headers={'X-Request-ID': 'abc123'})
    assert r.headers['X-Request-ID'] == 'abc123'
    assert client.get('/api/course').headers['X-Request-ID']
    m = client.get('/api/metrics').json()
    assert m['schema_version'] == storage.MIGRATIONS[-1][0]
    assert m['routes']['GET /api/health']['count'] >= 1


def test_security_headers_and_body_limit(client):
    h = client.get('/api/learner/progress').headers
    assert h['Cache-Control'] == 'no-store' and h['X-Frame-Options'] == 'DENY' and h['X-Content-Type-Options'] == 'nosniff'
    assert "frame-ancestors 'none'" in h['Content-Security-Policy']
    r = client.post('/api/course/import/preview', content=b'{"package": "' + b'x' * 1_100_000 + b'"}', headers={'Content-Type': 'application/json'})
    assert r.status_code == 413 and r.headers['X-Request-ID']


def test_backup_and_restore_round_trip(client, tmp_path):
    import app.main as main
    client.post('/api/studio/themes', json={'body': {'title': 'Kept theme'}})
    saved = backup(main.STATE, tmp_path / 'b')
    client.post('/api/studio/themes', json={'body': {'title': 'Added after backup'}})
    kept = restore(saved, main.STATE)
    assert kept and kept.exists()
    titles = [t['title'] for t in client.get('/api/studio/themes').json()]
    assert titles == ['Kept theme']
