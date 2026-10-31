"""Request-scoped tenant. Set once per request by the auth middleware; every query filters by it.
Without RL_AUTH=required the app runs single-user in the 'local' organisation."""
import os
from contextvars import ContextVar

_org: ContextVar[str] = ContextVar('org', default='local')
_user: ContextVar[dict | None] = ContextVar('user', default=None)


def auth_required() -> bool:
    return os.environ.get('RL_AUTH') == 'required'


def org() -> str:
    return _org.get()


def user() -> dict | None:
    return _user.get()


def set_context(org_id: str, user_info: dict | None):
    return _org.set(org_id), _user.set(user_info)


def audit(conn, action: str, target: str = '') -> None:
    u = user()
    with conn:
        conn.execute('INSERT INTO audit_events (org_id, actor, action, target) VALUES (?,?,?,?)',
                     (org(), (u or {}).get('email', 'local'), action, target[:200]))
