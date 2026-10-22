# Data contract and rights

Only `sample/demo_cases.csv` is bundled. It is fictional data suitable for UI and API smoke tests, **not** ML evaluation.

Real source start: https://www.designkit.org/resources/1

- Never commit real customer files or sensitive survey data to the repository. Place local secrets and downloaded datasets under ignored `data/raw/`.
- Complete `project/DATA_SOURCE_REGISTER.csv` before any modelling.
- Preserve immutable raw, separate `data/interim/` and `data/processed/`; record transformations and entity granularity.
- Expected first specialist adapter: research_interviews.csv and observations.csv (templates only; populate with real consented study data).
- Check published licences and any upstream third-party content obligations before commercial use.
