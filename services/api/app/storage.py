"""Shared SQLite access for the new feature modules. Reuses `main.connect` so tests that
override `main.STATE` isolate every table."""
SCHEMA = [
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
]


def db():
    """FastAPI dependency yielding a connection with every feature table present."""
    from .main import connect
    with connect() as conn:
        for statement in SCHEMA:
            conn.execute(statement)
        yield conn
