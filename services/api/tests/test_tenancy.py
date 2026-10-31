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
    assert storage.migrate(conn) == [4]
    assert conn.execute('SELECT org_id, version FROM learner_progress').fetchone() == ('local', 3)
