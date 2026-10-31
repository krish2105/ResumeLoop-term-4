"""Replays the recorded live evaluation offline. Fails if a prompt change breaks the recording or if
quality drops below the thresholds; re-record with scripts/eval_coach.py when prompts change on purpose."""
import sqlite3

import pytest

from app.ai.evaluate import REPLAY, THRESHOLDS, ReplayLLM, run
from app.storage import SCHEMA


@pytest.mark.skipif(not REPLAY.exists(), reason='no recorded replay yet')
def test_recorded_evaluation_meets_thresholds(tmp_path):
    conn = sqlite3.connect(str(tmp_path / 'replay.sqlite3'))
    conn.row_factory = sqlite3.Row
    for st in SCHEMA:
        conn.execute(st)
    llm = ReplayLLM()
    metrics = run(conn, llm)['metrics']
    assert llm.misses == 0, 'prompts changed since the recording; rerun scripts/eval_coach.py'
    for key, floor in THRESHOLDS.items():
        assert metrics[key] >= floor, f'{key} {metrics[key]} below {floor}'
