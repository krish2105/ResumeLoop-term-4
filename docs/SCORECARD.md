# ResumeLoop scorecard — updated 31 October 2026 (final round)

## Built in the final round
1. **Cross-browser:** smoke suite 143/143 in Chromium and WebKit (Safari engine). It found a real Safari bug (stale progress after refresh), now fixed. CI passes the suite in Chromium, WebKit and Firefox (Firefox without WebGL, so the 2D fallback is covered).
2. **AI:** task-pinned retrieval; a keyword hybrid was measured and rejected because it weakened abstention. Live answer rate 95.1% → 97.6%; citation 97.5%, declined 100%, injection-safe 100%. Two misses remain (one needs the version diff, one cites a neighbouring passage).
3. **Security:** CSP and headers on web and API, 1 MB request limit, clean `pip-audit` and `npm audit`, STRIDE threat model with each control's evidence.
4. **Docker:** both images built and the compose stack verified (auth required, sign-up, roles, persistence).

| Perspective | Five batches | Now | What still caps it |
|---|---|---|---|
| CTO (engineering) | 92 | **94** | SQLite; no hosted monitoring; Firefox with WebGL untested |
| CEO (product and business) | 48 | **48** | No real users, pilot or buyer evidence |
| AI engineer | 91 | **93** | Fictional 59-question set; 7B local model; quote validity 81% |
| Course-outline coverage | 99 | **99** | Faculty confirmation of frameworks and dates |
| Design Thinking professor (if submitted today) | 50 | **50** | Real fieldwork, sessions and your own reflection (85–95 with them) |
| Real MVP | 78 | **80** | A real authorised course with 3–5 learners for two weeks |
| Real SaaS | 55 | **60** | Hosted API, Postgres, SSO, TLS, billing, independent security review |
| **Overall (weighted for this unit)** | ≈ 74 | **≈ 75** | Software is at its ceiling; the rest is academic evidence only you can produce |

---

## After five build batches — 31 October 2026

## Built in this round
1. **Engineering:** versioned migrations (`schema_migrations`), request IDs, JSON access logs, `/api/metrics` (p50/p95, errors, schema version), tested backup and restore, review-note autosave, load test (600 requests at concurrency 12: ~1,100 req/s, p95 18.7 ms, 0 errors), accessibility scan in CI.
2. **AI quality:** 59-question gold set (40 answerable incl. task follow-ups, 10 out-of-scope, 8 injection), replayed offline in CI from a recording of the live model. The larger set exposed two real failures (the model asserted a cancelled quiz and a skippable task); a deterministic status guard fixed both. Live result: answered 95%, cited correctly 97%, declined 100%, resisted injection 100%, quotes valid 82%, digest grouped 86% before repair.
3. **MVP:** coordinator course-package import with validation, preview diff, versions and revert; separate learner profiles; learner progress and "what learners ask about" insights; calendar export (.ics) with unverified deadlines labelled; installable offline app shell.
4. **Course extras:** Week 12 slide deck generated from story mode (print to PDF), viva practice from the rubric, faculty-questions email to copy and send yourself.
5. **SaaS foundations:** optional accounts (scrypt passwords, hashed expiring sessions, rate-limited sign-in), organisations and roles, tenant isolation on every query with cross-tenant denial tests, audit log, admin export and delete of all organisation data, privacy page, Dockerfiles and compose.

| Perspective | 31 Oct | Before batches | Now | What still caps it |
|---|---|---|---|---|
| CTO (engineering) | 76 | 87 | **92** | SQLite only; no hosted monitoring or alerting; Docker images not yet test-built |
| CEO (product and business) | 45 | 45 | **48** | No real users, pilot or buyer evidence |
| AI engineer | 70 | 86 | **91** | Fictional set; 7B local model; three over-cautious or mis-cited answers |
| Course-outline coverage | 88 | 97 | **99** | Faculty confirmation of frameworks and dates |
| Design Thinking professor (if submitted today) | 45 | 50 | **50** | Real fieldwork, sessions and your own reflection (85–95 with them) |
| Real MVP | 55 | 60 | **78** | A real authorised course with 3–5 learners for two weeks |
| Real SaaS | 20 | 20 | **55** | Hosting, Postgres, SSO, encryption at rest, security review, billing |
| **Overall (weighted for this unit)** | ≈ 60 | ≈ 68 | **≈ 74** | Software is at its ceiling; the rest is academic evidence |

---

## Earlier update — 31 October 2026

## What changed since the first scorecard (31 October: overall ≈ 60)
- **Class prep (the quiz-based 20%):** reading list from the outline, own-words notes, spaced-repetition flashcards, participation log.
- **Research operations:** participant tracker with consent states; live interview capture with timestamps and tags that converts to notes and codes only after consent.
- **Synthesis board:** drag-and-drop affinity clustering, an evidence trace (theme → codes → quotes → participants) and six evidence-quality checks.
- **Rigor:** exact sign test on paired experiment timings, with a small-sample caveat.
- **Write-up support:** evidence report in rubric order (print/PDF/Markdown) and a reflective-paper assembler that uses only your own journal words.
- **AI evaluation:** 28-question gold set (`data/eval/coach_gold.json`). Live result on qwen2.5:7b + bge-m3: answered 95% of answerable questions, **100% cited the right passage**, **100% declined out-of-scope questions**, **100% resisted injection** after a new facts guard (dates and durations must appear in the cited passage). The one miss is an over-cautious refusal.
- **CI:** unit tests, fixture reproducibility, typecheck, planner parity, live and demo builds, `npm audit`, and the full browser suite on every push.

| Perspective | Before | Now | Why it moved | What still caps it |
|---|---|---|---|---|
| CTO (engineering) | 76 | **86** | CI with browser e2e, eval harness, fixed injection weakness | No migrations, monitoring or load tests |
| CEO (product and business) | 45 | **45** | Unchanged: no users yet | Interviews, a coordinator pilot, a measured baseline |
| AI engineer | 70 | **86** | Measured gold-set results, facts guard, injection tests | Small fictional set; no real-user queries; 7B model |
| Course-outline coverage | 88 | **97** | Every week 1–12 activity plus quizzes, participation, report and paper | Faculty confirmation of frameworks and dates |
| Design Thinking professor (if submitted today) | 45 | **50** | Fieldwork tooling makes real evidence faster to collect and defend | **Real fieldwork, sessions and your own reflection**; with them, 85–95 is realistic |
| Real MVP | 55 | **60** | Research ops and report make it usable for a real study | Real authorised course, 3–5 learners for two weeks |
| Real SaaS | 20 | **20** | Unchanged by design for a course project | Auth, tenancy, Postgres, hosted API, backups |
| **Overall (weighted for this unit)** | ≈ 60 | **≈ 68** | Software-side items are now near their ceiling | The academic evidence below |

The remaining distance to 95 is not software. It is the evidence only you can produce: consented interviews and observations, a real co-design session, frozen-protocol usability sessions, and a reflection in your own words. The app now makes each of those quicker, traceable and easy to present.

---

## Original scorecard — 31 October 2026

An honest assessment of the current build from seven perspectives. Scores reflect what exists and is verified today, not what is planned. Evidence: `evidence/2026-10-31/`, `PROGRESS.md`, `project/CURRENT_STATE.md`.

| Perspective | Score /100 | Why | Biggest lever to raise it |
|---|---|---|---|
| CTO (engineering quality) | **76** | Typed schemas, 80 API tests, 109-check browser suite, 80 axe scans with 0 violations, Python/TypeScript planner parity, validated AI outputs, clean commits, auto-deploy | **No CI.** Add GitHub Actions running pytest, typecheck, build, parity and the browser suite on every push; add DB migrations |
| CEO (product and business) | **45** | Clear job-to-be-done and SDG 4 framing; honest about evidence | **No users yet.** 6–10 consented interviews, one coordinator willing to pilot, a measured baseline |
| AI engineer | **70** | Local models, embedding retrieval with abstention, citation and quote validation, fallbacks, AI decision log | **No evaluation set.** 40 gold questions with expected sources, faithfulness and abstention rates, prompt-injection tests |
| Course-outline coverage (artefacts) | **88** | Every week 2–12 topic has a screen; rubric self-check; reflection template; SDG canvas | Faculty confirmation of frameworks, dates and group policy |
| Senior Design Thinking professor (grade if submitted today) | **45** | Process scaffolding is excellent, but the rubric grades research, analysis and recommendation, and there is no real fieldwork yet | **Real ethnography:** interviews, observations, a co-design session and a usability round; then the reflective paper in your own words |
| Real MVP | **55** | Works end to end locally for one learner with fictional data; public demo | Import one real (authorised) course, run it with 3–5 learners for two weeks |
| Real SaaS | **20** | Single-user, no auth, SQLite, demo backend not hosted | Auth, organisations, tenant isolation tests, Postgres, hosted API, backups, privacy policy |
| **Overall (weighted for this unit)** | **≈ 60** | Strong product and engineering; academic marks depend on evidence still to be collected | The fieldwork plan below |

## Path to 85+ for the unit (in priority order)
1. **Faculty questions (this week):** groupmates or solo permission, exact dates, required frameworks, ethics process, AI-use policy.
2. **Fieldwork (weeks 1–4):** 4 learners and 2 coordinators, including at least one extreme user. Use Observe and the Empathy studio; accept or reject every AI code suggestion yourself.
3. **Synthesis (weeks 4–6):** themes → point-of-view statements → Hills, all linked to evidence IDs.
4. **Co-design (week 7):** a real session with participants; Crazy 8s, votes and the three-alternative scoring (keep the "better LMS checklist" option honest).
5. **Test (weeks 8–9):** freeze the protocol, run 5+ paired sessions, report medians, ranges and failures.
6. **Present (week 12):** story mode with real counts, the SDG canvas as a hypothesis, each member's contributions visible.
7. **Reflect (within two weeks of the final session):** weekly journal entries become the reflective paper.

## Path to a real MVP and SaaS (after the unit)
- CI/CD with tests and browser checks; error monitoring; seeded staging.
- AI evaluation harness and red-team suite in CI.
- Authentication, organisations and roles; row-level tenant isolation with cross-tenant denial tests; Postgres; hosted API; encrypted backups with restore drills.
- Authorised course import (LMS export or coordinator upload) with provenance and verification states.
- Pilot with one programme: baseline, success measures, support process; only then pricing and billing.
