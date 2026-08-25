# Plans

All forward-looking planning documents. Analysis ledgers live in [../features/](../features/) and [../platform/](../platform/); superseded old plans in [../archive/](../archive/).

| Plan                                           | Purpose                                                                                                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [build-forward-plan.md](build-forward-plan.md) | Master execution order: Phase 0 (done) → 0.5 migration baseline → 1 P0 bugs + DB foundation → 2 content pipeline → 3 security/concurrency → 4 CI/quality → 5 sessions → new capabilities |
| [capacity-plan.md](capacity-plan.md)           | Scale architecture for 50k questions / 20k daily visitors: golden rules, random_weight technique, caching, deferred add-ons                                                              |
| [code-quality-plan.md](code-quality-plan.md)   | Quality metrics per phase, monolith split targets, shared content-module kit, TS strictness ladder, enforcement                                                                          |

## Architecture Reference (original specs)

[architecture/quiz/](architecture/) — the original quiz-system specification set that the implementation was built against:

- `feature-list.md` — feature scope
- `implementation-detail.md` — endpoint-by-endpoint build spec
- `quiz-user-experience.md` — UX flows
