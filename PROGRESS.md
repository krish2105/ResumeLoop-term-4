# ResumeLoop progress and run guide

Updated **23 October 2026**. Term starts **10 November 2026**. Solo developer; default allocation **4 hours/week** from 20 hours shared across five projects. Cross-account continuation instructions are in [`NEW_ACCOUNT_HANDOFF.md`](NEW_ACCOUNT_HANDOFF.md).

## 1 November 2026 (later): five build batches

Engineering hardening, AI evaluation with CI replay, MVP (coordinator course import, learner profiles, insights, calendar export, offline), course extras (slide deck, viva practice, faculty email) and SaaS foundations (accounts, organisations, roles, tenant isolation, audit, export and delete, privacy, Docker). Scores in [`docs/SCORECARD.md`](docs/SCORECARD.md).

- Accounts are off by default. Turn them on with `RL_AUTH=required` on the API (then visit `/login`). `RL_CORS_ORIGINS` sets allowed web origins.
- Backup: `PYTHONPATH=services/api .venv/bin/python scripts/backup_db.py backup` (restore with `restore <file>` while the API is stopped).
- Load test: `PYTHONPATH=services/api .venv/bin/python scripts/load_test.py`. Metrics: `http://127.0.0.1:8014/api/metrics`.
- Self-host with accounts: `docker compose up --build` (Docker images not yet test-built on this machine).

## 1 November 2026: everything buildable for the outline

New screens: **Readings and quizzes** (`/learn`), **Research ops** (`/studio/research`), **Synthesis board** (`/studio/synthesis`), **Evidence report** (`/report`), a paper assembler in the Reflection journal, a sign test in the Experiment lab, and a **Coach evaluation** panel in Ethics. AI facts guard added after the evaluation caught an injected date. CI now runs the browser suite. Scores and the honest ceiling are in [`docs/SCORECARD.md`](docs/SCORECARD.md).

Run the coach evaluation (Ollama required): `PYTHONPATH=services/api .venv/bin/python scripts/eval_coach.py`, then `PYTHONPATH=services/api .venv/bin/python scripts/export_demo_fixtures.py`.

## 31 October 2026 (evening): Ember dusk redesign and outline-aligned screens

The owner chose the **Ember dusk** palette after comparing four contrast-checked options. Changes:
- **Design system:** one warm-graphite hue family (`#121011`/`#1B1719`/`#262023`), ember accent `#FF8E6B` dark / `#B5401F` light, every text pair ≥ 4.5:1 in both themes (`app/theme.css`); Bricolage Grotesque display, Instrument Sans body, IBM Plex Mono data.
- **Resizable layout:** WAI-ARIA splitters (drag, arrow keys, Home/End, Enter to collapse, double-click to reset, width remembered) for the sidebar, the road panel and the story panel.
- **Journey redesign:** the canvas has its own area and the budget, selected task and star list live in a side panel, so nothing covers the road. 3D rebuilt: ember ribbon with the travelled stretch lit, halo-sprite stars, selective bloom in dark mode, prerequisite lines only for the focused task, at most two labels drawn on top and beside their star, adaptive resolution.
- **New screens mapped to the outline:** Observe (extreme/mainstream/analogous observations, evidence-linked personas), Define (point-of-view statements, 6-frame storyboard), Envision (IBM-style Hills who/what/wow, what-if scenarios), Ideate gains a timed Crazy 8s round, Journey maps (current vs future, feeling curve), Prototype log (versions with I like / I wish / question / what if feedback), Ethics gains an AI risk register (likelihood × impact) and governance role-play, Reflection journal (§3.5 three-part template, AI-use disclosure, Markdown download, never AI-written), Course hub (assessment weights with unverified dates, 16-criterion rubric self-check, team contribution matrix, SDG impact canvas). Story mode counts evidence from all of them.
- **Verification:** 80 pytest; browser smoke **109/109** (live Ollama); axe **80 scans, 0 violations** (20 routes × light/dark × 1440/320px). Runs found and fixed: journey maps vanishing (a body field shadowed the collection name), stale select values in forms, four 320px overflow causes, risk-matrix ARIA structure, an unfocusable scrolling strip.
- **Deployment:** the Vercel project now builds from `apps/web` on every push to `main` (the earlier red ✗ was the repo root being built).
- **CI:** `.github/workflows/ci.yml` runs API tests, fixture reproducibility, typecheck, planner parity, live and demo builds and `npm audit` on every push.
- **Scorecard:** honest scores from seven perspectives and the path to 85+ are in [`docs/SCORECARD.md`](docs/SCORECARD.md).
- **Later fixes the same evening:** side panel no longer clips its cards, calmer type scale, 3D labels keep a constant on-screen size, story mode labels only the active stop, speaker notes per stop.

## 31 October 2026 build: spatial journey prototype

**Public demo (fictional data, recorded AI answers): https://resumeloop-demo.vercel.app** · design spec: [`docs/superpowers/specs/2026-10-31-resumeloop-spatial-journey-design.md`](docs/superpowers/specs/2026-10-31-resumeloop-spatial-journey-design.md)

| Area | Status | What exists |
|---|---|---|
| 3D night road (`/`) | Built, browser-checked | React Three Fiber road; one star per course task; time-budget slider re-plans live; dawn theme in light mode; reduced-motion and no-WebGL fallbacks; accessible star list beside the canvas |
| List view (`/plan`) | Built | Same plan as an accessible table with reasons, checkboxes and reset |
| Planner | Fixed and tested | Typed, versioned fictional course; completed tasks never reselected; unlocked dependents scheduled; duplicate/unknown/cyclic prerequisites rejected; unknown durations abstain; TypeScript copy matches Python on 60/60 cases |
| Progress autosave | Built, tested | Version-checked saves (stale tab → 409 and reload prompt) |
| What changed (`/digest`) | Built, live AI checked | Code computes the v1 → v2 changes; local `qwen2.5:7b` rephrases; skipped facts are added back verbatim |
| Coach (`/coach`) | Built, live AI checked | `bge-m3` retrieval over fictional notes; answers must cite retrieved passages or abstain; offline fallback quotes the closest passage |
| Coordinator queue (`/escalations`) | Built, tested | AI drafts, learner edits and approves, idempotent local queue; nothing is ever sent |
| Empathy studio | Built, live AI checked | Consent-gated notes, privacy guard, AI code suggestions that must quote the note exactly and need accept/reject, empathy map, themes |
| Ideate | Built | How might we (AI suggestions + manual), ideas, one vote per person, 3-alternative scoring matrix |
| Experiment lab | Built, tested | Protocol freeze with SHA-256, AB/BA order, timed task recorder, medians/ranges/paired differences, chart |
| Ethics and governance | Built | Model card, human-in-the-loop counts, consent overview, AI decision log (prompts stored as hashes) |
| Story mode (`/story`) | Built, browser-checked | Six-stop 3D presentation (Empathise → Impact · SDG 4) with live evidence counts; fictional items never count |
| Public demo | Deployed | Vercel project `resumeloop-demo`, `NEXT_PUBLIC_DEMO_MODE=1`, edits stay in the visitor's browser |

**Browser and accessibility automation (31 Oct, rewritten for the new routes):** `scripts/browser-smoke.js` → **71/71 checks** on a production build with live Ollama (journey, autosave, stale-tab refusal, list view, digest, coach citations and abstention, approval-gated queue, consent and privacy guards, exact-quote codes, HMW rule, one vote per person, protocol freeze, session timer, story keyboard navigation, imports, review, themes, mobile menu, no overflow on 10 routes at 320/768/1440px, no hydration errors). `scripts/accessibility-smoke.js` → **52 axe scans, 0 violations** (13 routes × light/dark × 1440/320px, reduced motion). Summaries: `evidence/2026-10-31/`. These runs found and fixed three 320px overflow bugs, a 4.3:1 banner contrast and unfocusable scrolling tables.

Still not done: real fieldwork and participants, real usability sessions, faculty confirmation of dates/group/frameworks, screen-reader and Safari/Firefox testing, a manual contrast check of text over the 3D canvas, auth/tenancy.

## How much is done (22 October milestone)

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

**Local AI (optional, recommended):** install [Ollama](https://ollama.com), then `ollama pull qwen2.5:7b` and `ollama pull bge-m3:567m`. Without Ollama the app still works: the digest uses its fixed text, the coach falls back to keyword search and quotes the closest passage, and code suggestions are disabled. Override models with `RL_GEN_MODEL`, `RL_EMBED_MODEL` and `OLLAMA_URL`.

**Demo data scripts (from the project root):** `PYTHONPATH=services/api .venv/bin/python scripts/record_demo_ai.py` records real local-model answers on fictional data; `PYTHONPATH=services/api .venv/bin/python scripts/export_demo_fixtures.py` rebuilds `apps/web/demo/fixtures.json`; `cd apps/web && npm run test:parity` checks the TypeScript planner against Python. Demo build: `NEXT_DIST_DIR=.next-demo NEXT_PUBLIC_DEMO_MODE=1 npm run build`. Deploy: pushing to `main` builds the demo on Vercel automatically (project root `apps/web`, `NEXT_PUBLIC_DEMO_MODE=1` set in project env). A manual CLI deploy must now be run from the repository root.

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
npx --yes --package @playwright/cli playwright-cli --session resumeloop run-code "$(sed "s#AXE_PATH#/tmp/resumeloop-browser-tools/node_modules/axe-core/axe.min.js#" scripts/accessibility-smoke.js)"
```

Run these browser commands from the project root with both services running, ideally the API on a fresh `DEMO_DB_PATH` and a production frontend build (`npm run build && npm run start`). The smoke script expects an empty database (it checks one vote per person). They create synthetic test records and saved reviews; use an isolated `DEMO_DB_PATH` when preserving a demo database matters. Browser installation may be required by Playwright on a clean machine. Cross-platform browser setup has not been verified.

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
