# ResumeLoop scorecard — 31 October 2026

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
