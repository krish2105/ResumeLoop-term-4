import copy
import json

from app.course import COURSE_FILE


def package(**changes):
    p = json.loads(COURSE_FILE.read_text())
    p['course'] = 'Imported test course'
    p.update(changes)
    return p


def test_import_validates_previews_activates_and_resets(client):
    bad = package()
    bad['versions'][0]['actions'][1]['prerequisites'] = ['nope']
    r = client.post('/api/course/import/preview', json={'package': bad}).json()
    assert r['ok'] is False and any('unknown prerequisite' in e for e in r['errors'])
    assert client.post('/api/course/import', json={'package': bad}).status_code == 422
    good = package()
    good['versions'][-1]['actions'][0]['minutes'] = 20
    prev = client.post('/api/course/import/preview', json={'package': good}).json()
    assert prev['ok'] and any(c['field'] == 'minutes' for c in prev['changes_vs_current'])
    first = client.post('/api/course/import', json={'package': good}).json()
    assert client.get('/api/course').json()['course'] == 'Imported test course'
    again = client.post('/api/course/import', json={'package': good}).json()
    assert again['replayed'] and again['id'] == first['id']
    assert client.post('/api/course/reset').json()['active'].startswith('Fictional')
    assert client.get('/api/course').json()['course'].startswith('Fictional')
    client.post(f"/api/course/packages/{first['id']}/activate")
    assert client.get('/api/course').json()['course'] == 'Imported test course'


def test_unknown_source_reference_is_rejected(client):
    p = package()
    p['versions'][0]['actions'][0]['source_ref'] = 'S99'
    assert any('unknown sources' in e for e in client.post('/api/course/import/preview', json={'package': p}).json()['errors'])


def test_learner_profiles_are_separate_and_listed(client):
    base = client.get('/api/learner/progress?learner=aisha-p01').json()
    assert base['state']['completed'] == []
    client.put('/api/learner/progress?learner=aisha-p01', json={'expected_version': 0, 'state': {**base['state'], 'completed': ['s1-recap']}})
    assert 's1-recap' not in client.get('/api/learner/progress?learner=omar-p02').json()['state']['completed']
    assert client.get('/api/learner/progress?learner=Bad Name').status_code == 422
    rows = client.get('/api/learners').json()
    assert [r['learner_id'] for r in rows] == ['aisha-p01'] and rows[0]['completed'] == 1


def test_insights_summarise_coach_use(client):
    i = client.get('/api/coordinator/insights').json()
    assert i['coach_calls'] == 0 and i['open_questions'] == []
