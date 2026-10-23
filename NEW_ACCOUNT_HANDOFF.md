# ResumeLoop new-account handoff

Updated **23 October 2026**. This document lets a new ChatGPT/Codex account continue the project without relying on earlier chat history.

## Fastest handoff

1. Give the new account the repository: <https://github.com/krish2105/ResumeLoop-term-4>.
2. In a private project/chat, attach the owner's authorized original `course/outline.docx`. It is deliberately absent from the public repository because redistribution permission has not been established.
3. Paste the complete prompt in [`prompts/10_NEW_ACCOUNT_HANDOFF.md`](prompts/10_NEW_ACCOUNT_HANDOFF.md).

If the new account cannot open GitHub, download <https://github.com/krish2105/ResumeLoop-term-4/archive/refs/heads/main.zip> and attach that ZIP instead. Attach `course/outline.docx` separately. Do not attach `.env.local`, `.venv`, `node_modules`, `.next`, the local SQLite database, machine logs, secrets, or real participant data.

## What the repository currently contains

**VERIFIED OBSERVATION:** Milestone M0 is implemented and was locally verified. The synthetic CSV journey covers strict validation, error correction, preview, explicit save, durable receipts, retry protection, import history, review persistence, theme persistence, keyboard behavior, and responsive layouts. The recorded verification is 24 API/unit tests, a successful frontend typecheck/build, and 23 production-browser checks. Evidence and limitations are in [`PROGRESS.md`](PROGRESS.md) and `evidence/2026-10-22/`.

**SYNTHETIC DEMO:** All included learner/task records are fictional. The deterministic planner is a sample calculation, not trained AI.

**TODO:** Authentic interviews, observations, participant usability results, verified course dates, personal recovery plans, saved learner progress, coordinator support, authentication, tenant isolation, deployment, and commercial validation remain incomplete.

**KNOWN DEFECT:** The baseline planner can reselect completed actions and can skip an action whose prerequisite becomes feasible later in an input list. This is the next engineering priority.

## Source-of-truth reading order

The new account must inspect files and execution results rather than trusting this summary:

1. `AGENTS.md`
2. Private `course/outline.docx`, then `docs/ASSESSMENT.md` and `README.md`
3. `PROGRESS.md`
4. `project/CURRENT_STATE.md`, `project/DECISIONS.md`, `project/BLOCKERS.md`, `project/NEXT_ACTIONS.md`
5. The latest entries in `project/SESSION_LOG.md`
6. Actual source, tests, dependency locks, Git status, and current remote head

## Restore and run

The full setup, launch, demo, and test commands are maintained in [`PROGRESS.md`](PROGRESS.md#run-locally). The verified local configuration uses the API at `127.0.0.1:8014` and the frontend at `127.0.0.1:3000`. Keep the application on localhost and use synthetic data because it has no authentication or tenant isolation.

Before changing code, the new account should run:

```bash
git status --short
git log -1 --oneline
PYTHONPATH=services/api .venv/bin/python -m pytest -q services/api/tests
cd apps/web
npm run typecheck
npm run build
```

If dependencies are not installed, follow the locked installation steps in `PROGRESS.md` first. Browser checks require both services and the separate Playwright CLI setup documented there.

## Exact next milestone

Implement M1 as a bounded synthetic vertical slice:

1. Define a versioned typed course-action contract with action ID, duration, prerequisites, completion state, source owner/version/reference, deadline timezone, and verification state. Preserve unknown values as unknown.
2. Reject missing fields, duplicate/unknown dependencies, cycles, invalid bounds, and malformed records with useful errors.
3. Fix planning so completed actions are excluded and newly unlocked actions are considered consistently regardless of input order, without exceeding the available time.
4. Document deterministic tie rules and abstain when required authority is missing.
5. Add meaningful boundary and negative tests, run the complete existing check set, and update every continuity file required by `AGENTS.md`.

Do not fabricate research, official deadlines, users, metrics, revenue, or production readiness. Continue with synthetic fixtures until data rights, privacy, and research permission are confirmed.

## Handoff integrity

Use `git rev-parse HEAD` locally and compare it with `git ls-remote origin refs/heads/main` before starting. The handoff is the current `main` branch, not a commit hash copied into a chat. The public repository excludes the private curriculum, local configuration, databases, dependencies, build outputs, and detailed machine logs by design.
