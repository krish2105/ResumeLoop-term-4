"""Record real local-model answers for the public demo.

Run from the project root with Ollama running:
    PYTHONPATH=services/api .venv/bin/python scripts/record_demo_ai.py
then: PYTHONPATH=services/api .venv/bin/python scripts/export_demo_fixtures.py

Uses a throwaway SQLite file, the same feature functions as the live API, and the fictional course and
fictional studio examples only. Every answer keeps its model name; the demo labels them "Recorded answer".
"""
import json
import sqlite3
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from app.ai import features
from app.ai.llm import get_llm
from app.course import diff_versions, get_version, latest_version
from app.storage import SCHEMA

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'sample' / 'recorded_ai.json'
QUESTIONS = [
    ('When is the reading check quiz due?', None),
    ('What goes in an empathy map?', None),
    ('What changed in the point-of-view exercise?', None),
    ('How long will this take and what do I need first?', 's3-exercise'),
    ('Can I get an extension on my grade?', None),
]
INSIGHTS = [
    'Returning learners lose time reconciling course sources that disagree',
    'Learners with short study windows want to start something useful immediately',
]


def main():
    llm = get_llm()
    status = llm.status()
    if not status['available']:
        raise SystemExit('Ollama is not available; start it before recording.')
    with tempfile.TemporaryDirectory() as tmp:
        conn = sqlite3.connect(str(Path(tmp) / 'record.sqlite3'))
        conn.row_factory = sqlite3.Row
        for statement in SCHEMA:
            conn.execute(statement)
        changes = diff_versions(get_version('v1'), latest_version())
        digest = {'from': 'v1', 'to': latest_version().version,
                  'facts': [{'id': c['id'], 'fact': features.describe(c)} for c in changes],
                  **features.digest(conn, llm, changes)}
        actions = {a.id: a.model_dump() for a in latest_version().actions}
        coach = [{'question': q, 'about': about, 'response': features.coach(conn, llm, q, actions.get(about) if about else None)}
                 for q, about in QUESTIONS]
        draft = features.escalation_draft(conn, llm, 'Which date is correct for the reading check quiz?', actions['s3-quiz'], None)
        examples = json.loads((ROOT / 'data' / 'sample' / 'fictional_studio.json').read_text(encoding='utf-8'))
        codes = {}
        for n in examples['notes']:
            r = features.suggest_codes(conn, llm, n['text'])
            codes[n['participant_code']] = {'codes': r['codes'], 'rejected': r['rejected'], 'model': r['model']}
        hmw = {i: {k: v for k, v in features.suggest_hmw(conn, llm, i).items() if k in ('questions', 'model')} for i in INSIGHTS}
        log = [{**dict(r), 'detail': json.loads(r['detail_json'])} for r in conn.execute('SELECT * FROM ai_log ORDER BY id DESC')]
        for entry in log:
            entry.pop('detail_json', None)
        conn.close()
    data = {'recorded_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'model': llm.gen_model,
            'embed_model': llm.embed_model, 'notice': 'Real answers from the local model on fictional data, recorded for the public demo.',
            'digest': digest, 'coach': coach, 'draft': draft, 'codes': codes, 'hmw': hmw, 'hmw_insights': INSIGHTS, 'log': log}
    OUT.write_text(json.dumps(data, indent=1) + '\n', encoding='utf-8')
    modes = [c['response']['mode'] for c in coach]
    print(f'wrote {OUT.relative_to(ROOT)}: digest={digest["mode"]}, coach={modes}, codes={ {k: len(v["codes"]) for k, v in codes.items()} }, hmw={[len(v["questions"]) for v in hmw.values()]}')


if __name__ == '__main__':
    main()
