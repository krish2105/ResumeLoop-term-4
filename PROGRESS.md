# ResumeLoop progress and run guide

Updated **22 October 2026**. Term starts **10 November 2026**. Solo developer; default allocation **4 hours/week** from 20 hours shared across five projects.

## How much is done

**Milestone M0 is implemented: the starter was audited and one complete synthetic import-to-saved-outcome journey was built and tested.** This is a working local research prototype. It is not a complete learner-recovery product or production SaaS. A percentage of the whole SaaS would be misleading because the research has not yet validated the scope.

| Area | Status | What exists |
|---|---|---|
| Starter restoration | Complete | All 58 ZIP files verified against the initial workspace; original preserved |
| Course/rubric audit | Complete, faculty questions open | 10/10/40/40 weighting and outcomes mapped; conflicting schedules flagged |
| Frontend/backend baseline | Verified locally | Next.js/React/TypeScript, FastAPI/Pydantic, SQLite |
| Synthetic import journey | Implemented and tested | Paste/sample/template → typed validation → row errors → preview → explicit save → receipt → return |
| Provenance and retry safety | Implemented and tested | Original-input SHA-256, source snapshot, schema version, atomic transaction, duplicate retry protection |
| Existing review queue | Preserved and tested | Search, status filter, rationale and saved review; imports preserve reviewed statuses |
| Draft/session recovery | Partial | Import drafts restore on the same browser; personal study sessions and review-note drafts remain to build |
| UI/accessibility | Improved, partial verification | Light/Dark/System, mobile import layout, focus/error feedback, honest planned states, one generated illustration |
| Research preparation | Complete for first round | Consent guidance, interview/observation guides, empathy/journey structures, blank CSV instruments, usability protocols |
| Authentic research and product benefit | Not done | No interviews, observations, participant usability results or measured learning improvement |
| Personal recovery plans and progress | Not done | Only a deterministic sample calculation; two planner defects are documented |
| Official deadlines / coordinator support | Not done | No authorized calendar connector, deadline verification or messaging |
| Production SaaS | Not done | No authentication, tenant isolation, billing, deployment, backup validation or real-data onboarding |

## Verified checks

- Original baseline: **6 tests passed**; synthetic calculation selected recap + exercise, totaling 40 minutes within a 45-minute budget.
- After implementation: **24 API/unit tests passed**, including invalid-batch atomicity, row limits, malformed input, concurrent retries, reviewed-status preservation and injected database failure rollback.
- Production frontend build and TypeScript checks passed.
- **23 browser checks passed on the built application**, including error correction, save/return, lost-response retry, draft restoration, theme persistence, keyboard focus, review persistence and no page overflow at 320/390/768/1440px.
- Final dependency scans: **0 known npm vulnerabilities**, **0 known Python dependency vulnerabilities** at scan time. A transitive PostCSS issue was patched without changing the Next.js major version.
- Accessibility checks and manual limits are recorded in `evidence/2026-10-22/accessibility-summary.json`. These are engineering checks, not a claim of WCAG conformance or participant-verified usability.

Published summaries are in `evidence/2026-10-22/`. Full local command logs are intentionally excluded from Git. Screenshots contain synthetic data only. The Python TestClient currently emits a deprecation warning about httpx; the tests pass.

## Run locally

Verified environment: **macOS arm64, Python 3.14.7, Node 26.10.0, npm 11.19.1**. Other operating systems/runtime versions have not been verified. No API key or paid cloud service is required for the demo.

Clone and install from a terminal:

```bash
git clone https://github.com/krish2105/ResumeLoop-term-4.git
cd ResumeLoop-term-4
python3 -m venv .venv
.venv/bin/python -m pip install -r services/api/requirements.lock.txt
cd apps/web
npm ci
cp .env.example .env.local
```

The example configuration points to `http://127.0.0.1:8014`. Port 8000 was already used by another service on the original development machine. Both commands below bind to localhost. Do not expose this unauthenticated demo publicly.

**Terminal 1, from the project root:**

```bash
PYTHONPATH=services/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014
```

**Terminal 2, from the project root:**

```bash
cd apps/web
npm run dev -- --hostname 127.0.0.1
```

Open **http://127.0.0.1:3000**. API documentation: **http://127.0.0.1:8014/docs**. Health check: **http://127.0.0.1:8014/api/health**. Stop either service with Ctrl+C in its terminal.

If choosing another API port, update `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` and restart/rebuild the frontend. If choosing another frontend port, update the explicit development CORS origin allowlist in `services/api/app/main.py`; never use a wildcard as a substitute for authentication.

For a production-style local build, stop the development frontend first, then from `apps/web`:

```bash
npm run build
npm run start -- --hostname 127.0.0.1
```

The build is still the synthetic prototype. “Production build” does not mean production-ready SaaS.

## Try the working journey

1. Open **Imports**, choose **Use sample CSV**, then **Preview & validate**.
2. Inspect every row and choose **Save synthetic import**. The receipt shows created/updated totals, source version and SHA-256.
3. Refresh, open **Imports**, and retrieve the receipt from **Import history**. Your draft also restores on that browser.
4. Preview and save the same input again. The original receipt returns without repeating writes.
5. Add an extra CSV cell or remove a required field. Preview reports row/field errors and saves nothing; correct the input and retry.
6. On **Overview**, search for the imported task, enter a demo rationale and save a review. Refresh to verify its status.
7. Switch Light/Dark/System. Recovery plans and coordinator support are labeled as planned, rather than pretending those features are implemented.

Local SQLite state is in `services/api/.state/demo.sqlite3` (ignored by Git). `DEMO_DB_PATH` can point the API to a separate SQLite file for an isolated demo. Browser import drafts are stored in localStorage; **Clear draft** removes them. Clearing a draft does not delete imported database records. Do not paste real learner or institutional data.

## Run checks

From the project root:

```bash
PYTHONPATH=services/api .venv/bin/python -m pytest -q services/api/tests
cd apps/web
npm run typecheck
npm run build
npm audit
```

Browser scripts in `scripts/browser-smoke.js` and `scripts/accessibility-smoke.js` are runnable through Playwright CLI (not `@playwright/test`). Install tooling separately if required:

```bash
npm install --prefix /tmp/resumeloop-browser-tools axe-core
mkdir -p output/playwright
npx --yes --package @playwright/cli playwright-cli --session resumeloop open http://127.0.0.1:3000
npx --yes --package @playwright/cli playwright-cli --session resumeloop run-code "$(cat scripts/browser-smoke.js)"
npx --yes --package @playwright/cli playwright-cli --session resumeloop run-code "$(cat scripts/accessibility-smoke.js)"
```

Run these browser commands from the project root with both services running. They create synthetic test records and saved reviews; use an isolated `DEMO_DB_PATH` when preserving a demo database matters. Browser installation may be required by Playwright on a clean machine. Cross-platform browser setup has not been verified.

## Remaining end-to-end work, in order

### M1 — trusted course actions and discovery
1. Confirm faculty assessment dates, solo/group rules and research permissions. Keep deadlines unverified until a source owner confirms them.
2. Obtain voluntary consent and conduct the first discovery interviews/observations. Populate the blank instruments only with authentic evidence.
3. Define a versioned course-action contract: source owner/version, action IDs, prerequisites, durations, last completed session, deadline timezone, verification state and source reference. Unknown values must stay unknown.
4. Fix the deterministic planner: exclude completed actions, resolve prerequisites consistently, reject duplicate/unknown/cyclic dependencies, and test insufficient/zero budgets and missing fields.
5. Continue with synthetic fixtures until rights, privacy and security gates permit actual course data.

### M2 — complete the learner recovery journey
1. Learner enters available time and last completed session.
2. Validated source produces a feasible, explainable next-action plan; uncertainty and deadline conflicts are visible.
3. Learner edits the budget, chooses an action, saves progress and resumes after refresh/interruption without loss.
4. Build a source-backed timeline and explicit deadline verification, plus a local clarification queue. External messages require an explicit human gate and idempotency.
5. Add full-journey tests, accessible error/empty/loading/success states and mobile/keyboard verification. Fix cross-record review-note carryover and add draft restoration for notes.

### M3 — authentic Design Thinking evaluation
1. Synthesize interviews into evidence-linked themes, empathy maps and current journeys; preserve contradictory cases.
2. Co-design alternatives with actual people. Compare an improved LMS checklist, coordinator brief and ResumeLoop rather than assuming a new SaaS is necessary.
3. Freeze scenarios, answer keys, metrics, order and exclusions before comparison. Test the existing workflow against the functioning recovery prototype.
4. Record task success, time-to-next-action, errors, source comprehension and participant feedback; separate rounds and disclose sample limitations.
5. Iterate, retest, prepare the academic report/presentation, and write the student's own reflection using real experiences. No model training is mandatory for this unit.

### M4 — permissioned pilot
1. Authentication, organizations, roles and tested tenant isolation.
2. Authorized course onboarding, retention/deletion controls, secure storage, audit events, backup/restore and monitoring.
3. Named pilot sponsor, consented participants, agreed measures, support process and approved data access.
4. Verify usefulness, repeat use, accessibility and operational reliability before expanding scope.

### M5 — commercial SaaS, only if evidence supports it
Authorized integrations/SSO, durable jobs and quotas, security review, deployment/rollback, incident support, measured costs, buyer validation, pricing, billing and tested second-tenant onboarding. No revenue or product-market-fit claims exist today.

## Known limits and handoff

No real research findings, official course dates, trained model, authenticated users, tenant security, customer data onboarding or public deployment exist. Safari/Firefox, screen readers, cross-device draft sync, load testing, backup restore and other runtime platforms remain untested. Research preparation is not research completion.

The repository is public. The supplied curriculum DOCX, extracted curriculum text, local database, local environment configuration and full machine logs remain local and ignored. For private academic work, restore your authorized original outline to `course/outline.docx`; its checksum is in the original starter evidence. Do not publish it without permission. The original external ZIP also remains outside the repository.

Read `project/CURRENT_STATE.md`, `project/NEXT_ACTIONS.md`, `project/DECISIONS.md`, `project/BLOCKERS.md` and `project/SESSION_LOG.md` before continuing. The detailed audit is `docs/AUDIT_2026-10-22.md`; research preparation is `research/STUDY_KIT.md`.

**Next runnable task:** define/test the synthetic course-action schema and repair prerequisite/completed-action scheduling, then build saved learner plans as the next vertical slice. Keep one slice per approximately four-hour session.
