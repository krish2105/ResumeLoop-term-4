# Domain pipeline and build specification

**Canonical pipeline:** Ethnography -> evidence synthesis -> divergent concepts -> low-fidelity tests -> co-design -> accessible working prototype -> observed usability comparison.

## Stage 0: Source validation
- Register source owner, URL, collection/release date, licence, allowed use, checksum, credentials requirements.
- Create a field-by-field mapping to a declared schema. Reject unknown/unexpected states without inventing values.
- Keep raw original separate from standardised feature layers; redact nonessential identifiers.

## Stage 1: Deterministic first slice
- Use the audited data fields to implement a baseline, rule, or computation.
- Save the input, configuration, result and a semantic version tag.
- Compare deterministic output against handcrafted unit tests and edge cases.

## Stage 2: Research experiments
**Research:** Does a co-designed recovery workflow help learners identify and begin the correct next task with fewer errors and less effort than the existing LMS process?
**Models:** No trained neural model required by this Design Thinking outline. Begin with deterministic recovery sequencing; only add NLP if the assessed problem demands it.
**Evaluation:** Task success rate; time-to-next-action; support requests; comprehension; interview themes; participant quotes with consent.
**Leakage/validity:** Never pass future progress as if known at task start; no fabricated observations.
- For this Design Thinking study, freeze protocol, scenarios, answer keys, order, success criteria and exclusions before participant testing; see `research/STUDY_KIT.md`.
- Record source hashes, UI version, participant consent reference and task timings. No trained model or ML split is required for the deterministic prototype.
- Only if a later justified model experiment is approved, define train/validation/test splits, seeds, features, hyperparameters and model artifacts before tuning.
- Compare meaningful current-workflow baselines and document order, learning and sampling effects.
- Make figures directly from measured result artifacts; never manually type a score as proof.

## Stage 3: Application serving
- Route only approved model artifacts to serving.
- Validate request units and source version. Return uncertainty, abstention and a fallback response when not confident.
- Never infer monetary, causal or social outcomes unsupported by the dataset.

## Stage 4: Decision and follow-up
- A person reviews/overrides relevant outputs, with a reason and timestamps.
- Track real outcomes separately; do not train on them without permission and a versioned data process.
- Monitor drift, wrong decisions, data quality and user feedback.

## Data access plan
research_interviews.csv and observations.csv (templates only; populate with real consented study data).
**Never imply that an external dataset is embedded in this ZIP.** Only small fictional records are included for smoke tests.
