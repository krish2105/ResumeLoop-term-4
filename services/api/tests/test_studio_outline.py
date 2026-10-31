import pytest

VALID = {
    'observations': {'setting': 'Train, evening', 'user_type': 'extreme-low', 'what_happened': 'Opened three apps before finding the quiz date.'},
    'personas': {'label': 'The night-shift learner', 'goals': 'Start something useful in 30 minutes'},
    'povs': {'user': 'A working learner back from a missed session', 'need': 'to know the one next task', 'insight': 'sources disagree'},
    'storyboards': {'title': 'Returning on the train', 'frames': [{'caption': 'Opens the app'}, {'caption': 'Sees one next task'}]},
    'hills': {'who': 'A returning learner', 'what': 'can start the right next task', 'wow': 'within two minutes of opening the app'},
    'scenarios': {'what_if': 'What if the coordinator changes a deadline twice?'},
    'journeys': {'title': 'Current return journey', 'phase': 'current', 'stages': [{'name': 'Return', 'feeling': 2}]},
    'sprints': {'prompt': 'How might we show one trusted date?', 'sketches': ['badge', 'banner']},
    'prototypes': {'version': 'v0.3', 'title': 'Ember road', 'fidelity': 'working', 'feedback': [{'kind': 'wish', 'text': 'Bigger labels'}]},
    'risks': {'risk': 'Coach invents a deadline', 'category': 'accuracy', 'likelihood': 2, 'impact': 3},
    'roleplays': {'scenario': 'A coordinator wants learner analytics without consent.', 'roles': ['Coordinator', 'Learner']},
    'reflections': {'entry_date': '2026-11-12', 'concept': 'Empathy mapping'},
    'members': {'name': 'Krishna Mathur'},
    'contributions': {'member': 'Krishna Mathur', 'area': 'research', 'description': 'Ran two interviews'},
    'milestones': {'title': 'Reflective paper', 'weight': 40},
    'rubric': {'component': 'Group', 'criterion': 'Quality of visual presentation'},
    'sdg': {'goal': 'SDG 4 Quality Education'},
}


@pytest.mark.parametrize('kind', sorted(VALID))
def test_every_outline_collection_accepts_a_valid_record(client, kind):
    r = client.post(f'/api/studio/{kind}', json={'body': VALID[kind]})
    assert r.status_code == 200, r.json()
    assert client.get(f'/api/studio/{kind}').json()[0]['id'] == r.json()['id']


@pytest.mark.parametrize('kind,patch', [
    ('risks', {'likelihood': 4}), ('reflections', {'entry_date': '12/11/2026'}), ('journeys', {'stages': []}),
    ('observations', {'what_happened': 'Email me at someone@example.com about this please.'}), ('hills', {'wow': ''}),
    ('sprints', {'sketches': [str(i) for i in range(9)]}), ('prototypes', {'fidelity': 'imaginary'}),
])
def test_outline_collections_reject_invalid_records(client, kind, patch):
    assert client.post(f'/api/studio/{kind}', json={'body': {**VALID[kind], **patch}}).status_code == 422


def test_record_fields_never_shadow_collection_metadata(client):
    client.post('/api/studio/journeys', json={'body': VALID['journeys']})
    assert client.get('/api/studio/journeys').json()[0]['kind'] == 'journeys'


def test_course_hub_seed_is_idempotent_and_dates_stay_unverified(client):
    first = client.post('/api/studio-examples/course-hub').json()
    assert first['loaded'] == 4 + 5 + 8 + 3 + 1
    assert client.post('/api/studio-examples/course-hub').json()['loaded'] == 0
    milestones = client.get('/api/studio/milestones').json()
    assert sum(m['weight'] for m in milestones) == 100 and all(m['status'] == 'unverified' for m in milestones)
    assert len(client.get('/api/studio/rubric').json()) == 16


def test_readings_seed_and_spaced_repetition(client):
    assert client.post('/api/studio-examples/readings').json()['loaded'] == 22
    assert client.post('/api/studio-examples/readings').json()['loaded'] == 0
    card = client.post('/api/studio/flashcards', json={'body': {'front': 'What is a Hill?', 'back': 'Who, what, wow'}}).json()
    up = client.post(f"/api/studio/flashcards/{card['id']}/review", json={'correct': True, 'today': '2026-11-10'}).json()
    assert up['box'] == 2 and up['due'] == '2026-11-12' and up['correct'] == 1
    down = client.post(f"/api/studio/flashcards/{card['id']}/review", json={'correct': False, 'today': '2026-11-12'}).json()
    assert down['box'] == 1 and down['due'] == '2026-11-13' and down['reviews'] == 2


def test_interview_capture_needs_consent_then_becomes_note_and_codes(client):
    iv = client.post('/api/studio/interviews', json={'body': {'participant_code': 'P07', 'date': '2026-11-14', 'guide': 'learner',
        'moments': [{'t': 30, 'tag': 'does', 'text': 'Opened three apps to find the date'}, {'t': 95, 'tag': 'feels', 'text': 'Felt behind before starting'}]}}).json()
    assert client.post(f"/api/studio/interviews/{iv['id']}/to-note").status_code == 409
    client.post('/api/studio/participants', json={'body': {'code': 'P07', 'segment': 'learner', 'user_type': 'extreme-low', 'consent': 'consented', 'consent_date': '2026-11-13'}})
    r = client.post(f"/api/studio/interviews/{iv['id']}/to-note").json()
    assert r['codes'] == 2 and '[00:30]' in r['note']['text']
    assert client.post(f"/api/studio/interviews/{iv['id']}/to-note").status_code == 409
    assert client.post('/api/studio/participants', json={'body': {'code': 'P08', 'segment': 'learner', 'user_type': 'mainstream', 'note': 'email a@b.co'}}).status_code == 422
