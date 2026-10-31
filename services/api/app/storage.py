"""Shared SQLite access and versioned schema migrations.

Reuses `main.connect` so tests that override `main.STATE` isolate every table. Each migration runs
once per database and is recorded in `schema_migrations`; never edit a released migration, add a new one.
"""
import sqlite3
import threading

MIGRATIONS: list[tuple[int, str, list[str]]] = [
    (1, 'feature tables', [
        '''CREATE TABLE IF NOT EXISTS learner_progress (
            learner_id TEXT PRIMARY KEY, version INTEGER NOT NULL, state_json TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
        '''CREATE TABLE IF NOT EXISTS escalations (
            id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL, status TEXT NOT NULL,
            body_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
        '''CREATE TABLE IF NOT EXISTS ai_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT, feature TEXT NOT NULL, model TEXT NOT NULL,
            status TEXT NOT NULL, prompt_sha256 TEXT NOT NULL, detail_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
        '''CREATE TABLE IF NOT EXISTS embeddings (
            chunk_id TEXT NOT NULL, model TEXT NOT NULL, text_sha256 TEXT NOT NULL, vector_json TEXT NOT NULL,
            PRIMARY KEY (chunk_id, model, text_sha256))''',
        '''CREATE TABLE IF NOT EXISTS studio_items (
            id TEXT PRIMARY KEY, kind TEXT NOT NULL, parent_id TEXT, body_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
    ]),
    (2, 'indexes for studio lookups', [
        'CREATE INDEX IF NOT EXISTS ix_studio_kind ON studio_items (kind, created_at)',
        'CREATE INDEX IF NOT EXISTS ix_studio_parent ON studio_items (parent_id)',
    ]),
    (3, 'coordinator course packages', [
        '''CREATE TABLE IF NOT EXISTS course_packages (
            id TEXT PRIMARY KEY, sha256 TEXT NOT NULL, title TEXT NOT NULL, package_json TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 0, imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
    ]),
    (4, 'organisations, accounts, audit and tenant columns', [
        '''CREATE TABLE IF NOT EXISTS orgs (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
        '''CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
        '''CREATE TABLE IF NOT EXISTS memberships (org_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
            PRIMARY KEY (org_id, user_id))''',
        '''CREATE TABLE IF NOT EXISTS sessions (token_sha256 TEXT PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL,
            expires_at REAL NOT NULL)''',
        '''CREATE TABLE IF NOT EXISTS audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, org_id TEXT NOT NULL, actor TEXT NOT NULL,
            action TEXT NOT NULL, target TEXT NOT NULL, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''',
        "ALTER TABLE studio_items ADD COLUMN org_id TEXT NOT NULL DEFAULT 'local'",
        'CREATE INDEX IF NOT EXISTS ix_studio_org ON studio_items (org_id, kind)',
        "ALTER TABLE course_packages ADD COLUMN org_id TEXT NOT NULL DEFAULT 'local'",
        "ALTER TABLE ai_log ADD COLUMN org_id TEXT NOT NULL DEFAULT 'local'",
        '''CREATE TABLE learner_progress_v2 (org_id TEXT NOT NULL DEFAULT 'local', learner_id TEXT NOT NULL, version INTEGER NOT NULL,
            state_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (org_id, learner_id))''',
        "INSERT INTO learner_progress_v2 (org_id, learner_id, version, state_json, updated_at) SELECT 'local', learner_id, version, state_json, updated_at FROM learner_progress",
        'DROP TABLE learner_progress',
        'ALTER TABLE learner_progress_v2 RENAME TO learner_progress',
        '''CREATE TABLE escalations_v2 (id TEXT PRIMARY KEY, org_id TEXT NOT NULL DEFAULT 'local', idempotency_key TEXT NOT NULL,
            status TEXT NOT NULL, body_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (org_id, idempotency_key))''',
        "INSERT INTO escalations_v2 (id, org_id, idempotency_key, status, body_json, created_at, updated_at) SELECT id, 'local', idempotency_key, status, body_json, created_at, updated_at FROM escalations",
        'DROP TABLE escalations',
        'ALTER TABLE escalations_v2 RENAME TO escalations',
    ]),
    (5, 'sign-in failures persist across restarts', [
        '''CREATE TABLE IF NOT EXISTS sign_in_failures (email_sha256 TEXT NOT NULL, at REAL NOT NULL)''',
        'CREATE INDEX IF NOT EXISTS ix_sign_in_failures ON sign_in_failures (email_sha256, at)',
    ]),
]

# Kept for scripts that build a throwaway database without migrations bookkeeping.
SCHEMA = [sql for _, _, sqls in MIGRATIONS for sql in sqls]

_migrated: set[str] = set()
_lock = threading.Lock()


def migrate(conn: sqlite3.Connection) -> list[int]:
    """Apply pending migrations in order; returns the versions applied now."""
    conn.execute('''CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)''')
    done = {r[0] for r in conn.execute('SELECT version FROM schema_migrations')}
    applied = []
    for version, name, statements in MIGRATIONS:
        if version in done:
            continue
        with conn:
            for sql in statements:
                conn.execute(sql)
            conn.execute('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', (version, name))
        applied.append(version)
    return applied


def schema_version(conn: sqlite3.Connection) -> int:
    row = conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()
    return row[0] or 0


def db():
    """FastAPI dependency yielding a migrated connection (migrations run once per database file)."""
    from . import main
    with main.connect() as conn:
        key = str(main.STATE)
        if key not in _migrated:
            with _lock:
                if key not in _migrated:
                    migrate(conn)
                    _migrated.add(key)
        yield conn
