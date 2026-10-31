import pytest

from app.course import CourseAction, diff_versions, get_version, load_course
from app.planner import PlanInputError, build_plan


def act(id, minutes=10, pre=(), session=1, kind='recap', due=None, due_status='none'):
    return CourseAction(id=id, title=f'Task {id}', session=session, kind=kind, minutes=minutes,
                        prerequisites=list(pre), due=due, due_status=due_status, source_ref='S1')


def test_completed_actions_are_never_reselected():
    plan = build_plan([act('a1'), act('b1', pre=['a1'])], 60, {'a1'})
    assert plan['sequence'] == ['b1']
    assert next(i for i in plan['items'] if i['id'] == 'a1')['state'] == 'completed'


def test_dependent_sorted_before_prerequisite_is_still_scheduled():
    # b1 has the better session rank but needs a2, which sorts later; the starter skipped b1
    actions = [act('b1', pre=['a2'], session=1), act('a2', session=2)]
    assert build_plan(actions, 60, set())['sequence'] == ['a2', 'b1']


def test_unlock_chain_respects_budget_exactly():
    actions = [act('a1', 15), act('b1', 25, pre=['a1']), act('c1', 20, pre=['b1'])]
    plan = build_plan(actions, 40, set())
    assert plan['sequence'] == ['a1', 'b1'] and plan['remaining_minutes'] == 0
    assert next(i for i in plan['items'] if i['id'] == 'c1')['state'] == 'does-not-fit'


@pytest.mark.parametrize('actions,needle', [
    ([act('a1'), act('a1')], 'duplicate'),
    ([act('a1', pre=['zz'])], 'unknown prerequisite'),
    ([act('a1', pre=['b1']), act('b1', pre=['a1'])], 'cycle'),
    ([act('a1', pre=['a1'])], 'itself'),
])
def test_invalid_graphs_are_rejected(actions, needle):
    with pytest.raises(PlanInputError) as exc:
        build_plan(actions, 60, set())
    assert any(needle in e for e in exc.value.errors)


def test_zero_and_negative_budget():
    assert build_plan([act('a1')], 0, set())['sequence'] == []
    assert build_plan([act('a1')], 0, set())['empty_reason'] == 'Nothing unlocked fits this time budget'
    with pytest.raises(PlanInputError):
        build_plan([act('a1')], -5, set())


def test_missing_duration_abstains_instead_of_defaulting():
    plan = build_plan([act('a1', minutes=None), act('b1')], 60, set())
    assert plan['sequence'] == ['b1']
    assert next(i for i in plan['items'] if i['id'] == 'a1')['state'] == 'abstained'


def test_verified_deadline_goes_first_and_unverified_is_warned():
    actions = [act('a1', session=1), act('q1', session=3, kind='assessment', due='2026-11-24T18:00:00+04:00', due_status='verified'),
               act('g1', session=2, kind='assessment', due='2026-12-01T18:00:00+04:00', due_status='unverified')]
    plan = build_plan(actions, 60, set())
    assert plan['sequence'][0] == 'q1'
    assert any('unverified' in w for w in plan['warnings'])


def test_all_completed_has_explicit_empty_reason():
    assert build_plan([act('a1')], 60, {'a1'})['empty_reason'] == 'Everything is completed'


def test_fictional_course_is_valid_and_demo_plan_is_feasible():
    course = load_course()
    for v in course.versions:
        build_plan(v.actions, 600, set())
    plan = build_plan(get_version('v2').actions, 60, set(course.demo_learner.completed))
    assert plan['planned_minutes'] <= 60 and plan['next_action'] is not None
    assert not set(plan['sequence']) & set(course.demo_learner.completed)


def test_diff_lists_added_removed_and_changed():
    changes = diff_versions(get_version('v1'), get_version('v2'))
    kinds = {(c['type'], c['action_id'], c.get('field')) for c in changes}
    assert ('added', 's4-reading', None) in kinds and ('removed', 's6-reflection', None) in kinds
    assert ('changed', 's3-quiz', 'due') in kinds and ('changed', 's4-exercise', 'minutes') in kinds
    assert [c['id'] for c in changes] == [f'C{i}' for i in range(1, len(changes) + 1)]


def test_plan_and_progress_routes(client):
    assert client.get('/api/course').json()['version'] == 'v2'
    assert client.get('/api/course?version=v9').status_code == 404
    r = client.post('/api/plan', json={'budget_minutes': 45, 'completed': ['s1-recap']})
    assert r.status_code == 200 and r.json()['planned_minutes'] <= 45
    assert client.post('/api/plan', json={'budget_minutes': -1}).status_code == 422
    p = client.get('/api/learner/progress').json()
    assert p['version'] == 0 and 's1-recap' in p['state']['completed']
    state = {**p['state'], 'completed': p['state']['completed'] + ['s2-exercise']}
    saved = client.put('/api/learner/progress', json={'expected_version': 0, 'state': state})
    assert saved.status_code == 200 and saved.json()['version'] == 1
    stale = client.put('/api/learner/progress', json={'expected_version': 0, 'state': state})
    assert stale.status_code == 409
    bad = client.put('/api/learner/progress', json={'expected_version': 1, 'state': {**state, 'completed': ['nope']}})
    assert bad.status_code == 422
    assert client.get('/api/learner/progress').json()['state']['completed'][-1] == 's2-exercise'
