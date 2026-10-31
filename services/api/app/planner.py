"""Deterministic recovery planner. Rule-based, explainable, never predicts learner outcomes.

Fixes the starter defects: completed actions are never reselected, and actions unlocked by
earlier choices are reconsidered on every pass regardless of their sort position.
"""
from .course import CourseAction

KIND_RANK = {'recap': 0, 'reading': 1, 'exercise': 2, 'assessment': 3, 'reflection': 4}


class PlanInputError(ValueError):
    def __init__(self, errors: list[str]):
        super().__init__('; '.join(errors))
        self.errors = errors


def validate_graph(actions: list[CourseAction]) -> None:
    errors: list[str] = []
    ids = [a.id for a in actions]
    seen: set[str] = set()
    for aid in ids:
        if aid in seen:
            errors.append(f'duplicate action id {aid}')
        seen.add(aid)
    known = set(ids)
    for a in actions:
        for p in a.prerequisites:
            if p not in known:
                errors.append(f'{a.id} needs unknown prerequisite {p}')
            if p == a.id:
                errors.append(f'{a.id} lists itself as a prerequisite')
    if not errors:
        graph = {a.id: a.prerequisites for a in actions}
        state: dict[str, int] = {}

        def visit(node: str, path: list[str]) -> None:
            if state.get(node) == 2:
                return
            if state.get(node) == 1:
                errors.append('prerequisite cycle: ' + ' -> '.join(path[path.index(node):] + [node]))
                return
            state[node] = 1
            for nxt in graph[node]:
                visit(nxt, path + [node])
            state[node] = 2

        for aid in graph:
            visit(aid, [])
    if errors:
        raise PlanInputError(sorted(set(errors)))


def priority(a: CourseAction) -> tuple:
    verified_due = a.due if a.due_status == 'verified' and a.due else '9999'
    return (verified_due, a.session, KIND_RANK[a.kind], a.id)


def build_plan(actions: list[CourseAction], budget_minutes: int, completed: set[str]) -> dict:
    if budget_minutes < 0:
        raise PlanInputError(['budget_minutes must be zero or more'])
    validate_graph(actions)
    known = {a.id for a in actions}
    unknown_done = sorted(completed - known)
    done = completed & known
    remaining = budget_minutes
    chosen: list[CourseAction] = []
    picked: set[str] = set()
    while True:
        ready = [a for a in actions if a.id not in done and a.id not in picked and a.minutes is not None
                 and a.minutes <= remaining and set(a.prerequisites) <= (done | picked)]
        if not ready:
            break
        best = min(ready, key=priority)
        chosen.append(best)
        picked.add(best.id)
        remaining -= best.minutes

    def reason(a: CourseAction) -> dict:
        if a.id in done:
            return {'state': 'completed', 'reason': 'Already completed'}
        if a.id in picked:
            order = [c.id for c in chosen].index(a.id) + 1
            why = 'Verified deadline first' if a.due_status == 'verified' else f'Earliest unlocked session {a.session} task'
            return {'state': 'planned', 'order': order, 'reason': why}
        if a.minutes is None:
            return {'state': 'abstained', 'reason': 'Duration unknown in the source, so it is not scheduled'}
        missing = [p for p in a.prerequisites if p not in done and p not in picked]
        if missing:
            return {'state': 'locked', 'reason': 'Needs ' + ', '.join(missing) + ' first', 'needs': missing}
        return {'state': 'does-not-fit', 'reason': f'Needs {a.minutes} min, {remaining} min left'}

    items = [{**a.model_dump(), **reason(a)} for a in sorted(actions, key=lambda x: (x.session, KIND_RANK[x.kind], x.id))]
    warnings = []
    for a in chosen:
        if a.due_status in ('unverified', 'conflict'):
            problem = 'is not verified' if a.due_status == 'unverified' else 'differs between sources'
            warnings.append(f'{a.title}: the deadline {problem}; check with the coordinator')
    for a in actions:
        if a.id not in done and a.due_status == 'conflict' and a.id not in picked:
            warnings.append(f'{a.title}: sources disagree on the deadline')
    if unknown_done:
        warnings.append('Ignored completed IDs not in this course version: ' + ', '.join(unknown_done))
    next_action = chosen[0].id if chosen else None
    return {
        'method': 'deterministic planner, not AI',
        'budget_minutes': budget_minutes,
        'planned_minutes': budget_minutes - remaining,
        'remaining_minutes': remaining,
        'next_action': next_action,
        'sequence': [c.id for c in chosen],
        'items': items,
        'warnings': sorted(set(warnings)),
        'empty_reason': None if chosen else ('Everything is completed' if len(done) == len(actions)
                                             else 'Nothing unlocked fits this time budget'),
    }
