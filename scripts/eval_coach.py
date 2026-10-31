"""Evaluate the grounded coach against data/eval/coach_gold.json with the live local model.

Run from the project root with Ollama running:
    PYTHONPATH=services/api .venv/bin/python scripts/eval_coach.py
Writes evidence/eval/coach-eval.json. Metrics:
  answer_rate       answerable questions that got an answer (not an abstention)
  citation_hit_rate answered questions whose citations include an expected chunk
  abstain_rate      unanswerable questions the coach correctly declined
  injection_safe    injection prompts whose output contains none of the forbidden strings
"""
import json
import sqlite3
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

from app.ai import features
from app.ai.llm import get_llm
from app.storage import SCHEMA

ROOT = Path(__file__).resolve().parents[1]
GOLD = json.loads((ROOT / 'data' / 'eval' / 'coach_gold.json').read_text(encoding='utf-8'))
OUT = ROOT / 'evidence' / 'eval' / 'coach-eval.json'


def main():
    llm = get_llm()
    if not llm.status()['available']:
        raise SystemExit('Ollama is not available.')
    rows = []
    with tempfile.TemporaryDirectory() as tmp:
        conn = sqlite3.connect(str(Path(tmp) / 'eval.sqlite3'))
        conn.row_factory = sqlite3.Row
        for st in SCHEMA:
            conn.execute(st)

        def ask(q):
            t = time.perf_counter()
            r = features.coach(conn, llm, q)
            return r, round(time.perf_counter() - t, 2)

        for g in GOLD['answerable']:
            r, s = ask(g['q'])
            rows.append({'kind': 'answerable', 'q': g['q'], 'mode': r['mode'], 'citations': r['citations'], 'expect': g['expect'],
                         'hit': bool(set(r['citations']) & set(g['expect'])), 'seconds': s, 'answer': r['answer']})
        for q in GOLD['unanswerable']:
            r, s = ask(q)
            rows.append({'kind': 'unanswerable', 'q': q, 'mode': r['mode'], 'abstained': r['abstained'], 'seconds': s, 'answer': r['answer']})
        for g in GOLD['injection']:
            r, s = ask(g['q'])
            text = r['answer'].lower()
            rows.append({'kind': 'injection', 'q': g['q'], 'mode': r['mode'], 'safe': not any(f.lower() in text for f in g['forbid']), 'seconds': s, 'answer': r['answer']})
        conn.close()
    ans = [r for r in rows if r['kind'] == 'answerable']
    answered = [r for r in ans if r['mode'] == 'ai']
    un = [r for r in rows if r['kind'] == 'unanswerable']
    inj = [r for r in rows if r['kind'] == 'injection']
    metrics = {
        'answer_rate': round(len(answered) / len(ans), 3),
        'citation_hit_rate': round(sum(r['hit'] for r in answered) / len(answered), 3) if answered else None,
        'abstain_rate': round(sum(r['abstained'] for r in un) / len(un), 3),
        'injection_safe': round(sum(r['safe'] for r in inj) / len(inj), 3),
        'median_seconds': sorted(r['seconds'] for r in rows)[len(rows) // 2],
        'questions': len(rows),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'run_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'model': llm.gen_model,
                               'embed_model': llm.embed_model, 'gold': 'data/eval/coach_gold.json', 'metrics': metrics, 'rows': rows}, indent=1) + '\n', encoding='utf-8')
    print(json.dumps(metrics))


if __name__ == '__main__':
    main()
