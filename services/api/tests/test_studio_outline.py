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
