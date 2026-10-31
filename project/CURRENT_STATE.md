# Current verified state — ResumeLoop

Last updated: **23 October 2026**. User requested a complete cross-account continuation package and publication to `https://github.com/krish2105/ResumeLoop-term-4`. **`PROGRESS.md`** remains the status/run authority; **`NEW_ACCOUNT_HANDOFF.md`** and **`prompts/10_NEW_ACCOUNT_HANDOFF.md`** provide the transfer checklist and paste-ready prompt.

## 1 November 2026 — remaining outline features, AI evaluation, CI browser suite (latest)

**VERIFIED:** 83 pytest pass (new: readings seed, Leitner review, interview consent gate and conversion, facts guard). Coach evaluation on qwen2.5:7b + bge-m3:567m: answer 95%, citation hit 100%, abstain 100%, injection-safe 100% (was 67% before the facts guard; the eval caught the model repeating an injected date). Evidence: `evidence/eval/coach-eval.json`.

**Built:** `/learn`, `/studio/research`, `/studio/synthesis`, `/report`, paper assembler, sign test, `CoachEval` panel, five new typed collections, CI `browser` job (no Ollama, fallback paths).

**UNTESTED / open:** first run of the CI browser job; VoiceOver, Safari/Firefox, phones; real fieldwork. Not production-ready.

## 31 October 2026 evening — Ember dusk redesign and outline screens

**User steering:** dark mode looked AI-made; sidebar should be drag-resizable; the star list overlapped the 3D road; 3D looked low quality; audit the outline and add what is missing; remove the AI assistant from the contributor list.

**VERIFIED:** history has 0 AI co-author trailers and the GitHub contributors API lists only `krish2105`; the extra sidebar entry is GitHub's cache of the deleted commit. Vercel red ✗ was the repo-root build; project root set to `apps/web` with `vercel project update --root-directory apps/web --yes`. Palette Ember dusk chosen from four options whose pairs were computed (all ≥ 4.5:1). 80 pytest pass. Browser smoke 109/109 and axe 80 scans / 0 violations on a production build with a throwaway DB and live Ollama (see `evidence/2026-10-31/`).

**Changed:** `app/theme.css`, `app/screens.css` (new), tokenised `globals.css`/`journey.css`, `components/Splitter.tsx`, `components/scene/primitives.tsx`, rewritten `NightRoad.tsx`, `StoryScene.tsx`, journey and story pages, `AppShell.tsx` (resizable, new nav), new pages `studio/observe|define|envision|journeys|prototypes`, `reflect`, `course`, components `QuickForm`, `CrazyEights`, `RiskRegister`; backend `studio.py` (17 new typed collections, course-hub seed, metadata-wins serialisation); tests `test_studio_outline.py`; smoke/axe scripts extended.

**Follow-up fixes:** right panel clipping (grid column now `minmax(0,1fr)`), smaller type scale, constant-pixel 3D labels (`ScreenLabel`), story labels only for the active stop, speaker notes, plural wording, GitHub Actions CI, `docs/SCORECARD.md` (overall ≈ 60/100; academic score limited by missing real fieldwork).

**UNTESTED / open:** VoiceOver/NVDA, Safari/Firefox, phones, manual contrast over the 3D canvas, first CI run result (check after push). No real participants, sessions or faculty answers. Not production-ready.

## 31 October 2026 build — spatial journey prototype

Owner chose option C (full 3D journey, night-road art), all ten features, local Ollama AI, and a public Vercel demo. Spec: `docs/superpowers/specs/2026-10-31-resumeloop-spatial-journey-design.md`. Commits `14cf41e` → `abdcf34` (+ this documentation commit) pushed to `origin/main`; no AI co-author trailers.

**VERIFIED (commands run this session):**
- `PYTHONPATH=services/api .venv/bin/python -m pytest -q services/api/tests` → **54 passed** (planner, progress, AI validators with a fake LLM, escalations, studio).
- `npm run test:parity` → **60/60** TypeScript planner cases match Python. `npm run typecheck` passes. Live build (`NEXT_DIST_DIR=.next-live`) and demo build (`NEXT_PUBLIC_DEMO_MODE=1`) → 16/16 static pages. `npm audit` → 0 vulnerabilities. `pip-audit` was **not run** (not installed in this venv).
- Live Ollama (`qwen2.5:7b`, `bge-m3:567m`): digest grouped 7 changes (1 skipped change re-added); coach cited [S3-p2]/[S3-p1] and abstained on a grade-extension question; code suggestions kept exact quotes and auto-rejected invalid ones. `scripts/record_demo_ai.py` recorded these for the demo.
- Built-in browser: 3D road renders, Mark complete saves (version 1) and re-plans; coach answers live; empathy studio loads fictional examples and AI suggestions; story mode advances with arrow keys; Vercel demo serves `/`, `/story`, `/coach` (200) and shows recorded answers labelled with model and date.
- Bug found and fixed: SQLite cross-thread error under real uvicorn (tests had not caught it) → `check_same_thread=False` with one connection per request.

**Changed/new files:** backend `course.py`, `planner.py`, `learning.py`, `storage.py`, `assist.py`, `studio.py`, `ai/llm.py`, `ai/retrieval.py`, `ai/features.py`, `main.py`; tests `test_planner.py`, `test_ai.py`, `test_studio.py`; data `fictional_course.json`, `fictional_studio.json`, `recorded_ai.json`; scripts `export_demo_fixtures.py`, `record_demo_ai.py`; frontend `components/` (AppShell, NightRoad, StoryScene, JourneyBits, StudioBits, AiBadge, LocalOnly), `lib/` (client, planner, assist, studio, stats, road, types, useJourney), all routes under `app/`, `journey.css`, `next.config.mjs`, `demo/fixtures.json`, `.vercelignore`.

**Browser + accessibility automation (later on 31 Oct):** rewrote `scripts/browser-smoke.js` (71/71 checks, live Ollama, production build, throwaway DB) and `scripts/accessibility-smoke.js` (52 axe scans, 0 violations; manual review left: contrast of text over the WebGL canvas). Fixed: grid overflow at 320px on coach, empathy and ideate; change-banner contrast 4.3:1; scrolling tables now focusable regions; prohibited aria-label on the vote count. Evidence: `evidence/2026-10-31/`, screenshots `output/playwright/journey-*.png`, `story-desktop.png`, `empathy-desktop.png`.

**UNTESTED / open:** screen readers, Safari/Firefox, real phones, manual contrast over the 3D canvas, cross-tab demo storage, Ollama on other machines. No real participants, sessions or faculty answers; studio evidence counts are zero real items. Not production-ready.

**Next runnable task:** owner sends faculty questions (groupmates, solo permission, dates, frameworks, ethics). Engineering: manual screen-reader pass (VoiceOver) on the journey, coach and empathy studio; Safari check.

## 31 October 2026 update — outline re-check and priority ranking (documentation only)

- Re-verified from this checkout: `git status` clean and `HEAD` equal to `origin/main` (`d6cffe2`) at session start; `pytest` **24 passed** (1 httpx deprecation warning); `domain_example()` selects recap + exercise (40/45 minutes); `npm run typecheck` passed. Production build, the 23 browser checks, accessibility scans and dependency audits were **not rerun** and remain 22 October evidence.
- `~/Downloads/Design Thinking Dr Chris Abraham MAIB 2026.docx` is byte-identical to `course/outline.docx` (SHA-256 `9dc24437…4d00cf`); no new requirements.
- `docs/ASSESSMENT.md` now records two findings the docs lacked: the Week 12 presentation is about UN SDGs (SDG 4 framing proposed, unconfirmed), and participation plus individual work (20%) are in-class quizzes that software cannot earn.
- `project/BLOCKERS.md` now ranks blockers by marks at stake: groupmates/solo permission/dates, then research permission, then the planner fix. `project/NEXT_ACTIONS.md` and `project/DECISIONS.md` carry the same order.
- No application code changed. No faculty message was sent; groupmates, dates and AI-use policy remain unknown.

## Cross-account handoff milestone

- Added a two-route attachment checklist: repository URL for an account with GitHub access, or the GitHub source ZIP when direct access is unavailable.
- The authorized original `course/outline.docx` must be attached separately in a private workspace because it is intentionally excluded from the public repository.
- The continuation prompt requires fresh Git/test/build verification, course-rubric review, M1 planner/schema work, authentic-research rules, and the mandatory exit protocol.
- No application source or behavior changed in this documentation-only milestone. Previously recorded application test/build/browser results were not rerun and remain historical evidence dated 22 October 2026.
- Changed files in this milestone: `NEW_ACCOUNT_HANDOFF.md`, `prompts/10_NEW_ACCOUNT_HANDOFF.md`, `README.md`, `PROGRESS.md`, `project/SESSION_PLAN.md`, `project/CURRENT_STATE.md`, `project/SESSION_LOG.md`, `project/DECISIONS.md`, `project/BLOCKERS.md`, and `project/NEXT_ACTIONS.md`.
- Documentation validation commands and their observed results are recorded in the 23 October entry of `project/SESSION_LOG.md`.
- The commit containing this entry is the user-authorized cross-account handoff publication. Verify its identity with `git rev-parse HEAD` and `git ls-remote origin refs/heads/main`; do not rely on a self-referential hash in this file.

## Publication status
Initial project commit `29dfb5c6e20659ced07cf12736a6ddc1cdf63c6c` was pushed to the public GitHub repository's `main` branch on 22 October 2026. `git ls-remote` returned the identical SHA and GitHub reports `main` as the default branch. No force push was used. This final continuity update is a follow-up commit.

## Completed and verified this session
- Original ZIP located beside the project, extracted separately, all 58 files byte-matched to the starting workspace. Original course DOCX retained unchanged locally. Baseline hashes saved.
- Read original outline and every specification/source file. Confirmed 10/10/40/40 assessment weights, conflicting participation/group schedules, erroneous reflection section cross-reference and lack of a model-training requirement. Exact dates and solo permission remain unknown.
- Installed Python/frontend dependencies. Baseline: **6 passed**, synthetic recap + exercise = 40/45 minutes, frontend build passed with CSS warnings.
- Implemented M0 source/import validation slice: strict typed schema, exact cells/headers, no missing-field defaults, row-level errors, write-free preview, atomic row/receipt transaction, original CSV + normalized snapshot, SHA-256, schema version, history/detail routes, identical retry no-op, reviewed-status preservation.
- UI supports input → validation/error → correction → preview → explicit save → receipt → return. Import drafts persist on the same device; storage/network failures are visible. Keyboard focus moves to validation/error/save result. Planned screens no longer masquerade as working specialist views.
- Preserved review/search/filter functionality. Rejected whitespace-only notes. Added robust theme restoration, field contrast, skip link and mobile import styling.
- Generated and inspected one notebook/waypoints illustration using supplied prompt 02; saved original and served copy. Other illustration prompts remain unimplemented.
- Created original research kit and **empty** consent/interview/observation/empathy/journey/usability instruments. No participants or research findings invented.
- Reconciled generic ML instructions with Design Thinking requirements. Created detailed audit and single root progress/run guide.
- Added npm lockfile and Python resolved-version lock. Patched PostCSS via override; npm and Python advisory scans report **zero known vulnerabilities** at scan time.

## Actual execution and evidence
| Command/check | Observed outcome |
|---|---|
| `git status --short` at start | No Git repository; baseline compared with ZIP instead |
| `PYTHONPATH=services/api .venv/bin/python -m pytest -q services/api/tests` | Baseline 6 passed; milestone **24 passed**, 1 TestClient/httpx deprecation warning |
| `domain_example()` / `/api/demo/domain` | Deterministic synthetic recap + exercise; no trained AI |
| `npm run build` / `npm run typecheck` in apps/web | Production build and TypeScript checks passed; original CSS warnings fixed |
| `npm audit --json` | Initial 1 high + 1 moderate via PostCSS; final 0 |
| `pip-audit -r services/api/requirements.lock.txt` and `pip check` | 0 known vulnerabilities; no broken requirements |
| Playwright CLI `scripts/browser-smoke.js` on built application | **23 checks passed**, including lost save response/retry, drafts, history, reviews, themes, keyboard and 320/390/768/1440px overflow checks |
| Playwright CLI + axe `scripts/accessibility-smoke.js` | Light/dark at desktop/320px; scope and remaining manual checks in published accessibility summary |
| `/api/health` on 8014 | `ok:true`, mode `LOCAL_SYNTHETIC_DEMO` |
| GitHub publication | Initial SHA `29dfb5c6e20659ced07cf12736a6ddc1cdf63c6c` matched `origin/main`; GitHub default branch `main` |

Full raw logs remain local under `evidence/2026-10-22/`; sanitized verification, browser/accessibility summaries and original checksums are published. Screenshots under `output/playwright/`. Original failed browser attempts are retained locally: selector mismatch, focus loss (fixed), and latest-receipt selection in the harness (corrected). A final 320px screenshot exposed grid-item expansion from the preview table; the import panels now set `min-width: 0`, and the strengthened browser check passed after waiting for resized layouts to settle. Transient theme scans were rerun after styles settled. See `docs/AUDIT_2026-10-22.md` for findings.

## Run now
Use root `.venv`. API: `PYTHONPATH=services/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`. Frontend: `npm run dev -- --hostname 127.0.0.1` in `apps/web`, with `.env.local` copied from `.env.example`. Open `http://127.0.0.1:3000`. The existing port-8000 service belongs to something else and was not stopped. Verified environment: Python 3.14.7, Node 26.10.0, macOS arm64.

At handoff the local API and production-style frontend were started for inspection. If unavailable in a later session, restart using the commands above; do not assume background processes survive. Avoid running dev and build simultaneously in the same `.next` directory.

## Changed/new files
- Backend: `services/api/app/main.py`, new `imports.py`, new `tests/test_imports.py`, resolved `requirements.lock.txt`.
- Frontend: `app/page.tsx`, `app/globals.css`, new `app/ImportPanel.tsx`, package/lock files, `.env.example`, generated image served under `public/images/`.
- Research: `research/STUDY_KIT.md`, four header-only CSV templates and their README; source register updated.
- Documentation: `PROGRESS.md`, README/START_HERE, audit, assessment/pipeline/test/architecture/sources, experiments prompt, all continuity files and session plan.
- Evidence/tools: two browser scripts, sanitized evidence, screenshots, generated asset + exact prompt. Full source-hash comparison remains local.
- `.gitignore`: excludes private curriculum/extracted text, real data, local DB, environment, dependencies/builds and machine logs. Original private course source is absent from a fresh public clone by design.

## Blockers and untested scope
No approved participants or official course data; no confirmed assessment dates/solo permission. No auth, tenant isolation, real deadlines, coordinator messaging, personal plans or learner-progress persistence. Baseline planner wrongly reselects completed actions and can skip dependents; reproduced in local `domain-audit.json` and not repaired in this import slice. Review-note drafts can still carry across records and do not autosave. Real-user benefit, commercial demand, screen readers, Safari/Firefox, cross-tab synchronization, load/security penetration tests, backup restore and non-macOS setups are untested. Automated accessibility checks do not certify WCAG compliance. No production-ready claim.

## Next runnable task
Read `PROGRESS.md` and `project/NEXT_ACTIONS.md`. Define a typed synthetic course-action schema and fix planner completed/prerequisite handling with negative and boundary tests. Then build learner time budget → feasible plan → saved progress → resume as one vertical slice. Faculty/research permissions can proceed separately. Do not add ML, billing or external integrations yet.
