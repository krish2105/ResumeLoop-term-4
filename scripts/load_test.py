"""Small concurrent load test against a running local API (not run in CI).

    PYTHONPATH=services/api .venv/bin/python scripts/load_test.py [base_url] [requests] [concurrency]

Exercises read-heavy routes plus the planner; writes evidence/2026-11-01/load-test.json.
"""
import json
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8014'
N = int(sys.argv[2]) if len(sys.argv) > 2 else 600
C = int(sys.argv[3]) if len(sys.argv) > 3 else 12
CALLS = [('GET', '/api/course', None), ('POST', '/api/plan', {'budget_minutes': 60, 'completed': ['s1-recap']}),
         ('GET', '/api/learner/progress', None), ('GET', '/api/studio/notes', None), ('GET', '/api/studio/themes', None)]


def one(i):
    method, path, body = CALLS[i % len(CALLS)]
    t = time.perf_counter()
    r = httpx.request(method, BASE + path, json=body, timeout=30)
    return path, r.status_code, (time.perf_counter() - t) * 1000


if __name__ == '__main__':
    t0 = time.perf_counter()
    with ThreadPoolExecutor(C) as pool:
        results = list(pool.map(one, range(N)))
    wall = time.perf_counter() - t0
    ms = sorted(r[2] for r in results)
    out = {'base': BASE, 'requests': N, 'concurrency': C, 'wall_s': round(wall, 2), 'rps': round(N / wall, 1),
           'p50_ms': round(statistics.median(ms), 1), 'p95_ms': round(ms[int(len(ms) * 0.95) - 1], 1),
           'errors': sum(r[1] >= 400 for r in results)}
    dest = Path(__file__).resolve().parents[1] / 'evidence' / '2026-11-01' / 'load-test.json'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=1) + '\n')
    print(json.dumps(out))
