# Archived Documents

Superseded audit/plan files moved here during the documentation consolidation. Their findings have been verified and folded into the authoritative docs: `docs/features/archive/` (legacy per-feature ledgers — obsolete, superseded by `plan/0X-*.md` TODO files) and `docs/platform/` (cross-cutting). Do not update these.

| Archived file                                        | Superseded by                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| 02-quiz-module.md + 05-backend-quiz-content.md       | features/quiz.md (merged FE+BE)                               |
| 03-riddle-mcq-frontend.md + 04-riddle-mcq-backend.md | features/riddle-mcq.md (merged FE+BE)                         |
| 01-frontend-core.md                                  | platform/frontend-core.md (moved)                             |
| 06-auth-users-guests.md                              | features/auth-users.md (moved)                                |
| 07-backend-platform-core.md                          | platform/backend-core.md (moved)                              |
| 08-image-riddles.md                                  | features/image-riddles.md (moved)                             |
| 09-dad-jokes.md                                      | features/dad-jokes.md (moved)                                 |
| 10-testing-quality-tooling.md                        | platform/testing-quality.md (moved)                           |
| 11-devops-and-deployment.md                          | platform/devops-deployment.md (moved)                         |
| 12-docs-and-reference.md                             | platform/documentation.md (moved)                             |
| FEATURE_PARITY_AUDIT.md                              | Per-feature parity tracked in each features/\*.md file        |
| FEATURE_PARITY_AUDIT_VERIFICATION.md                 | Verification folded into each feature's status sections       |
| NAMING_INCONSISTENCY_AUDIT.md                        | Naming issues noted inline in riddle-mcq.md / quiz.md         |
| RIDDLE-MCQ-DOCUMENTATION.md                          | features/riddle-mcq.md                                        |
| RIDDLE-MCQ-REFACTOR-PLAN.md                          | Open items captured in riddle-mcq.md roadmap                  |
| RIDDLE-RENAME-PLAN.md                                | Completed rename verified in riddle-mcq.md                    |
| JOKE_SECTION_AUDIT.md (was apps/frontend/)           | dad-jokes.md tracks applied vs open audit items               |
| riddle-mcq-admin-plan.md (was docs/)                 | Admin surface section of riddle-mcq.md                        |
| riddle-mcq-backend-plan.md (was docs/)               | features/riddle-mcq.md §Backend                               |
| riddle-mcq-implementation-plan.md (was docs/)        | features/riddle-mcq.md                                        |
| true-ideal-approach-plan.md (was docs/)              | Architecture decisions reflected across features/ + platform/ |

Note: transient runtime artifacts (`backend*.log`, `temp_crash.log`, `tsconfig.tsbuildinfo`, etc.) were deleted outright — see `platform/testing-quality.md`.
