import hashlib
import sqlite3
from concurrent.futures import ThreadPoolExecutor

import pytest

HEADER = 'id,title,subtitle,metric_value,metric_label,status,evidence\n'
ROW = 'D-TEST,Study recap,Synthetic session,15,minutes,ready,SYNTHETIC fixture\n'


def submit(client, text, preview=False):
    return client.post('/api/demo/import' + ('/preview' if preview else ''), json={'csv_text': text})


def test_preview_then_save_receipt_and_retry_after_review(client):
    text = HEADER + ROW
    initial = client.get('/api/demo/records').json()
    preview = submit(client, text, preview=True)
    assert preview.status_code == 200
    assert preview.json()['row_count'] == 1
    assert client.get('/api/demo/records').json() == initial
    assert client.get('/api/demo/imports').json() == []
    first = submit(client, text).json()
    assert first['created'] == first['upserted'] == 1
    assert first['updated'] == 0 and first['replayed'] is False
    assert first['sha256'] == hashlib.sha256(text.encode()).hexdigest()
    detail = client.get('/api/demo/imports/' + first['id']).json()
    assert detail['rows'][0]['id'] == 'D-TEST'
    client.post('/api/demo/reviews', json={'record_id': 'D-TEST', 'status': 'approved', 'note': 'Reviewed synthetic example'})
    retry = submit(client, text).json()
    assert retry['id'] == first['id'] and retry['replayed'] is True
    assert len(client.get('/api/demo/imports').json()) == 1
    assert next(r for r in client.get('/api/demo/records').json() if r['id'] == 'D-TEST')['status'] == 'approved'
    changed = submit(client, text.replace('15,minutes', '20,minutes')).json()
    assert changed['id'] != first['id']
    assert changed['review_statuses_preserved'] == changed['updated'] == 1
    record = next(r for r in client.get('/api/demo/records').json() if r['id'] == 'D-TEST')
    assert record['metric_value'] == '20' and record['status'] == 'approved'
    import app.main as mod
    with sqlite3.connect(mod.STATE) as db:
        assert db.execute('SELECT raw_csv FROM demo_imports WHERE id=?', (first['id'],)).fetchone()[0] == text


@pytest.mark.parametrize('row,field', [
    (ROW.rstrip() + ',extra\n', 'row'),
    ('D-TEST,Task,Demo,1,item,ready\n', 'row'),
    (ROW.replace('Study recap', '   '), 'title'),
    (ROW.replace(',15,', ',NaN,'), 'metric_value'),
    (ROW.replace(',15,', ',-1,'), 'metric_value'),
    (ROW.replace(',15,', ',1e999,'), 'metric_value'),
    (ROW.replace(',ready,', ',unknown,'), 'status'),
    (ROW.replace('D-TEST', 'REAL-TEST'), 'id'),
    (ROW.replace('D-TEST', 'D-' + 'X' * 100), 'id'),
    (ROW.replace('Study recap', 'X' * 2001), 'title'),
    ('\n', 'row'),
    ('D-TEST,"unterminated', 'row'),
])
def test_invalid_batch_is_atomic_and_identifies_field(client, row, field):
    before = client.get('/api/demo/records').json()
    response = submit(client, HEADER + ROW.replace('D-TEST', 'D-VALID') + row)
    assert response.status_code == 422
    assert field in [e['field'] for e in response.json()['detail']['errors']]
    assert client.get('/api/demo/records').json() == before
    assert client.get('/api/demo/imports').json() == []


def test_schema_boundaries_and_duplicate_normalization(client):
    assert submit(client, HEADER).status_code == 422
    assert submit(client, HEADER + ROW + ROW.replace('D-TEST', ' D-TEST ')).status_code == 422
    assert submit(client, HEADER.replace('id,title', 'title,id') + ROW).status_code == 422
    assert submit(client, HEADER + ''.join(ROW.replace('D-TEST', f'D-{i}') for i in range(250))).status_code == 200
    assert submit(client, HEADER + ''.join(ROW.replace('D-TEST', f'D-{i}') for i in range(251))).status_code == 422
    assert submit(client, 'X' * 150001).status_code == 422
    assert client.post('/api/demo/import', json={'csv_text': HEADER + ROW, 'source_type': 'REAL'}).status_code == 422


def test_quoted_multiline_and_zero_are_preserved(client):
    result = submit(client, HEADER + ROW.replace('Study recap', '"Recap, then\npractice"').replace(',15,', ',0,'))
    assert result.status_code == 200
    detail = client.get('/api/demo/imports/' + result.json()['id']).json()
    assert detail['rows'][0]['title'] == 'Recap, then\npractice'
    assert detail['rows'][0]['metric_value'] == '0'


def test_concurrent_retry_writes_once(client):
    client.get('/api/demo/records')
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(pool.map(lambda _: submit(client, HEADER + ROW), range(4)))
    assert all(r.status_code == 200 for r in responses)
    assert sum(not r.json()['replayed'] for r in responses) == 1
    assert len({r.json()['id'] for r in responses}) == 1
    assert len(client.get('/api/demo/imports').json()) == 1


def test_database_failure_rolls_back_records_and_receipt(client):
    before = client.get('/api/demo/records').json()
    import app.main as mod
    with sqlite3.connect(mod.STATE) as db:
        db.execute("CREATE TRIGGER reject_receipt BEFORE INSERT ON demo_imports BEGIN SELECT RAISE(ABORT, 'injected failure'); END")
    with pytest.raises(sqlite3.IntegrityError, match='injected failure'):
        submit(client, HEADER + ROW)
    assert client.get('/api/demo/records').json() == before
    assert client.get('/api/demo/imports').json() == []


def test_whitespace_review_and_unknown_receipt(client):
    assert client.post('/api/demo/reviews', json={'record_id': 'D-RL-001', 'status': 'approved', 'note': '   '}).status_code == 422
    assert client.get('/api/demo/imports/absent').status_code == 404
