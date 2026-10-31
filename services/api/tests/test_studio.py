from app.ai import llm as llm_mod
from tests.test_ai import FakeLLM

CONSENT = {'participation': True, 'anonymised_notes': True, 'quotes': False}
TEXT = 'I opened the LMS, the chat and my email and none of them agreed on the quiz date. I felt behind.'


def note(client, **kw):
    body = {'participant_code': 'P10', 'context': 'test', 'text': TEXT, 'consent': CONSENT, **kw}
    return client.post('/api/studio/notes', json={'body': body})


def test_note_validation_and_privacy_guard(client):
    assert note(client).status_code == 200
    bad = note(client, text='Call me on +971 50 123 4567 about the quiz please, thanks.')
    assert bad.status_code == 422 and 'phone' in str(bad.json())
    assert note(client, participant_code='Alice').status_code == 422
    assert client.post('/api/studio/nonsense', json={'body': {}}).status_code == 404


def test_ai_codes_are_saved_as_suggestions_with_exact_quotes(client, monkeypatch):
    nid = note(client).json()['id']
    monkeypatch.setattr(llm_mod, '_llm', FakeLLM(replies=[{'codes': [
        {'label': 'Conflicting sources', 'quote': 'none of them agreed on the quiz date', 'category': 'does'},
        {'label': 'Invented', 'quote': 'I hate this course', 'category': 'says'},
        {'label': 'Bad category', 'quote': 'I felt behind', 'category': 'angry'}]}]))
    r = client.post(f'/api/studio/notes/{nid}/suggest-codes').json()
    assert len(r['saved']) == 1 and r['rejected'] == 2 and r['saved'][0]['status'] == 'suggested'
    code_id = r['saved'][0]['id']
    assert client.patch(f'/api/studio/codes/{code_id}', json={'status': 'accepted'}).json()['status'] == 'accepted'
    manual = client.post('/api/studio/codes', json={'parent_id': nid, 'body': {'label': 'x1', 'quote': 'not in the note', 'category': 'says'}})
    assert manual.status_code == 422


def test_no_consent_blocks_ai_analysis(client):
    nid = note(client, consent={'participation': True, 'anonymised_notes': False}).json()['id']
    assert client.post(f'/api/studio/notes/{nid}/suggest-codes').status_code == 409


def test_hmw_ideas_votes_and_scores(client):
    theme = client.post('/api/studio/themes', json={'body': {'title': 'Conflicting deadlines', 'insight': 'Sources disagree'}}).json()
    assert client.post('/api/studio/hmw', json={'parent_id': theme['id'], 'body': {'question': 'Why do dates change so often'}}).status_code == 422
    hmw = client.post('/api/studio/hmw', json={'parent_id': theme['id'], 'body': {'question': 'How might we show one trusted date?'}}).json()
    idea = client.post('/api/studio/ideas', json={'parent_id': hmw['id'], 'body': {'title': 'Date badge', 'alternative': 'resumeloop'}}).json()
    assert client.post('/api/studio/votes', json={'parent_id': idea['id'], 'body': {'voter': 'K'}}).status_code == 200
    assert client.post('/api/studio/votes', json={'parent_id': idea['id'], 'body': {'voter': 'K'}}).status_code == 409
    s = {'alternative': 'resumeloop', 'criterion': 'privacy', 'scorer': 'K'}
    client.post('/api/studio/scores', json={'body': {**s, 'value': 2}})
    client.post('/api/studio/scores', json={'body': {**s, 'value': 4}})
    scores = client.get('/api/studio/scores').json()
    assert len(scores) == 1 and scores[0]['value'] == 4
    client.delete(f"/api/studio/themes/{theme['id']}")
    assert client.get('/api/studio/hmw').json() == []


def test_experiment_freeze_locks_protocol_and_gates_sessions(client):
    exp = client.post('/api/studio/experiments', json={'body': {'title': 'Find the next task', 'hypothesis': 'B is faster than A for learners',
        'conditions': ['A', 'B'], 'tasks': ['t1'], 'metrics': ['seconds']}}).json()
    session = {'participant_code': 'P01', 'order': 'AB', 'results': [{'task': 0, 'condition': 'A', 'success': True, 'seconds': 40, 'wrong_actions': 1, 'ease': 4}]}
    assert client.post('/api/studio/sessions', json={'parent_id': exp['id'], 'body': session}).status_code == 409
    frozen = client.post(f"/api/studio/experiments/{exp['id']}/freeze").json()
    assert frozen['frozen_at'] and len(frozen['protocol_sha256']) == 64
    assert client.patch(f"/api/studio/experiments/{exp['id']}", json={'tasks': ['changed']}).status_code == 409
    assert client.post('/api/studio/sessions', json={'parent_id': exp['id'], 'body': session}).status_code == 200


def test_fictional_examples_load_once_and_clear(client):
    first = client.post('/api/studio-examples').json()
    assert first['loaded'] == 5 and 'FICTIONAL' in first['notice']
    assert client.post('/api/studio-examples').json()['loaded'] == 0
    assert all(n['synthetic'] for n in client.get('/api/studio/notes').json())
    assert client.delete('/api/studio-examples').json()['removed'] == 5
