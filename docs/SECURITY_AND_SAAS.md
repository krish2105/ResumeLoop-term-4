# Security review and threat model

Reviewed 2026-10-31 and updated 2026-11-01 against the code at this commit. ResumeLoop is a prototype: it runs on the owner's computer with a
fictional course, and the public Vercel link is a browser-only demo with no API behind it. Nothing here makes it safe to
store real learner records without the institution's approval.

## What is being protected
| Asset | Where it lives | Who should see it |
|---|---|---|
| Learner progress, notes, escalations | SQLite (`learner_progress`, `escalations`), scoped by `org_id` | The learner and their organisation's coordinators |
| Design-studio research (notes, interviews, consent) | SQLite studio tables, scoped by `org_id` | The project team in that organisation |
| Accounts and sessions | `users`, `memberships`, `sessions` | The account owner; admins see member lists |
| Course packages | `course_packages`, scoped by `org_id` | Coordinators of that organisation |
| AI decision log | `ai_log` (prompt hashes, never prompt text) | Coordinators |

## Trust boundaries
1. Browser ⇄ API (HTTP on localhost, or behind TLS if hosted).
2. API ⇄ Ollama on the same machine (no cloud model, no API keys).
3. Course text and pasted interview notes ⇄ the model: this content is data, never instructions.

## Threats and controls (STRIDE)
| Threat | Control | Evidence |
|---|---|---|
| **Spoofing**: guessing a password | scrypt (n=2^14) with a per-user salt; sign-in limit of 5 failures per email in 5 minutes (429), stored in SQLite by hashed email so a restart does not reset it | `app/auth.py`, migration 5, `tests/test_tenancy.py`, checked in Docker across a restart |
| **Spoofing**: stolen session token | Random tokens stored only as SHA-256 hashes; 12-hour expiry; logout deletes the session | `app/auth.py` |
| **Tampering**: two tabs overwriting progress | Optimistic version check, stale writes get 409 and the UI asks for a reload | `tests/test_planner.py`, smoke "Stale tab write is refused" |
| **Tampering**: invalid course packages | Pydantic schema, duplicate-id checks, prerequisite-graph validation, preview before import | `app/coordinator.py`, `tests/test_coordinator.py` |
| **Repudiation** | Audit log for imports, resets, member changes, escalation answers, export and delete | `app/tenancy.py`, `/api/account/audit` |
| **Information disclosure**: cross-tenant reads | Org id set per request from the session; every query filters by `org_id`, including the CSV review sandbox (`/api/demo/*`, scoped 2026-11-01); denial tests for each router | `tests/test_tenancy.py` |
| **Information disclosure**: cached learner data | API sends `Cache-Control: no-store`; the client fetches with `cache: 'no-store'` (Safari had served a stale GET after refresh) | `app/ops.py`, `tests/test_ops.py`, WebKit smoke |
| **Information disclosure**: personal data in research notes | Notes, observations and interviews reject emails and phone numbers; interviews need recorded consent before they become data | `app/studio.py`, `tests/test_studio*.py` |
| **Information disclosure**: logs | Access logs hold method, route, status and latency only; the AI log stores prompt hashes | `app/ops.py`, `app/ai/features.py` |
| **Denial of service**: oversized bodies | Requests over 1 MB are refused with 413 before routing; text fields have length caps | `app/ops.py`, `tests/test_ops.py` |
| **Elevation of privilege** | Roles admin > coordinator > learner enforced server-side with `require(role)` on coordinator and admin routes | `app/auth.py`, `tests/test_tenancy.py` |
| **Prompt injection** in questions or sources | Answers must cite retrieved passages; dates, durations and status words must appear in the cited text; abstain otherwise. 8 injection cases in the gold set, all safe | `app/ai/features.py`, `evidence/eval/coach-eval.json` |
| **Clickjacking, MIME sniffing, XSS impact** | Web: CSP (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy. API: `default-src 'none'` | `apps/web/next.config.mjs`, `app/ops.py` |
| **Broken sign-in flow (availability)** | CORS is the outermost middleware, so 401 and 413 responses carry CORS headers and the app can send a signed-out learner to sign in (before, the browser saw a blocked request) | `app/main.py`, `tests/test_tenancy.py` |
| **Container breakout impact** | Both images run as non-root users (`app`, `node`); the web image ships only Next's standalone server (441 MB, was 1.26 GB) | `services/api/Dockerfile`, `apps/web/Dockerfile` |
| **Unsafe external effects** | Nothing is emailed or sent. Escalations need learner approval, are idempotent per org, and stay in a local queue | `app/assist.py`, `tests/test_ai.py` |

## Dependency scans (2026-10-31)
- `pip-audit -r services/api/requirements.txt`: no known vulnerabilities.
- `npm audit` in `apps/web`: 0 vulnerabilities. CI runs `npm audit` on every push.

## Known gaps (not fixed, by design or by scope)
- CSP keeps `'unsafe-inline'` for scripts because Next.js inlines its bootstrap; a nonce setup would remove it.
- The 3D labels load glyph data from jsDelivr, so the CSP allows that one host.
- The body limit trusts `Content-Length`; a hosted deployment should also cap bodies at the proxy.
- No TLS, WAF, SSO, secrets manager, Postgres row-level security or external penetration test; the API is not hosted.
- The sign-in limit is per email, not per IP, so it does not stop slow password spraying across many accounts.
- Screen-reader testing is automated (axe) only; no VoiceOver or NVDA session has been run.

## Gates before any real data
1. Institution approval and a data agreement; minimise fields; set retention.
2. Host the API behind TLS with `RL_AUTH=required`, a proxy body limit and a persistent rate limiter.
3. Move to Postgres with row-level security mirroring the `org_id` filters; keep the denial tests.
4. Run a backup-and-restore drill (`scripts/backup_db.py`) and write the incident runbook.
5. Commission an independent security review.
