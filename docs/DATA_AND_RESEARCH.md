# Verified source starting points and academic design

## First data source
**URL:** https://www.designkit.org/resources/1
**Known purpose:** Permissioned course schedules, task/deadline exports, participant interviews and moderated task observations; do not fabricate interview results.
**Licence/rights caveat:** Permissioned primary research; no external participant or LMS data without consent/authorisation. IDEO design resources are references, not a training dataset.
**First Work task:** verify the most recent publisher docs, version, schema, files, licence, and any limits before downloading; record URLs/access date/checksums in `project/DATA_SOURCE_REGISTER.csv`.

## Academic research question
> Does a co-designed recovery workflow help learners identify and begin the correct next task with fewer errors and less effort than the existing LMS process?

## Proposed experiments
- Baseline vs trained alternative: No trained neural model required by this Design Thinking outline. Begin with deterministic recovery sequencing; only add NLP if the assessed problem demands it.
- Metrics: Task success rate; time-to-next-action; support requests; comprehension; interview themes; participant quotes with consent.
- Known evaluation threats: Never pass future progress as if known at task start; no fabricated observations.
- Prior work must be cited; specific originality must be demonstrated through a novel, evaluated change or a new permissioned user study.
- Report confidence intervals or variation across runs where technically meaningful.
- Every chart must name its population, horizon/units, data version and sample size.

## Honest claims vocabulary
- **Observed**: measured from downloaded or customer data with provenance.
- **Modelled**: held-out evaluation result, reproducible from saved run.
- **Simulated**: calculated from declared hypothetical assumptions; not observed profit/impact.
- **Proposed**: user interface, business hypotheses and future features.

## Licence and privacy checks
External data is never automatically suitable for customer-facing reuse. Document publisher license and any upstream third-party rights; minimise PII and retain an auditable lawful basis / permission record. Synthetic demo records are only for development and cannot support empirical conclusions.

## Literature and data starting URLs
- https://www.designkit.org/resources/1
- https://www.w3.org/WAI/WCAG22/quickref/

## Dataset card fill-in checklist
`owner; published release date; access date; download URL; citation; license; file checksum; row/entity granularity; timestamp unit; available labels; missing fields; privacy/PII; permissible commercial use; preprocessing; train/test split; derived artifacts; deletion plan`.
