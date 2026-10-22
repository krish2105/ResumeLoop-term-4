# Product requirements and end-to-end workflow — ResumeLoop

## Single job to be done
**User:** Working learner and education coordinator. **Problem:** Learner recovery after a missed or interrupted class. **Job:** Understand what changed, choose a viable next study action, and obtain support when needed.
First user: Learner returning after missed sessions. Secondary: Course coordinator managing catch-up requests.

## End-to-end acceptance narrative
Given **real, legally permitted, validated input**, the user signs in, creates/selects an organisation, imports or connects data, inspects validation feedback, opens a domain work queue, reviews a calculated/model output with evidence, adjusts or rejects the decision, saves it, exports permitted records, and revisits its outcome later. **Only import/review/demo calculation slices are implemented in starter.**

## Tier P0 — assessed prototype requirements
- Learner status and last completed session
- Official, versioned course calendar and assignments
- Recovery plan with editable time budget
- Coordinator clarification queue
- Autosaved progress and source links
- Accessibility and session recovery

## Tier P1 — after primary user validation
- LMS OAuth/SSO with consent
- Calendar synchronization
- Learner cohort analytics
- Institutional subscriptions

## Deliberate non-goals
- Invented learning outcome improvement claims
- Unapproved personal learner analytics
- Automatic modification of grades

## User journey
1. Onboard with example data and a **clearly visible synthetic-data banner**.
2. Import: file validation, preview, schema mapping, source and consent recording, idempotent run ID.
3. Review: see work queue, context, status, source and model/heuristic version.
4. Decide: approve, defer, reject or annotate, where authorised; save who/when/why.
5. Export: include data-version, assumptions and provenance; do not overwrite source.
6. Learn: outcomes and human corrections return to a separately governed evaluation dataset.

## Release acceptance checks
- Import duplicate does not silently double-count; bad rows are reported with row references.
- Changing theme persists between reloads and honours system preference when selected.
- All important actions respond to keyboard focus and show success/error states.
- API rejects bad payloads and separates synthetic rows from future real datasets.
- Domain calculations are tested at zero, boundary and missing-value conditions.
- A reviewer can identify every estimate's source, model/version and assumptions.
- A clean machine can install dependencies and run a smoke check from documented commands.
- Real data is never committed to version control; no secrets in screenshots/logs.

## KPIs that require measurement
**Academic:** Task success rate; time-to-next-action; support requests; comprehension; interview themes; participant quotes with consent..
**Workflow:** completion time, reviewer correction count, abandonment, import error rate and support requests; the exact target must be agreed with pilot users.
