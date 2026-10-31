# Framework and literature: why ResumeLoop is a design thinking project

Prepared 1 November 2026 for the group presentation (40%) and the reflective paper (40%). Every source below was checked on
1 November 2026 against the publisher, DOI or library record. **Nothing here is a finding.** Findings come only from the
fieldwork in [`FIELDWORK_SPRINT.md`](FIELDWORK_SPRINT.md); until then each claim about learners is a hypothesis.

## How this maps to the rubric
| Rubric item (outline §3.3–3.4) | What answers it | Where it lives |
|---|---|---|
| Relevant framework | Design thinking as a human-centred, iterative process (Brown, 2008; IDEO.org, 2015); why it reduces innovation risk (Liedtka, 2018) | This document, §1 |
| Research relevance | The problem sits in a known research area, persistence after interruption (Tinto, 1975; Kara et al., 2019), and in SDG 4 | §2, §3 |
| Data and information analysis | Reflexive thematic analysis (Braun & Clarke, 2006), run on the synthesis board with an evidence trace | §4, app `/studio/synthesis` |
| Understanding key issues | Points of view and Hills written only after synthesis, each linked to evidence | app `/studio/define`, `/studio/envision` |
| Decision among alternatives | Three alternatives scored with participants, including "fix the LMS checklist" | app `/studio/ideate` |
| Feasible recommendation and impact | Small-round usability tests (Nielsen, 2000) and the browser pilot | §5, app `/studio/experiments`, `/coordinator` |

## 1. The framework: design thinking
Brown (2008) describes design thinking as matching people's needs with what is technically feasible and viable for an
organisation, moving between inspiration, ideation and implementation rather than in a straight line. IDEO.org's Field
Guide (2015) turns this into a human-centred practice in three phases (inspiration, ideation, implementation) with
concrete methods. This project uses four of them, adapted in [`research/STUDY_KIT.md`](../research/STUDY_KIT.md):
interviews, guided tours, journey maps and getting feedback.

Liedtka (2018) argues that design thinking works because its structure counters predictable biases, such as projecting
our own views onto users and settling on the first idea. ResumeLoop's process guards against two of these on purpose:
- **Projection:** personas stay labelled as assumptions until they are linked to evidence (`/studio/empathy`).
- **The first idea:** the "better LMS checklist" alternative is kept in every comparison, so building software is not
  assumed to be the answer (`/studio/ideate`).

The course's own stages (observe, empathise, define, ideate, prototype, test) map onto IDEO's phases. The Week 12 story
mode walks through them in that order.

## 2. Why the problem matters: returning after an interruption
**HYPOTHESIS, to test in fieldwork:** learners who miss a session lose time rebuilding what changed and which task comes
next, and some quietly fall behind.

The research base is about persistence. Tinto (1975) models dropout as the result of how well a student is integrated
into the academic and social life of their institution over time. A missed session is a small break in that
integration, and the recovery after it is a moment the institution can design for. Kara, Erdoğdu, Kokoç and Cagiltay
(2019) reviewed 36 studies of adult distance learners and found internal, external and programme-related challenges that
interact, and that vary with age, skills and study context. Context matters, so this project interviews working learners rather than assuming their circumstances.

Neither source shows that missed sessions are common in MAIB or that ResumeLoop helps. They justify asking the question.

## 3. The SDG link: SDG 4, Quality Education
The Week 12 brief asks for AI-driven solutions to the UN Sustainable Development Goals using design thinking frameworks.
ResumeLoop relates to two SDG 4 targets:
- **Target 4.3:** equal access for all women and men to affordable, quality technical, vocational and tertiary education,
  including university.
- **Target 4.4:** by 2030, substantially increase the number of youth and adults with relevant skills for employment,
  decent jobs and entrepreneurship.

Present the link as a hypothesis: a learner who can recover from an interruption is more likely to stay in tertiary
education (4.3) and finish the skills it builds (4.4). The SDG canvas in the app (`/course`) keeps it labelled that way
until fieldwork supports it. Do not claim an SDG impact the pilot did not measure.

## 4. Analysing the interviews: reflexive thematic analysis
Braun and Clarke (2006) set out six phases. The app supports each one, but the coding judgement stays with the
researcher:

| Phase | What you do | Where |
|---|---|---|
| 1. Familiarise | Read each consented, anonymised note twice; jot first impressions | `/studio/research`, `/studio/observe` |
| 2. Generate codes | Code exact quotes; accept or reject each AI suggestion yourself | `/studio/empathy` (quotes must exist in the note) |
| 3. Search for themes | Drag codes into candidate themes | `/studio/synthesis` |
| 4. Review themes | Check each theme against its quotes; split or merge; keep negative cases | evidence trace on `/studio/synthesis` |
| 5. Define and name | Write a point of view and a Hill per theme | `/studio/define`, `/studio/envision` |
| 6. Write up | Compile the report in rubric order | `/report` |

Report how many participants a theme came from and where people disagreed. A theme mentioned by three of six people is
not a prevalence estimate.

## 5. Testing the prototype: small rounds
Nielsen (2000) recommends several small rounds of about five users each, fixing problems between rounds, rather than one
large study. That fits a student project: run round 1, fix what it finds, run round 2. The experiment lab freezes the
protocol before testing (a SHA-256 fingerprint of tasks and answer key), times each task and reports medians, ranges and
an exact sign test with its small-sample caveat. Five people cannot show statistical significance; say so.

The browser pilot (`/coordinator`) then lets 3–5 learners use the tool on a course you are allowed to share for one to
two weeks. The coordinator combines their progress files to see who fell behind and what they asked. That is the
evidence behind a "feasible recommendation".

## 6. For the reflective paper
The outline says faculty will name the reflective frameworks. Use the one they name. Whatever it is, the paper needs your
own account of what you believed, what evidence changed it and what you would do differently. The reflection journal
(`/reflect`) keeps dated entries in your words, and the paper assembler uses only those words.

## References
Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology, 3*(2), 77–101.
https://doi.org/10.1191/1478088706qp063oa

Brown, T. (2008, June). Design thinking. *Harvard Business Review*. https://hbr.org/2008/06/design-thinking

IDEO.org. (2015). *The field guide to human-centered design* (1st ed.). IDEO.org. ISBN 978-0-9914063-1-9.
https://www.designkit.org/resources/1.html

Kara, M., Erdoğdu, F., Kokoç, M., & Cagiltay, K. (2019). Challenges faced by adult learners in online distance education:
A literature review. *Open Praxis, 11*(1), 5–22. https://doi.org/10.5944/openpraxis.11.1.929

Liedtka, J. (2018, September–October). Why design thinking works. *Harvard Business Review*.
https://hbr.org/2018/09/why-design-thinking-works

Nielsen, J. (2000, March 18). *Why you only need to test with 5 users*. Nielsen Norman Group.
https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/

Tinto, V. (1975). Dropout from higher education: A theoretical synthesis of recent research. *Review of Educational
Research, 45*(1), 89–125. https://doi.org/10.3102/00346543045001089

United Nations. (2015). *Sustainable Development Goal 4: Ensure inclusive and equitable quality education and promote
lifelong learning opportunities for all* (targets 4.3 and 4.4). https://sdgs.un.org/goals/goal4
