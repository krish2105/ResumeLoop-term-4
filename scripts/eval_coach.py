"""Evaluate the grounded coach and assistant features with the live local model, and record a replay.

Run from the project root with Ollama running:
    PYTHONPATH=services/api .venv/bin/python scripts/eval_coach.py
Writes evidence/eval/coach-eval.json and data/eval/replay.json (used by the CI replay test).
"""
import json
import sqlite3
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from app.ai.evaluate import ROOT, RecordingLLM, run
from app.ai.llm import get_llm
from app.storage import SCHEMA

OUT = ROOT / 'evidence' / 'eval' / 'coach-eval.json'


def main():
    live = get_llm()
    if not live.status()['available']:
        raise SystemExit('Ollama is not available.')
    llm = RecordingLLM(live)
    with tempfile.TemporaryDirectory() as tmp:
        conn = sqlite3.connect(str(Path(tmp) / 'eval.sqlite3'))
        conn.row_factory = sqlite3.Row
        for st in SCHEMA:
            conn.execute(st)
        result = run(conn, llm)
        conn.close()
    llm.save()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'run_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'model': live.gen_model,
                               'embed_model': live.embed_model, 'gold': 'data/eval/coach_gold.json', **result}, indent=1) + '\n', encoding='utf-8')
    print(json.dumps(result['metrics']))


if __name__ == '__main__':
    main()
