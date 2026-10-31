import pytest

PW = 'correct horse battery'


@pytest.fixture
def auth(client, monkeypatch):
    monkeypatch.setenv('RL_AUTH', 'required')

    def org(email, name):
        r = client.post('/api/auth/signup', json={'email': email, 'password': PW, 'org_name': name})
        assert r.status_code == 200, r.json()
        return {'Authorization': 'Bearer ' + r.json()['token']}
    return org


def test_signed_out_requests_are_refused_but_health_is_open(client, auth):
    assert client.get('/api/health').json()['auth_required'] is True
    refused = client.get('/api/course', headers={'Origin': 'http://localhost:3000'})
    assert refused.status_code == 401 and refused.headers['access-control-allow-origin'] == 'http://localhost:3000'
    assert client.get('/api/studio/notes').status_code == 401
    assert client.get('/api/studio/notes', headers={'Authorization': 'Bearer forged'}).status_code == 401


def test_cross_tenant_reads_writes_and_deletes_are_denied(client, auth):
    a, b = auth('a@uni.example', 'Programme A'), auth('b@uni.example', 'Programme B')
    note = {'participant_code': 'P01', 'text': 'Opened three apps before finding the quiz date.', 'consent': {'participation': True, 'anonymised_notes': True}}
    nid = client.post('/api/studio/notes', json={'body': note}, headers=a).json()['id']
    assert len(client.get('/api/studio/notes', headers=a).json()) == 1
    assert client.get('/api/studio/notes', headers=b).json() == []
    assert client.patch(f'/api/studio/notes/{nid}', json={'context': 'hijack'}, headers=b).status_code == 404
    assert client.delete(f'/api/studio/notes/{nid}', headers=b).status_code == 404
    assert client.post(f'/api/studio/notes/{nid}/suggest-codes', headers=b).status_code == 404
    assert len(client.get('/api/studio/notes', headers=a).json()) == 1


def test_progress_escalations_and_courses_are_per_organisation(client, auth):
    a, b = auth('a2@uni.example', 'Org A'), auth('b2@uni.example', 'Org B')
    base = client.get('/api/learner/progress', headers=a).json()
    client.put('/api/learner/progress', json={'expected_version': 0, 'state': {**base['state'], 'completed': ['s1-recap', 's3-recap']}}, headers=a)
    assert 's3-recap' in client.get('/api/learner/progress', headers=a).json()['state']['completed']
    assert 's3-recap' not in client.get('/api/learner/progress', headers=b).json()['state']['completed']
    esc = {'idempotency_key': 'same-key-123', 'subject': 'Quiz date', 'body': 'Could you confirm the quiz date please? Thank you.', 'about': None, 'drafted_by': 'learner', 'approved_by_learner': True}
    ea = client.post('/api/escalations', json=esc, headers=a).json()
    eb = client.post('/api/escalations', json=esc, headers=b).json()
    assert ea['id'] != eb['id'] and eb['replayed'] is False
    assert client.patch(f"/api/escalations/{ea['id']}", json={'status': 'withdrawn'}, headers=b).status_code == 404
    import json
    from app.course import COURSE_FILE
    pkg = json.loads(COURSE_FILE.read_text()); pkg['course'] = 'Programme A course'
    client.post('/api/course/import', json={'package': pkg}, headers=a)
    assert client.get('/api/course', headers=a).json()['course'] == 'Programme A course'
    assert client.get('/api/course', headers=b).json()['course'].startswith('Fictional')


def test_roles_limit_coordinator_and_admin_routes(client, auth):
    admin = auth('admin@uni.example', 'Org C')
    assert client.post('/api/org/members', json={'email': 'learner@uni.example', 'password': PW, 'role': 'learner'}, headers=admin).status_code == 200
    tok = client.post('/api/auth/login', json={'email': 'learner@uni.example', 'password': PW}).json()['token']
    learner = {'Authorization': 'Bearer ' + tok}
    assert client.get('/api/studio/notes', headers=learner).status_code == 200
    assert client.get('/api/learners', headers=learner).status_code == 403
    assert client.get('/api/account/export', headers=learner).status_code == 403
    assert client.get('/api/learners', headers=admin).status_code == 200


def test_signup_and_login_rules(client, auth):
    auth('dup@uni.example', 'Org D')
    assert client.post('/api/auth/signup', json={'email': 'dup@uni.example', 'password': PW, 'org_name': 'Again'}).status_code == 409
    assert client.post('/api/auth/signup', json={'email': 'short@uni.example', 'password': 'short', 'org_name': 'X'}).status_code == 422
    for _ in range(5):
        assert client.post('/api/auth/login', json={'email': 'dup@uni.example', 'password': 'wrong password!'}).status_code == 401
    assert client.post('/api/auth/login', json={'email': 'dup@uni.example', 'password': PW}).status_code == 429


def test_export_delete_and_audit_trail(client, auth):
    a = auth('owner@uni.example', 'Org E')
    client.post('/api/studio/themes', json={'body': {'title': 'A theme'}}, headers=a)
    me = client.get('/api/auth/me', headers=a).json()
    exported = client.get('/api/account/export', headers=a).json()
    assert len(exported['data']['studio_items']) == 1 and exported['org_id'] == me['org_id']
    assert client.post('/api/account/delete', json={'confirm': 'yes'}, headers=a).status_code == 422
    done = client.post('/api/account/delete', json={'confirm': 'DELETE ' + me['org_id']}, headers=a).json()
    assert done['deleted']['studio_items'] == 1 and client.get('/api/studio/themes', headers=a).json() == []
    actions = [e['action'] for e in client.get('/api/account/audit', headers=a).json()]
    assert {'org.created', 'themes.created', 'data.exported', 'data.deleted'} <= set(actions)


def test_migration_4_keeps_existing_single_user_data(tmp_path):
    import sqlite3
    from app import storage
    conn = sqlite3.connect(str(tmp_path / 'old.sqlite3'))
    conn.execute('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    for v, name, sqls in storage.MIGRATIONS[:3]:
        for q in sqls:
            conn.execute(q)
        conn.execute('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', (v, name))
    conn.execute("INSERT INTO learner_progress (learner_id, version, state_json) VALUES ('demo-learner', 3, '{}')")
    conn.commit()
    assert storage.migrate(conn) == [4, 5]
    assert conn.execute('SELECT org_id, version FROM learner_progress').fetchone() == ('local', 3)


def test_sign_in_limit_survives_an_api_restart(client, auth):
    auth('lock@uni.example', 'Lock org')
    for _ in range(5):
        assert client.post('/api/auth/login', json={'email': 'lock@uni.example', 'password': 'wrong password!'}).status_code == 401
    from fastapi.testclient import TestClient
    from app import main
    fresh = TestClient(main.app)  # a new client shares only the database file, like a restarted API
    assert fresh.post('/api/auth/login', json={'email': 'lock@uni.example', 'password': PW}).status_code == 429
    import sqlite3
    stored = sqlite3.connect(main.STATE).execute('SELECT email_sha256 FROM sign_in_failures').fetchall()
    assert stored and all('@' not in r[0] for r in stored)


def test_csv_review_sandbox_is_per_organisation(client, auth):
    a, b = auth('a3@uni.example', 'Sandbox A'), auth('b3@uni.example', 'Sandbox B')
    rid = client.get('/api/demo/records', headers=a).json()[0]['id']
    assert client.post('/api/demo/reviews', json={'record_id': rid, 'status': 'blocked', 'note': 'Org A only'}, headers=a).status_code == 200
    assert next(r for r in client.get('/api/demo/records', headers=b).json() if r['id'] == rid)['status'] != 'blocked'
    assert client.get('/api/demo/reviews', headers=b).json() == []
    from app.main import SAMPLE
    csv_text = SAMPLE.read_text(encoding='utf-8')
    receipt = client.post('/api/demo/import', json={'csv_text': csv_text}, headers=a).json()
    assert client.get(f"/api/demo/imports/{receipt['id']}", headers=b).status_code == 404
    assert client.post('/api/demo/import', json={'csv_text': csv_text}, headers=b).json()['replayed'] is False
    assert client.get('/api/account/export', headers=a).json()['data']['demo_reviews'][0]['note'] == 'Org A only'


def test_old_sandbox_tables_gain_org_id_and_keep_rows(tmp_path):
    import sqlite3
    from app import main
    path = tmp_path / 'old.sqlite3'
    old = sqlite3.connect(path)
    old.execute("CREATE TABLE demo_records (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, metric_value TEXT NOT NULL, metric_label TEXT NOT NULL, status TEXT NOT NULL, evidence TEXT NOT NULL, source_type TEXT NOT NULL DEFAULT 'SYNTHETIC')")
    old.execute("INSERT INTO demo_records (id,title,subtitle,metric_value,metric_label,status,evidence) VALUES ('X1','t','s','1','m','approved','e')")
    old.commit(); old.close()
    main.STATE = path
    with main.connect() as db:
        assert dict(db.execute('SELECT org_id, status FROM demo_records').fetchone()) == {'org_id': 'local', 'status': 'approved'}
