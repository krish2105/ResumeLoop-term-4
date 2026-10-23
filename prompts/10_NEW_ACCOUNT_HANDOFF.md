# ResumeLoop continuation prompt for a new account

Copy everything below into the new account after attaching or linking the project as described in `NEW_ACCOUNT_HANDOFF.md`.

---

You are continuing **ResumeLoop**, one independent MAIB MGT 204 Design Thinking project. Assume you have no access to any previous chat. The repository is <https://github.com/krish2105/ResumeLoop-term-4>. Treat repository files and fresh execution results as the source of truth; do not infer completed work from this prompt.

The owner is a solo developer with 20 hours per week shared across five independent projects. Keep this project separate and work in bounded vertical slices. The term begins 10 November 2026, but do not infer assessment deadlines from that date.

Before editing anything:

1. Open or clone the current `main` branch. Run `git status --short`, `git log -1 --oneline`, and compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/main`.
2. Read `AGENTS.md` and follow it. Then read the privately attached `course/outline.docx`, `docs/ASSESSMENT.md`, `README.md`, `PROGRESS.md`, `NEW_ACCOUNT_HANDOFF.md`, all project-state files named by `AGENTS.md`, and the latest session-log entries.
3. Inspect actual code, tests, locks, database behavior, and Git state. Documents may be stale. Label absent artifacts as absent.
4. Install from the lockfiles if necessary. Run the synthetic demo and API/unit tests, then run frontend typecheck and build. Run the browser checks when the environment permits. Record exact commands and observed results.
5. Recheck the course-outcome mapping against the private original outline. Keep unresolved dates, solo/group rules, and research permissions marked unverified.

Current handoff claims that must be independently verified:

- M0 implements a local synthetic CSV import-to-saved-receipt journey with strict validation, preview, atomic save, source provenance, retry safety, import history, existing review persistence, draft restoration, Light/Dark/System themes, and responsive/keyboard checks.
- The last recorded results are 24 passing API/unit tests, successful frontend typecheck/build, and 23 production-browser checks.
- No authentic participant research, official deadlines, real learner data, trained AI, authenticated multi-tenant service, public deployment, or proven commercial outcome exists.
- The baseline deterministic planner can reselect completed actions and can skip newly feasible dependent actions because of ordering.

Write a short session plan and acceptance criteria before edits. Then implement the highest-priority unverified M1 slice from `project/NEXT_ACTIONS.md`: create a versioned typed **synthetic course-action contract** and repair planner completion/prerequisite behavior. It must preserve unknown values, reject missing/duplicate/unknown/cyclic dependencies and invalid bounds, exclude completed actions, resolve prerequisites consistently regardless of input order, obey the time budget, and document deterministic tie rules and abstention. Add meaningful negative and boundary tests. Preserve the existing Next.js + FastAPI + SQLite architecture unless verified evidence requires a change.

Do not fabricate interviews, observations, empathy maps, usability findings, deadlines, metrics, customers, or revenue. Use the blank research instruments only for authentic, consented evidence. Keep the app local and synthetic until privacy, data rights, authentication, and tenant isolation are addressed. Do not expose secrets or private coursework in a public repository.

Complete the working slice rather than stopping at a plan. Test the whole affected journey. At the end, follow the mandatory `AGENTS.md` exit protocol: update `project/CURRENT_STATE.md` with completed and verified items, exact commands/outcomes, changed files, blockers, next runnable task, and untested scope; append `project/SESSION_LOG.md`; update decisions and backlog. Do not claim production readiness. Do not deploy, send external messages, or push changes unless the owner directly authorizes that action in the new account.

---
