"""Accounts, organisations and roles. Off unless RL_AUTH=required.

Passwords: scrypt with a per-user salt. Sessions: random tokens, stored only as SHA-256 hashes, 12-hour
expiry. Failed sign-ins are rate-limited per email. Roles: admin > coordinator > learner.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import time
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import tenancy
from .storage import db

router = APIRouter(prefix='/api')
SESSION_SECONDS = 12 * 3600
ROLES = {'learner': 1, 'coordinator': 2, 'admin': 3}
EMAIL = re.compile(r'^[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,}$')
_failures: dict[str, deque] = defaultdict(lambda: deque(maxlen=10))
OPEN = ('/api/health', '/api/auth/signup', '/api/auth/login', '/docs', '/openapi.json')


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return f'scrypt${salt.hex()}${digest.hex()}'


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt, digest = stored.split('$')
        test = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(test.hex(), digest)
    except ValueError:
        return False


class Credentials(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    email: str = Field(max_length=254)
    password: str = Field(min_length=10, max_length=200)

    @field_validator('email')
    @classmethod
    def valid_email(cls, v: str) -> str:
        if not EMAIL.match(v):
            raise ValueError('Enter a valid email address')
        return v.lower()


class Signup(Credentials):
    org_name: str = Field(min_length=2, max_length=120)


class Member(Credentials):
    role: str = Field(pattern='^(learner|coordinator|admin)$')


def issue(conn, user_id: str, org_id: str) -> str:
    token = secrets.token_urlsafe(32)
    with conn:
        conn.execute('DELETE FROM sessions WHERE expires_at < ?', (time.time(),))
        conn.execute('INSERT INTO sessions VALUES (?,?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), user_id, org_id, time.time() + SESSION_SECONDS))
    return token


def resolve(conn, token: str | None) -> dict | None:
    if not token:
        return None
    row = conn.execute('''SELECT s.user_id, s.org_id, u.email, m.role, o.name FROM sessions s JOIN users u ON u.id=s.user_id
        JOIN memberships m ON m.user_id=s.user_id AND m.org_id=s.org_id JOIN orgs o ON o.id=s.org_id
        WHERE s.token_sha256=? AND s.expires_at > ?''', (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone()
    return {'user_id': row[0], 'org_id': row[1], 'email': row[2], 'role': row[3], 'org_name': row[4]} if row else None


async def auth_middleware(request: Request, call_next):
    """Sets the tenant for this request. With auth required, every non-open API route needs a valid session."""
    if not tenancy.auth_required():
        tenancy.set_context('local', None)
        return await call_next(request)
    path = request.url.path
    info = None
    header = request.headers.get('authorization', '')
    if header.lower().startswith('bearer '):
        gen = db()
        conn = next(gen)
        try:
            info = resolve(conn, header[7:].strip())
        finally:
            gen.close()
    if info is None and path.startswith('/api/') and not path.startswith(OPEN) and request.method != 'OPTIONS':
        return JSONResponse({'detail': 'Sign in required'}, status_code=401)
    tenancy.set_context(info['org_id'] if info else 'anonymous', info)
    return await call_next(request)


def require(role: str):
    """Dependency: in auth mode the caller must hold at least `role` in the current organisation."""
    def check():
        if not tenancy.auth_required():
            return
        u = tenancy.user()
        if u is None or ROLES[u['role']] < ROLES[role]:
            raise HTTPException(403, f'Needs the {role} role')
    return check


@router.post('/auth/signup')
def signup(x: Signup, conn=Depends(db)):
    if conn.execute('SELECT 1 FROM users WHERE email=?', (x.email,)).fetchone():
        raise HTTPException(409, 'An account with this email already exists')
    uid, oid = str(uuid.uuid4()), 'org-' + uuid.uuid4().hex[:12]
    with conn:
        conn.execute('INSERT INTO users (id, email, password_hash) VALUES (?,?,?)', (uid, x.email, hash_password(x.password)))
        conn.execute('INSERT INTO orgs (id, name) VALUES (?,?)', (oid, x.org_name))
        conn.execute('INSERT INTO memberships VALUES (?,?,?)', (oid, uid, 'admin'))
    tenancy.set_context(oid, {'email': x.email})
    tenancy.audit(conn, 'org.created', x.org_name)
    return {'token': issue(conn, uid, oid), 'org_id': oid, 'role': 'admin'}


@router.post('/auth/login')
def login(x: Credentials, conn=Depends(db)):
    recent = [t for t in _failures[x.email] if time.time() - t < 300]
    if len(recent) >= 5:
        raise HTTPException(429, 'Too many attempts. Wait five minutes and try again.')
    row = conn.execute('SELECT id, password_hash FROM users WHERE email=?', (x.email,)).fetchone()
    if row is None or not verify_password(x.password, row['password_hash']):
        _failures[x.email].append(time.time())
        raise HTTPException(401, 'Email or password is incorrect')
    m = conn.execute('SELECT org_id, role FROM memberships WHERE user_id=? ORDER BY role', (row['id'],)).fetchone()
    tenancy.set_context(m['org_id'], {'email': x.email})
    tenancy.audit(conn, 'auth.login', x.email)
    return {'token': issue(conn, row['id'], m['org_id']), 'org_id': m['org_id'], 'role': m['role']}


@router.post('/auth/logout')
def logout(request: Request, conn=Depends(db)):
    token = request.headers.get('authorization', '')[7:].strip()
    with conn:
        conn.execute('DELETE FROM sessions WHERE token_sha256=?', (hashlib.sha256(token.encode()).hexdigest(),))
    return {'ok': True}


@router.get('/auth/me')
def me():
    return {'auth_required': tenancy.auth_required(), 'org_id': tenancy.org(), 'user': tenancy.user()}


@router.get('/org/members', dependencies=[Depends(require('admin'))])
def members(conn=Depends(db)):
    rows = conn.execute('SELECT u.email, m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.org_id=? ORDER BY u.email', (tenancy.org(),))
    return [dict(r) for r in rows]


@router.post('/org/members', dependencies=[Depends(require('admin'))])
def add_member(x: Member, conn=Depends(db)):
    row = conn.execute('SELECT id FROM users WHERE email=?', (x.email,)).fetchone()
    with conn:
        if row is None:
            uid = str(uuid.uuid4())
            conn.execute('INSERT INTO users (id, email, password_hash) VALUES (?,?,?)', (uid, x.email, hash_password(x.password)))
        else:
            uid = row['id']
        conn.execute('INSERT OR REPLACE INTO memberships VALUES (?,?,?)', (tenancy.org(), uid, x.role))
    tenancy.audit(conn, 'member.added', f'{x.email} as {x.role}')
    return {'ok': True}


# ---------- Data rights ----------
TENANT_TABLES = ('studio_items', 'learner_progress', 'escalations', 'course_packages', 'ai_log')


@router.get('/account/export', dependencies=[Depends(require('admin'))])
def export(conn=Depends(db)):
    out = {t: [dict(r) for r in conn.execute(f'SELECT * FROM {t} WHERE org_id=?', (tenancy.org(),))] for t in TENANT_TABLES}
    out['audit_events'] = [dict(r) for r in conn.execute('SELECT * FROM audit_events WHERE org_id=? ORDER BY id', (tenancy.org(),))]
    tenancy.audit(conn, 'data.exported')
    return {'org_id': tenancy.org(), 'exported_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'data': out}


class DeleteRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    confirm: str


@router.post('/account/delete', dependencies=[Depends(require('admin'))])
def delete_all(x: DeleteRequest, conn=Depends(db)):
    expected = 'DELETE ' + tenancy.org()
    if x.confirm != expected:
        raise HTTPException(422, f'Type exactly: {expected}')
    with conn:
        counts = {t: conn.execute(f'DELETE FROM {t} WHERE org_id=?', (tenancy.org(),)).rowcount for t in TENANT_TABLES}
    tenancy.audit(conn, 'data.deleted', json.dumps(counts))
    return {'ok': True, 'deleted': counts}


@router.get('/account/audit', dependencies=[Depends(require('coordinator'))])
def audit_log(conn=Depends(db)):
    return [dict(r) for r in conn.execute('SELECT actor, action, target, at FROM audit_events WHERE org_id=? ORDER BY id DESC LIMIT 200', (tenancy.org(),))]
