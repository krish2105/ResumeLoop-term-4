"""Export the fixtures that power the backend-free Vercel demo.

Run from the project root:  PYTHONPATH=services/api .venv/bin/python scripts/export_demo_fixtures.py
Course data, diffs and planner parity cases come from the same backend code the local app uses.
Recorded AI answers (if present) are merged from data/sample/recorded_ai.json, produced by
scripts/record_demo_ai.py against a running local API with Ollama.
"""
import json
import random
from pathlib import Path

from app.course import SCHEMA_VERSION, diff_versions, get_version, load_course
from app.planner import build_plan

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'apps' / 'web' / 'demo' / 'fixtures.json'
RECORDED = ROOT / 'data' / 'sample' / 'recorded_ai.json'


def course_payload(version):
    c = load_course()
    v = get_version(version)
    return {'course': c.course, 'notice': c.notice, 'source_owner': c.source_owner, 'timezone': c.timezone,
            'schema_version': SCHEMA_VERSION, 'versions': [x.version for x in c.versions], 'version': v.version,
            'published_at': v.published_at, 'actions': [a.model_dump() for a in v.actions],
            'sources': [s.model_dump() for s in c.sources], 'source_type': 'SYNTHETIC'}


def parity_cases(seed=204, count=60):
    rng = random.Random(seed)
    cases = []
    for _ in range(count):
        version = rng.choice(['v1', 'v2'])
        actions = get_version(version).actions
        completed = sorted(a.id for a in actions if rng.random() < 0.35)
        budget = rng.choice([0, 10, 15, 30, 45, 60, 90, 120, 240])
        plan = build_plan(actions, budget, set(completed))
        cases.append({'version': version, 'budget': budget, 'completed': completed,
                      'sequence': plan['sequence'], 'warnings': plan['warnings'],
                      'states': {i['id']: i['state'] for i in plan['items']}})
    return cases


def main():
    c = load_course()
    data = {
        'generated_by': 'scripts/export_demo_fixtures.py',
        'notice': 'FICTIONAL demo data. No real learners, deadlines or participants.',
        'courses': {v.version: course_payload(v.version) for v in c.versions},
        'diff': {'from': 'v1', 'to': 'v2', 'changes': diff_versions(get_version('v1'), get_version('v2'))},
        'demo_learner': c.demo_learner.model_dump(),
        'planner_parity': parity_cases(),
        'recorded_ai': json.loads(RECORDED.read_text(encoding='utf-8')) if RECORDED.exists() else {},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1) + '\n', encoding='utf-8')
    print(f'wrote {OUT.relative_to(ROOT)} with {len(data["planner_parity"])} parity cases')


if __name__ == '__main__':
    main()
