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
