# ResumeLoop — Design Thinking (MAIB MGT 204)

**Current handoff:** [PROGRESS.md](PROGRESS.md) contains completed work, verified checks, the remaining end-to-end roadmap and setup/run instructions. For a different ChatGPT/Codex account, use [NEW_ACCOUNT_HANDOFF.md](NEW_ACCOUNT_HANDOFF.md) and the copy-ready prompt in [prompts/10_NEW_ACCOUNT_HANDOFF.md](prompts/10_NEW_ACCOUNT_HANDOFF.md).

**Pack type:** research + product + engineering STARTER KIT. **Not:** a completed trained model, proven customer product, or deployed SaaS. The included API, dashboard, sample data, calculation and tests form a demo vertical slice.

**Term starts:** 10 November 2026. **Owner:** solo builder. **Available time:** 20 hours/week **TOTAL across five independent products**, not per product. Each pack is a self-contained project; do not merge core source, models or assessment evidence.

## Start here (under 10 minutes)
1. Read `START_HERE.md`, then `AGENTS.md` and `docs/ASSESSMENT.md`. The original outline is included in `course/outline.docx`.
2. Run `python -m venv .venv && source .venv/bin/activate` (Windows: `.venv\Scripts\activate`), then `pip install -r services/api/requirements.txt`.
3. In one terminal run `cd services/api && uvicorn app.main:app --reload --port 8000`.
4. In another terminal run `cd apps/web && npm install && npm run dev` and open `http://localhost:3000`.
5. API `http://localhost:8000/docs`, automated tests from root: `PYTHONPATH=services/api pytest -q services/api/tests`.
6. Open this folder in ChatGPT Work and paste the entire `prompts/00_MASTER_WORK_PROMPT.md`. Work must begin with repo audit and course/rubric confirmation, not generate an imagined final product.

**Demo scope:** sample records are fictional; the API stores reviews and CSV imports in local SQLite, a deterministic domain demonstration is available, and the frontend provides a functional theme toggle and review actions. **The training pipeline, real data connectors, advanced views, security and commercial production features are documented requirements to implement, not already built.**

## Domain
**Problem:** Learner recovery after a missed or interrupted class
**Target user:** Working learner and education coordinator
**Core job:** Understand what changed, choose a viable next study action, and obtain support when needed.
**Research question:** Does a co-designed recovery workflow help learners identify and begin the correct next task with fewer errors and less effort than the existing LMS process?

## File guide
- `AGENTS.md` — authoritative agent instructions; read every fresh session.
- `prompts/00_MASTER_WORK_PROMPT.md` — full Work handoff. More focused prompts in `prompts/`.
- `docs/ASSESSMENT.md` — unit outcomes, evidence matrix, marks and risks.
- `docs/ARCHITECTURE.md` and `docs/PIPELINE.md` — E2E system and research flow.
- `docs/PRD.md` — features, acceptance criteria and phased product scope.
- `docs/DATA_AND_RESEARCH.md` — sources, licensing, experiment designs and leakage rules.
- `docs/UX_DESIGN_SYSTEM.md` — premium UI specifications and theme tokens.
- `assets/IMAGE_GENERATION_PROMPTS.md` — copy-ready ChatGPT image creation prompts and naming convention.
- `docs/ROADMAP.md` — solo schedule with a shared 20-hour weekly constraint.
- `docs/SECURITY_AND_SAAS.md`, `docs/GO_TO_MARKET.md`, `docs/TEST_PLAN.md` — release readiness.
- `project/CURRENT_STATE.md`, `project/SESSION_LOG.md`, `project/DECISIONS.md`, `project/NEXT_ACTIONS.md` — context recovery.
- `services/api` / `apps/web` — demo starter code; `data/sample` — synthetic example CSV.
- `course/outline.docx` — original uploaded outline, for independent verification.

## Ground rules
Never claim models have been trained, external data downloaded, customer feedback gathered, savings achieved or tests passed unless the artifacts and actual execution results demonstrate this. Never commit secrets, customer records or acquired public dataset files to the repo. Preserve original data licenses and source versions. Request human review for consequential actions.

## Verified local milestone — 22 October 2026
The original ZIP was extracted separately; all 58 starter files matched this workspace before edits. The synthetic CSV journey now supports strict typed validation, row/field errors, preview, explicit save, SHA-256 receipts, import history, atomic writes and safe identical retries. Drafts restore on the same browser/device. Imported source changes preserve existing reviewed statuses. This remains a local synthetic prototype, not a learning-outcome validation or production SaaS.

For the exact verified versions, use `python3 -m venv .venv`, `.venv/bin/pip install -r services/api/requirements.lock.txt`, and `npm ci` in `apps/web`. This session used Python 3.14.7 and Node 26.10.0 on macOS arm64; portability to other environments is not yet verified.

Port 8000 was occupied by an unrelated service on this machine. Run the API from the root with `PYTHONPATH=services/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`. The ignored `apps/web/.env.local` sets `NEXT_PUBLIC_API_URL=http://127.0.0.1:8014`; then run `npm run dev -- --hostname 127.0.0.1` from `apps/web` and visit `http://127.0.0.1:3000`. Restart/rebuild Next.js whenever this public environment value changes. Do not stop a different project's service to reclaim its port.

Read `project/CURRENT_STATE.md` for actual checks and remaining work, `docs/AUDIT_2026-10-22.md` for the audit, and `research/STUDY_KIT.md` for unfilled research instruments. No participant evidence or official deadlines have been obtained. `project/NEXT_ACTIONS.md` is the continuation backlog.
