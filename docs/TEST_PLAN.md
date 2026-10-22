# Quality gates and end-to-end acceptance

## Currently runnable (after local dependency install)
1. `PYTHONPATH=services/api pytest -q services/api/tests`.
2. Start FastAPI. `curl -s http://localhost:8000/api/health`.
3. `curl -s http://localhost:8000/api/demo/records` and `curl -s http://localhost:8000/api/demo/domain`.
4. Start Next.js, browse to http://localhost:3000, switch Light/Dark/System, search a synthetic case, submit a review note and observe persisted status after refresh.

## Tests Work must implement before claiming real MVP
- Correct results for known tiny input and edge cases (zero, missing, duplicates, malformed, out-of-range).
- Import end-to-end on a **genuinely permissible sample** with schema mismatch feedback and totals reconciliation.
- A frozen participant-study protocol, current-workflow comparison and observed task results. Model-training gates apply only to a later justified model experiment, not as a prerequisite for this Design Thinking prototype.
- Real user flow: new tenant -> connect/import -> validated result -> human review -> export -> return -> audit.
- 2+ tenant isolation tests, role-based access, denied cross-tenant reads, job ownership tests.
- Failure injection: API unavailable, interrupted upload, retry, corrupt source, LLM unavailable, model missing.
- UI keyboard/mouse and reduced-motion audit; theme persistence and colour contrast.
- Billing/usage and restore test when commercially relevant.

## Release evidence table
| Claim | Required evidence | Current status |
|---|---|---|
| Runnable demo | API/unit test logs + screenshot after local run | Code provided; installation/run not yet performed by user |
| Real data processing | Import manifest, license, checksum, field validation | Not implemented |
| Trained model | Run configs, artifacts, held-out metrics | Not implemented |
| Academic superiority | Frozen-test comparison and uncertainty | Not established |
| SaaS readiness | Security tests and pilot logs | Not established |

## Executed M0 evidence — 22 October 2026

Baseline six tests passed. Final **24 API/unit tests** pass, covering strict fields/cell counts, malformed quoting, blank values, duplicate IDs, size/row bounds, zero metrics, quoted multiline fields, preview with no writes, receipt hashes, snapshot retrieval, exact and concurrent retry, preserved review status and rollback when receipt insertion fails. One TestClient/httpx deprecation warning remains.

Frontend production build and typecheck pass. **23 checks on the built application** cover error → fix → preview → save → receipt → refresh, draft clearing/restoration, source snapshot lookup, response lost after save → safe retry, network failure recovery, dark persistence/system media changes, keyboard focus, existing review save/refresh, empty search and no page overflow at 320/390/768/1440px. Scripts are under `scripts/`; results in `evidence/2026-10-22/browser-checks.json`.

Automated accessibility scan covers the import/preview surface in Light/Dark at 1440px and 320px. See `accessibility-summary.json` for actual violations and manual-review items. Offscreen/overlap contrast estimates need manual confirmation; no WCAG conformance claim. Manual visual review includes desktop and mobile viewport captures. Participant usability, screen readers, other engines, real devices, load/tenant/security and restore drills are not tested.

Final npm and Python dependency scans show zero known vulnerabilities. Full raw outputs remain local; concise versioned summaries are published. This demonstrates engineering behaviour with synthetic fixtures, not academic superiority or learner benefit.
