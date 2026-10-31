# ResumeLoop spatial journey — design

Date: 31 October 2026. Status: approved by owner (architecture section approved; owner asked to build end to end without further review gates).

## Decisions taken in brainstorming
| Topic | Decision |
|---|---|
| UI direction | Option C, full spatial 3D journey, with a required accessible 2D twin for every 3D view (`AGENTS.md`) |
| Art direction | Night constellation road; light theme renders the same scene as a dawn sky |
| AI | Local open models via Ollama: `qwen2.5:7b` (generation), `bge-m3` (embeddings). Offline fallback to labelled deterministic text |
| Deployment | Full app local; public read-only demo on Vercel using bundled fictional data and recorded AI answers |
| Team | Undecided; contributors are optional names on studio items and story-mode presenters |
| Time | 20+ hour pre-term sprint, then 12 h/week |
| Repo rules | Commit as the owner with no AI co-author trailers; push after every verified slice |

## Architecture (approach 1)
One Next.js frontend (`apps/web`) talks to a `ResumeLoopClient` interface with two implementations:
- `liveClient` calls FastAPI (`services/api`) → SQLite + Ollama.
- `demoClient` (enabled by `NEXT_PUBLIC_DEMO_MODE=1`) reads bundled fixtures produced by the same backend (`scripts/export_demo_fixtures.py`) and keeps visitor edits in `localStorage`. Recorded AI answers carry model name and timestamp and are labelled "Recorded answer".

### Backend modules (`services/api/app/`)
| Module | Responsibility |
|---|---|
| `course.py` | Typed, versioned course-action schema; fictional course with versions v1 and v2; deterministic diff |
| `planner.py` | Feasible plan under a minute budget: excludes completed actions, re-evaluates newly unlocked dependents, rejects duplicate/unknown/cyclic prerequisites, explains every inclusion/exclusion, abstains on missing durations |
| `progress.py` | Learner progress autosave with optimistic version check (stale write → 409) |
| `ai/llm.py` | Ollama client with timeout; reports `available`/`unavailable`; never raises into routes |
| `ai/retrieval.py` | Chunked fictional course notes, embeddings cached in SQLite, cosine top-k, score threshold for abstention |
| `ai/features.py` | Digest wording, grounded coach answers, escalation drafts, qualitative code suggestions. Every LLM output is validated (citations must reference supplied IDs; quoted spans must exist in the note) or replaced by a labelled fallback/abstention |
| `escalations.py` | Draft → approved → queued (local only). Idempotency key. Nothing is ever sent externally |
| `studio.py` | Research notes (consent flags, participant code, synthetic flag), codes (accept/reject), themes, empathy map, HMW statements, ideas, votes, alternatives scoring, experiments (frozen protocol, sessions, results), AI decision log |

### Frontend routes
`/` 3D night road (journey) · `/plan` 2D twin with time budget · `/digest` what changed · `/coach` grounded chat · `/escalations` approval queue · `/studio/empathy` · `/studio/ideate` · `/studio/experiments` · `/studio/ethics` · `/story` 3D presentation mode · `/review` existing review queue · `/imports` existing import journey · `/settings`.

## 3D world
- React Three Fiber scene: star field, a road built from a Catmull-Rom curve, one star per course action positioned along the road by plan order.
- Encoding: completed = teal, next action = large purple, planned within budget = white, locked = dim; prerequisite edges drawn as thin lines. Legend in words, never colour alone.
- Camera eases to the next action; time-budget slider re-runs the planner and the road re-lights.
- Accessibility: DOM overlay lists every star as a focusable button (keyboard, screen reader); `prefers-reduced-motion` disables twinkle and camera easing; no WebGL → automatic link to `/plan`.
- Story mode: six stops (Empathise, Define, Ideate, Prototype, Test, Impact/SDG 4). Each stop shows live counts from the studio or an explicit "no evidence yet". Arrow keys/space advance; presenter name per stop.

## Honesty rules
- Demo and local studio seeds are fictional and labelled "Fictional example — not research data". Local studio starts empty; fictional examples load only on request.
- AI never writes findings directly: suggestions need accept/reject; escalations need approval; every AI call is logged in the ethics panel.
- Coach answers must cite `[S#]` sources that were retrieved; otherwise it abstains and offers escalation.
- No real deadlines: due dates carry `unverified` / `verified` / `conflict` states from the fictional source.

## Error handling
API unavailable → visible banner with retry; Ollama unavailable → fallback text labelled "AI offline: deterministic summary"; WebGL unavailable → 2D twin; stale progress write → reload prompt; invalid AI output → abstain.

## Testing
pytest for schema validation, planner (completed, unlock chains, cycles, duplicates, unknown prerequisites, zero/negative/insufficient budget), diff, progress conflicts, AI validators (with a fake LLM), escalation idempotency, studio CRUD and experiment statistics. `npm run typecheck` and `npm run build` for both modes. Browser verification in the built-in browser for each slice.

## Build order (each slice verified, committed and pushed)
1. Backend core: course, planner, progress + tests.
2. Frontend shell, client interface, 3D night road, `/plan` twin.
3. AI layer: digest, coach, escalations.
4. Design Thinking studio: empathy, ideate, experiments, ethics.
5. Story mode, demo fixtures, Vercel deployment.
6. End-to-end verification, documentation and continuity files.

## Out of scope
Authentication, multi-tenancy, real course data, real participant data, external messaging, payments.
