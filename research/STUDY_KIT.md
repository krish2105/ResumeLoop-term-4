# ResumeLoop research kit

Prepared 22 October 2026. **TODO: faculty review, participant permission and fieldwork. No interviews, observations or usability sessions have been conducted for this project.** These are original working instruments, not completed evidence.

## Research question and evidence boundary
Does a co-designed recovery workflow help working learners identify and begin the correct next task with fewer errors and less effort than their existing process?

**VERIFIED OBSERVATION — secondary research:** Kara, Erdoğdu, Kokoç and Cagiltay (2019) reviewed 36 studies and identified interconnected personal, external and programme challenges in adult distance education. Context and learner circumstances matter. This supports investigating interruption and recovery; it does not establish the prevalence of missed classes in MAIB or demonstrate that ResumeLoop works. [Open Praxis paper, DOI 10.5944/openpraxis.11.1.929](https://files.eric.ed.gov/fulltext/EJ1213733.pdf), inspected 22 October 2026. Cite this review as secondary evidence, not our participants or a causal result.

**HYPOTHESIS H1:** Returning learners spend effort reconstructing what changed across multiple sources. **H2:** Source-backed, time-bounded next actions reduce uncertainty. **H3:** Preserving unfinished work helps people resume. **H4:** Coordinators value fewer repetitive clarification requests. **H5:** A simpler LMS checklist may solve the problem without a separate SaaS. Seek evidence against all five.

**ASSUMPTION:** Working learners and cohort coordinators are a useful starting audience. Do not treat employment, disability, motivation, available study time or missed-session reasons as known until volunteered. No medical or academic-performance diagnosis is needed.

## Recruitment and consent
Proposed first round: 4 learners and 2 coordinators, within the existing 6–10-person discovery goal. Purposively seek recent interrupted study, different work schedules, mobile use and assistive-technology experience without requiring sensitive disclosures. This convenience sample is exploratory, not representative. Recruit adults only in this first protocol. No invitations have been sent.

Before recruiting, confirm faculty ethics requirements, voluntary participation, permitted use of course materials, the researcher's contact, storage location, withdrawal contact and exact retention/deletion dates. Record those values in the participant information sheet; do not present an incomplete sheet as approved consent. Proposed retention is deletion of identifiable raw material within 90 days of collection, subject to faculty requirements and the agreed participant notice. Do not silently apply this proposal.

Participant information script, to finalize with faculty:

“I am studying how people return to learning after an interruption. This is a student research prototype, not a university service. Taking part is voluntary and does not affect grades or support. You may skip questions or stop. We will discuss a recent experience and, if you agree, observe how you find your next task. Please hide names, grades, messages and unrelated information. We are testing the process, not your ability. Any recording or quotation needs separate permission.”

Record separate choices: participation; anonymized notes; screen observation; audio/video capture (default off); anonymous quotation in assessment; future contact (default off). Record participant code, protocol version, consent timestamp and withdrawal cutoff. Keep contact details and consent forms in restricted storage outside this repository. No blanket permission for commercial reuse, model training or LMS extraction. Stop recording if third-party information appears; redact before analysis.

## Interview guide — 25 minutes
Use broad context questions before the recent incident. Do not demonstrate ResumeLoop until after the problem interview.

1. Tell me about how study fits into your week. Which tools do you normally use?
2. Think of the most recent session you missed or stopped partway through. What happened next? You may skip the reason for the interruption.
3. Walk me through the first thing you did when returning. What did you consult, and in what order?
4. How did you determine what had changed and which deadline was authoritative? Was anything contradictory?
5. How did you choose what to do with the time you had? What did you leave for later?
6. What information or work had you lost? How did you reconstruct it?
7. When did you seek help, from whom, and what response was useful? What prevented asking?
8. Tell me about a time returning was straightforward. What made that different?
9. What would make you distrust a suggested next task? What should remain your decision?
10. What have I misunderstood or failed to ask?

Coordinator extension: Describe the last recovery request; where the answer and deadline came from; how changes were communicated; which requests repeat; who owns verification and access decisions. Ask about procurement only after workflow discovery: who authorizes tools, what evidence would justify a pilot, and what constraints would rule one out? Interest is not willingness to pay.

Use neutral prompts: “What happened next?”, “Could you show me with private details hidden?”, “How did you know?” Keep verbatim quotes separate from paraphrases and interpretations. Ask permission before quoting. Adapted method, not copied field guide: [IDEO.org Interview](https://www.designkit.org/methods/interview.html).

## Observation guide — 15 minutes
With explicit permission, ask the participant to show their existing return-to-study process using redacted or synthetic material on their preferred device. Do not obtain credentials or navigate other students' records. If observation is unavailable, mark the account as self-report, not observed behaviour.

Capture event time, participant code, task, screen/tool, action, source consulted, pause, question, error, assistance and visible result. Record emotions only as participant statements; observable hesitation is not proof of anxiety. Allow quiet work, then ask for clarification. Record interruption/restoration only with advance agreement. Do not simulate missed grades or urgent deadlines.

Use `templates/observations.csv`. Every interpretation links to an event ID and records alternative explanations. [IDEO.org Guided Tour](https://www.designkit.org/methods/guided-tour.html) motivates contextual observation; the short screen walkthrough is a pragmatic adaptation, not a claim to have completed a full ethnography.

## Empathy map — blank evidence structure
Create one map per context before combining. Leave cells empty until evidence exists.

| Area | What to enter | Evidence rule |
|---|---|---|
| Says | Consented exact quotation | Participant code + quote/event ID |
| Does | Observed action | Event ID; distinguish self-report |
| Thinks | Participant explanation or researcher inference | Explicitly label inference and confidence |
| Feels | Volunteered emotion in their words | Do not infer from demographics or behaviour alone |
| Needs | Proposed need grounded in the above | Supporting and contradictory evidence IDs |
| Unknowns | Missing context and follow-up question | No invented persona details |

## Current and future journey maps
Use `templates/journey_map.csv`. Proposed stage labels are **HYPOTHESES**: return → reconstruct changes → verify next task → begin → pause/resume. Let participants rename, remove or reorder them. For each stage capture goal, action, tool/source, quote, pain point, workaround, verified emotion, evidence ID and opportunity. Map current behaviour first. Put proposed future actions on a separate map and label them as design ideas. [IDEO.org Journey Map](https://www.designkit.org/methods/journey-map.html) provides the method rationale.

## Synthesis and collaborative ideation
After each session, anonymize notes, separate observation from interpretation, code incidents and preserve a link from theme → evidence → proposed requirement. Use `templates/research_interviews.csv` for index entries, not unredacted transcripts. Compare positive and negative cases. Report participant counts, context and disagreements; repeated comments are not prevalence estimates. Invite participants to check interpretations if they separately consented to follow-up.

For outcome E, arrange a genuine co-design session with learners/coordinators; an AI-generated brainstorm is not collaborative field evidence. Compare at least three alternatives: improve the existing LMS checklist, a coordinator-authored recovery brief, and a learner-controlled ResumeLoop plan. Record creator, rationale, source traceability, accessibility, effort, privacy and objections. Do not preselect SaaS as the answer. Frame HMW questions only after synthesis, for example **HYPOTHESIS:** “How might we make the authoritative next task easier to locate within a short study window?”

## Usability protocol — freeze before sessions
Two separate studies are needed. Do not confuse engineering smoke tests with learner evidence.

**Study A: import interface usability, ready for recruitment after consent approval.** Intended operator: coordinator or researcher handling synthetic examples. Tasks: (1) find and preview the sample, (2) identify and correct a supplied missing-field/extra-cell error, (3) save and locate its receipt, (4) refresh and recover a draft, (5) retry the same save and explain whether anything duplicated. Success requires the expected saved state and the participant correctly distinguishing a draft from an import. Never describe this as proof of learning recovery.

**Study B: learning recovery comparison, TODO until the recovery-plan slice exists.** Baseline is the participant's authorized current workflow, or a clearly labeled standardized mock LMS if access is unavailable. Use two equivalent synthetic scenarios with known prerequisites, a declared time budget and a source-backed deadline including timezone/version. Tasks: identify the next feasible action; locate its authority; save progress; resume after an agreed interruption; identify an unresolved deadline conflict and request clarification. An independent coordinator checks the answer key before testing. Never use real conflicting deadlines as test stimuli without authorization.

Proposed within-participant design: alternate AB/BA order and scenario assignment by enrollment sequence; log actual order. Same device, source facts, task wording and assistance policy in both conditions. Separate timed silent performance from retrospective think-aloud to reduce timing contamination. Run one pilot session to refine instructions; exclude it from the frozen comparison and document why. The small sample is formative, not powered evidence of causal superiority.

Freeze protocol version, scenario hashes, answer key, UI/build version, success definitions, task timeout (proposed 5 minutes), missing-data handling and exclusions before analysis. Never tune the prototype between paired tasks. Keep iteration rounds separate; repeat participants have learning effects. Do not discard failed tasks from denominators. Training/validation/test splits and ML accuracy are not relevant unless an actual model study is later justified.

Measures in `templates/usability_tasks.csv`: unaided success, elapsed seconds, wrong actions, assistance, source comprehension, lost-work events, support requests and post-task ease rating from 1 (very difficult) to 7 (very easy). Start timing when the task is shown; stop at the defined saved outcome or timeout. Record completion and censoring separately. Report counts/denominators, medians/ranges and paired differences; do not claim statistical significance from a few sessions. Record device and accessibility needs only when voluntarily relevant.

Iteration gate: fix any observed wrong-deadline, lost-work or privacy issue before further testing; retain before/after screenshots, issue severity, evidence IDs and change rationale. Pre-agree any improvement target after baseline discovery and before comparison; do not invent a percentage target as an observed result. Invite criticism without defending the prototype. [IDEO.org Get Feedback](https://www.designkit.org/methods/get-feedback.html).

## Researcher reflection and commercial decision
After real sessions, the student writes their own dated reflection: what they believed; what specific evidence challenged it; which concept/framework helped; what alternative they rejected; what changed; what they would do differently. The course reflective-paper prompts also require practical organizational application. Do not use generated first-person fieldwork accounts.

Commercial progression remains conditional: repeated recovery problem → authorized source access → useful prototype → consented pilot with named sponsor → authentication/tenant isolation/retention controls → repeat use and buyer evidence → paid offer. No prices, conversion rates, ROI or market advantage have been validated. A finding that an existing LMS feature solves the problem is a valid outcome.
