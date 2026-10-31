# Open blockers and risk ownership

Updated 23 October 2026.

## Ranked by marks at stake (added 31 October 2026)

Marks come from the outline weights (Group 40%, Reflection 40%, Participation 10%, Individual 10%). Ranking is an assessment, not a faculty statement.

| Rank | Blocker | Marks it gates | Why this order |
|---|---|---|---|
| 1 | **Groupmates and solo-submission permission** unknown; conflicting schedules (§2.5 vs §3.1); final-session date unknown | Group 40% (Weeks 10-12, Week 12 UN SDG presentation) and the reflection deadline (within two weeks of the final session) | Everything else depends on who is in the group, what the group delivers and when. One faculty message resolves several unknowns; **no message sent, owner must send** |
| 2 | **Research permission and participants** (consent, ethics process, voluntary recruitment) | Group 40% and Reflection 40% rubric items: framework, data analysis, key issues, content quality | Without real fieldwork there is no qualitative evidence to analyse, so both 40% components lose their evidence base. Fieldwork needs lead time |
| 3 | **Planner defects and course-action schema** (completed actions reselected, dependents skipped) | Only the supporting prototype inside the 40% group work | Engineering correctness, not a rubric criterion; a polished UI alone does not satisfy the rubric. Do it, but after rank 1 and 2 |
| not blocked | Participation and individual quizzes (20%) | 20% | Needs attendance, pre-session readings and class contribution, no software or permission. Schedule study time from the first session |

The table below lists the remaining engineering and platform gaps, which are not ranked.

| Blocker / verified gap | Impact | Owner / next action |
|---|---|---|
| Participation and group dates conflict in original outline; final-session date and solo permission unknown | Assessment scheduling/submission risk | Student: obtain current faculty brief; no external message sent |
| No approved participants or research permissions | No authentic qualitative/usability results | Student: faculty review, consent and voluntary recruitment using study kit |
| No authorized course source/version/deadline owner | Cannot offer verified personal recovery plans/deadlines | Student/coordinator: establish rights and typed source contract |
| Planner reselects completed actions and skips some newly feasible dependents | Incorrect recovery sequencing | Engineering: next synthetic schema/planner slice; reproduction saved locally |
| Review-note draft is not scoped/autosaved per record | Potential note carryover/lost draft | Engineering: next review/session-restoration slice |
| Local API unauthenticated, no tenant isolation, unencrypted SQLite/localStorage | Unsafe for real learner data or public service | Engineering: auth/privacy/tenant tests before pilot; keep localhost synthetic |
| No screen-reader, Safari/Firefox or real-device participant tests | Accessibility not fully established | Engineering/research: assisted manual tests; automated scan limitations documented |
| Four hours/week default for this project; five projects share 20 hours | Scope risk | Student: prioritize rubric evidence and one vertical slice per session |
| Original Design Kit resource link returned 404 | Starter source pointer stale | Resolved for method research using verified primary method pages; no dataset downloaded |
| Port 8000 belongs to another service on this machine | Default launch fails | Resolved locally with port 8014 and explicit environment configuration |
| Public repository excludes the private course outline | Fresh clone cannot inspect original curriculum | Student: restore authorized local copy to course/outline.docx for private academic work |
| A different account may not inherit GitHub access, files, or chat history | Continuation can miss rubric evidence or trust stale summaries | Owner: provide repository link or ZIP, attach the authorized outline privately, and paste `prompts/10_NEW_ACCOUNT_HANDOFF.md` |

Dependency scans found no known remaining advisories at this run. The TestClient/httpx deprecation warning remains a maintenance item, not a failed test. GitHub publication is explicitly user-authorized; no deployment, email, purchase, grading or real coordinator approval is authorized or performed by this session.
