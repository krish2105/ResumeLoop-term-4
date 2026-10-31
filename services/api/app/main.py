"""ResumeLoop local development API. NOT FOR CUSTOMER DATA OR PUBLIC EXPOSURE.

Demo reviewers operate on synthetic records. With RL_AUTH=required every route, including /api/demo/*, is scoped to the
signed-in organisation.
"""
import csv
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from .domain import domain_example
from .imports import CSVImport, DemoCase, HEADERS, InvalidCSV, validate_csv
from .tenancy import org

APP_NAME = "ResumeLoop"
HERE=Path(__file__).resolve()
ROOT=HERE.parents[3]
SAMPLE=ROOT / 'data' / 'sample' / 'demo_cases.csv'
STATE=Path(os.environ.get('DEMO_DB_PATH', str(ROOT / 'services' / 'api' / '.state' / 'demo.sqlite3')))
app=FastAPI(title=APP_NAME+' local starter API',version='0.1.0')
VALID_STATUS={'ready','needs-review','blocked','approved','rejected'}

@contextmanager
def connect():
    STATE.parent.mkdir(parents=True,exist_ok=True)
    # One connection per request; FastAPI may run a sync dependency and its endpoint on different threads.
    db=sqlite3.connect(str(STATE),timeout=20,check_same_thread=False)
    db.row_factory=sqlite3.Row
    try:
        db.execute('PRAGMA journal_mode = WAL')
        ensure_demo_tables(db)
        yield db
    finally:
        db.close()

DEMO_TABLES = {
    'demo_records': """CREATE TABLE IF NOT EXISTS demo_records (org_id TEXT NOT NULL DEFAULT 'local', id TEXT NOT NULL, title TEXT NOT NULL,
        subtitle TEXT NOT NULL, metric_value TEXT NOT NULL, metric_label TEXT NOT NULL, status TEXT NOT NULL, evidence TEXT NOT NULL,
        source_type TEXT NOT NULL DEFAULT 'SYNTHETIC', PRIMARY KEY (org_id, id))""",
    'demo_reviews': """CREATE TABLE IF NOT EXISTS demo_reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, org_id TEXT NOT NULL DEFAULT 'local',
        record_id TEXT NOT NULL, status TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)""",
    'demo_imports': """CREATE TABLE IF NOT EXISTS demo_imports (id TEXT PRIMARY KEY, org_id TEXT NOT NULL DEFAULT 'local', sha256 TEXT NOT NULL,
        schema_version TEXT NOT NULL, raw_csv TEXT NOT NULL, snapshot_json TEXT NOT NULL, receipt_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (org_id, sha256, schema_version))""",
}


def ensure_demo_tables(db):
    """The CSV review sandbox predates organisations: rebuild its tables with org_id, keeping old rows under 'local'."""
    for table, ddl in DEMO_TABLES.items():
        cols = [r[1] for r in db.execute(f'PRAGMA table_info({table})')]
        if cols and 'org_id' not in cols:
            with db:
                db.execute(f'ALTER TABLE {table} RENAME TO {table}_v0')
                db.execute(ddl)
                db.execute(f'INSERT INTO {table} ({", ".join(cols)}) SELECT {", ".join(cols)} FROM {table}_v0')
                db.execute(f'DROP TABLE {table}_v0')
        else:
            db.execute(ddl)


def clean_row(row):
    return DemoCase.model_validate(row).model_dump()

def initialize(db):
    if db.execute('SELECT COUNT(*) FROM demo_records WHERE org_id=?', (org(),)).fetchone()[0]: return
    with SAMPLE.open(encoding='utf-8',newline='') as f:
        for row in csv.DictReader(f):
            v=clean_row(row)
            db.execute('INSERT INTO demo_records (org_id,id,title,subtitle,metric_value,metric_label,status,evidence) VALUES (?,?,?,?,?,?,?,?)', (org(), *(v[x] for x in HEADERS)))
        db.commit()

class Review(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    record_id: str=Field(min_length=1,max_length=100)
    status: str=Field(pattern='^(ready|needs-review|blocked|approved|rejected)$')
    note: str=Field(min_length=3,max_length=2000)

@app.get('/api/health')
def health():
    from .tenancy import auth_required
    return {'ok':True,'project':APP_NAME,'mode':'LOCAL_SYNTHETIC_DEMO','version':'0.1.0','auth_required':auth_required()}

@app.get('/api/demo/records')
def records():
    with connect() as db:
        initialize(db)
        return [dict(x) for x in db.execute('SELECT * FROM demo_records WHERE org_id=? ORDER BY id', (org(),)).fetchall()]

@app.get('/api/demo/summary')
def summary():
    with connect() as db:
        initialize(db)
        rows=db.execute('SELECT status,COUNT(*) n FROM demo_records WHERE org_id=? GROUP BY status', (org(),)).fetchall()
        return {'counts':{r['status']:r['n'] for r in rows},'total':sum(r['n'] for r in rows),'source_type':'SYNTHETIC','note':'Counts of demo review cases, not business KPIs'}

@app.get('/api/demo/domain')
def domain():return domain_example()

@app.post('/api/demo/reviews')
def review(x:Review):
    with connect() as db:
        initialize(db)
        if db.execute('SELECT 1 FROM demo_records WHERE id=? AND org_id=?',(x.record_id,org())).fetchone() is None: raise HTTPException(404,'Unknown demo record')
        with db:
            db.execute('INSERT INTO demo_reviews (org_id,record_id,status,note) VALUES(?,?,?,?)',(org(),x.record_id,x.status,x.note))
            db.execute('UPDATE demo_records SET status=? WHERE id=? AND org_id=?',(x.status,x.record_id,org()))
        return {'ok':True,'record_id':x.record_id,'status':x.status,'source':'SYNTHETIC'}

@app.get('/api/demo/reviews')
def reviews():
    with connect() as db:
        return [dict(x) for x in db.execute('SELECT * FROM demo_reviews WHERE org_id=? ORDER BY id DESC LIMIT 100', (org(),)).fetchall()]

def validated_import(x: CSVImport):
    try:
        return validate_csv(x.csv_text)
    except InvalidCSV as exc:
        raise HTTPException(422, detail={'message': 'Nothing saved. Fix the indicated rows.', 'errors': exc.errors}) from exc


@app.post('/api/demo/import/preview')
def preview_import(x: CSVImport):
    return validated_import(x)


@app.get('/api/demo/imports')
def import_history():
    with connect() as db:
        return [json.loads(row['receipt_json']) for row in db.execute('SELECT receipt_json FROM demo_imports WHERE org_id=? ORDER BY rowid DESC LIMIT 100', (org(),))]


@app.get('/api/demo/imports/{import_id}')
def import_detail(import_id: str):
    with connect() as db:
        row = db.execute('SELECT * FROM demo_imports WHERE id=? AND org_id=?', (import_id, org())).fetchone()
        if row is None:
            raise HTTPException(404, 'Unknown import')
        return {**json.loads(row['receipt_json']), 'rows': json.loads(row['snapshot_json'])}


@app.post('/api/demo/import')
def import_demo(x: CSVImport):
    """Atomic synthetic-only save. Exact retry is a no-op, even after a review."""
    source = validated_import(x)
    with connect() as db:
        initialize(db)
        with db:
            db.execute('BEGIN IMMEDIATE')
            previous = db.execute('SELECT receipt_json FROM demo_imports WHERE sha256=? AND schema_version=? AND org_id=?', (source['sha256'], source['schema_version'], org())).fetchone()
            if previous:
                return {**json.loads(previous['receipt_json']), 'replayed': True}
            existing = {r['id'] for r in db.execute('SELECT id FROM demo_records WHERE org_id=?', (org(),))}
            reviewed = {r['record_id'] for r in db.execute('SELECT DISTINCT record_id FROM demo_reviews WHERE org_id=?', (org(),))}
            rows = source['rows']
            for row in rows:
                db.execute('''INSERT INTO demo_records (org_id,id,title,subtitle,metric_value,metric_label,status,evidence)
                    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(org_id,id) DO UPDATE SET title=excluded.title,
                    subtitle=excluded.subtitle,metric_value=excluded.metric_value,metric_label=excluded.metric_label,
                    status=CASE WHEN EXISTS(SELECT 1 FROM demo_reviews WHERE record_id=excluded.id AND org_id=excluded.org_id)
                        THEN demo_records.status ELSE excluded.status END,evidence=excluded.evidence''', (org(), *(row[h] for h in HEADERS)))
            receipt = {'ok': True, 'id': str(uuid.uuid4()), 'sha256': source['sha256'],
                'schema_version': source['schema_version'], 'source_type': 'SYNTHETIC',
                'upserted': len(rows), 'created': sum(r['id'] not in existing for r in rows),
                'updated': sum(r['id'] in existing for r in rows),
                'review_statuses_preserved': sum(r['id'] in reviewed for r in rows),
                'created_at': db.execute("SELECT strftime('%Y-%m-%dT%H:%M:%SZ','now')").fetchone()[0]}
            db.execute('INSERT INTO demo_imports (id,org_id,sha256,schema_version,raw_csv,snapshot_json,receipt_json) VALUES (?,?,?,?,?,?,?)',
                (receipt['id'], org(), source['sha256'], source['schema_version'], x.csv_text, json.dumps(rows), json.dumps(receipt)))
    return {**receipt, 'replayed': False}


from .assist import router as assist_router  # noqa: E402  (routers import connect lazily)
from .learning import router as learning_router  # noqa: E402
from .coordinator import router as coordinator_router  # noqa: E402
from .studio import examples_router, router as studio_router  # noqa: E402

from .auth import auth_middleware, router as auth_router  # noqa: E402
from .ops import access_middleware, router as ops_router  # noqa: E402

app.middleware('http')(auth_middleware)
app.middleware('http')(access_middleware)
# Added last so it is outermost: 401 and 413 responses from the inner middleware still carry CORS headers,
# otherwise the browser reports a network error instead of sending the learner to sign in.
app.add_middleware(CORSMiddleware,allow_origins=[o for o in os.environ.get('RL_CORS_ORIGINS','http://localhost:3000,http://127.0.0.1:3000').split(',') if o],allow_credentials=False,allow_methods=['*'],allow_headers=['*'],expose_headers=['X-Request-ID'])
app.include_router(auth_router)
app.include_router(ops_router)
app.include_router(learning_router)
app.include_router(coordinator_router)
app.include_router(assist_router)
app.include_router(examples_router)
app.include_router(studio_router)
