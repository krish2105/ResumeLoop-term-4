# Session plan — 23 October 2026

## Current scope: cross-account handoff

Create a repository-backed handoff that lets a different account recover the verified state without prior chat history. Keep private curriculum and local state outside the public repository.

## Current steps

1. Verify Git status, remote, current progress guide, continuation prompt, and continuity records.
2. Add a self-contained handoff guide, attachment checklist, and copy-ready prompt.
3. Link the handoff from the main documentation and record it in all mandatory continuity files.
4. Validate document references and whitespace, commit, push to the user-authorized repository, and verify remote `main`.

## Current acceptance criteria written before edits

- State exactly what the new account must link or attach and explain why the private outline is separate.
- Provide a paste-ready prompt containing recovery order, verified claims to recheck, next milestone, evidence rules, and exit protocol.
- Preserve the distinction between verified observations, synthetic demo behavior, assumptions, hypotheses, and TODO work.
- Exclude secrets, environment files, database state, dependencies, build outputs, private course material, and participant data.
- Keep `PROGRESS.md` as the full run/status guide and avoid duplicating volatile command details inconsistently.
- Pass `git diff --check`, verify every named local handoff file exists, and verify the pushed remote SHA equals local HEAD.

## Current explicit limits

This documentation-only milestone does not change or retest application behavior. Previously recorded application checks remain historical evidence until rerun. The handoff does not grant course-material redistribution rights or make the prototype production-ready.

---

# Previous session plan — 22 October 2026

## Scope
Restore and audit M0, then implement the highest-priority source/import quality slice in the existing Next.js + FastAPI + SQLite architecture. Use only synthetic data. Research instruments are preparation, not findings. Preserve the ZIP as baseline.

## Steps
1. Extract/checksum starter; read original outline and all specifications; run baseline demo, tests and build.
2. Add a strict typed CSV contract, row-level errors, preview, atomic save, durable source receipt and retry protection.
3. Connect the import journey with draft restoration, accessible feedback, mobile layout and existing themes; retain review functionality.
4. Exercise valid/invalid/retry/refresh/offline journeys, save evidence, prepare research instruments and reconcile assessment requirements.
5. Update all continuity files with observed results and next runnable task.

## Acceptance criteria written before implementation
- Exact headers and cell counts; required values, supported states, valid IDs and finite nonnegative metrics; reject malformed CSV, duplicates and more than 250 rows with row/field references. Never default missing values.
- Invalid batches leave records and import history unchanged. Preview performs no writes.
- Successful saves persist SHA-256 of original UTF-8 input, schema version, normalized input snapshot, time, row totals and created/updated counts in the same transaction as records.
- Identical retries return the original receipt without duplicate history or overwriting later reviews. A changed source must not reset an existing review disposition.
- UI supports preview → fix → preview → explicit save → receipt → reload. Editing invalidates preview; draft restores locally; storage/network failures are visible and retryable.
- Existing six tests and production build pass; add API tests for boundaries, rollback and retries; manually exercise desktop/mobile, keyboard and Light/Dark/System in a real browser.
- Audit and study kit contain no invented participants, findings, deadlines, model results or commercial outcomes.

## Explicit limits
No official-course ingestion, authentication, tenant isolation, live coordinator messaging, trained model or production release in this slice. No ZIP or Git state will be overwritten. Real research and faculty approval remain external dependencies.

## Added user-authorized handoff
Save all work and push to `https://github.com/krish2105/ResumeLoop-term-4`. Inspect remote before writing; it is empty/public. Create root `PROGRESS.md` with completed work, remaining end-to-end milestones and run instructions. Publish code, synthetic assets and concise evidence; retain private coursework and local machine state outside Git. Verify remote HEAD after the push; no force push.
