---

# QUIZ ARCHITECTURE
## (Ideal Pattern - Production-Ready)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    QuizMcqSection (~200 lines - Coordinator)             │
│                    Clean, Decomposed, Maintainable                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CUSTOM HOOKS (Logic Extracted)                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ useQuizState()         ← All data state (React Query)           │    │
│  │ useQuizFilters()       ← URL param synchronization              │    │
│  │ useSubjectsMutation()  ← Optimistic CRUD for subjects           │    │
│  │ useChaptersMutation()  ← Optimistic CRUD for chapters           │    │
│  │ useQuestionsQuery()    ← Paginated server fetch                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ REACT QUERY CACHE (Unified State Layer)                         │    │
│  │                                                                 │    │
│  │  Query Keys:                                                    │    │
│  │  ├── ['subjects']                    → Subject[]                │    │
│  │  ├── ['chapters', subjectId]         → Chapter[]                │    │
│  │  ├── ['filterCounts', filters]       → FilterCounts             │    │
│  │  ├── ['questions', filters, page]    → PaginatedQuestions       │    │
│  │  └── ['question', questionId]        → Single Question          │    │
│  │                                                                 │    │
│  │  Config:                                                        │    │
│  │  ├── staleTime: 30s (subjects/chapters - rarely change)         │    │
│  │  ├── staleTime: 10s (filter counts - change often)              │    │
│  │  ├── keepPreviousData: true (no loading flash)                  │    │
│  │  └── cacheTime: 5 minutes (garbage collection)                  │    │
│  │                                                                 │    │
│  │  ✅ SINGLE SOURCE OF TRUTH - React Query cache                  │    │
│  │  ✅ Automatic background refetch                                │    │
│  │  ✅ Automatic deduplication                                     │    │
│  │  ✅ Automatic retry on error                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  MUTATIONS (Optimistic Where Appropriate)                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ CREATE SUBJECT   → Optimistic                                   │    │
│  │   1. onMutate:  Update cache immediately                        │    │
│  │   2. onError:   Rollback cache                                  │    │
│  │   3. onSettled: Refetch to confirm                              │    │
│  │   API Calls: 1                                                  │    │
│  │                                                                 │    │
│  │ CREATE QUESTION  → Server Refetch (paginated)                   │    │
│  │   1. Invalidate ['questions'] and ['filterCounts'] queries      │    │
│  │   2. React Query auto-refetches affected pages                  │    │
│  │   API Calls: 1-2 (selective, not always both)                   │    │
│  │                                                                 │    │
│  │ DELETE SUBJECT   → Optimistic                                   │    │
│  │   1. Remove from cache immediately                              │    │
│  │   2. API confirms                                               │    │
│  │   API Calls: 1                                                  │    │
│  │                                                                 │    │
│  │ BULK ACTIONS     → Server Confirm                               │    │
│  │   1. Invalidate all affected queries                            │    │
│  │   2. Background refetch                                         │    │
│  │   API Calls: 1                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DECOMPOSED COMPONENTS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐     │
│  │  SubjectPanel   │  │  QuestionTable  │  │  QuestionFilters    │     │
│  │  (~150 lines)   │  │  (~200 lines)   │  │  (~100 lines)       │     │
│  │                 │  │                 │  │                     │     │
│  │ • Subject list  │  │ • Paginated rows│  │ • Filter inputs     │     │
│  │ • Subject CRUD  │  │ • Sortable cols │  │ • Search debounced  │     │
│  │ • Chapter list  │  │ • Bulk select   │  │ • URL sync          │     │
│  │ • Optimistic UI │  │ • Row actions   │  │ • Clear filters     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘     │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐     │
│  │ BulkActionToolbar│  │  ImportModal    │  │  QuestionModal      │     │
│  │  (~100 lines)   │  │  (~150 lines)   │  │  (~150 lines)       │     │
│  │                 │  │                 │  │                     │     │
│  │ • Bulk delete   │  │  • CSV upload   │  │ • Add/edit form     │     │
│  │ • Bulk status   │  │  • Preview      │  │ • Validation        │     │
│  │ • Export        │  │  • Confirm      │  │ • Auto-save draft   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘     │
│                                                                          │
│  ✅ Each component independently testable                               │
│  ✅ Props drill minimized via React Query context                       │
│  ✅ Reusable across different quiz types                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Clean, Cached)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  React Query handles:                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Deduplication (same key = single request)                     │    │
│  │ • Caching (staleTime, cacheTime)                                │    │
│  │ • Background refetch (window focus, network reconnect)          │    │
│  │ • Pagination (keepPreviousData)                                 │    │
│  │ • Retry logic (3 attempts, exponential backoff)                 │    │
│  │ • Polling (optional for real-time)                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  API Functions (thin wrappers):                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ fetchSubjects()        → GET /quiz/subjects                     │    │
│  │ fetchChapters(subject) → GET /quiz/chapters?subject=            │    │
│  │ fetchFilterCounts(f)   → GET /quiz/filter-counts                │    │
│  │ fetchQuestions(f, p)   → GET /quiz/questions                    │    │
│  │ mutateSubject(data)    → POST/PUT/DELETE /quiz/subjects         │    │
│  │ ...etc                                                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Scalable Design)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  API GATEWAY / LOAD BALANCER                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Rate limiting                                                 │    │
│  │ • Authentication                                                │    │
│  │ • Request routing                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                    ┌───────────────┼───────────────┐                    │
│                    ▼               ▼               ▼                    │
│              ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│              │Read API │     │Write API│     │Search   │               │
│              │(CQRS)   │     │(CQRS)   │     │Service  │               │
│              └────┬────┘     └────┬────┘     └────┬────┘               │
│                   │               │               │                      │
│                   ▼               ▼               ▼                      │
│            ┌──────────┐    ┌──────────┐    ┌──────────────┐             │
│            │Read DB   │    │Write DB  │    │Elasticsearch │             │
│            │(Replica) │    │(Primary) │    │              │             │
│            │PostgreSQL│    │PostgreSQL│    │              │             │
│            └──────────┘    └──────────┘    └──────────────┘             │
│                                                                          │
│  CACHE LAYER (Redis Cluster)                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Query result cache                                            │    │
│  │ • Session cache                                                 │    │
│  │ • Rate limit counters                                           │    │
│  │                                                                 │    │
│  │ Smart Invalidation:                                             │    │
│  │ • Subject created → invalidate subjects list only               │    │
│  │ • Question created → invalidate questions + filter counts       │    │
│  │ • Bulk action → invalidate by pattern or tags                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  CDN (Global Edge Cache)                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Public question content cached at edge                        │    │
│  │ • Static assets (images, fonts)                                 │    │
│  │ • API response cache for public endpoints                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCALING TIERS                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  0 - 1,000 questions                                                    │
│  ├── Simple pagination                                                  │
│  ├── Basic PostgreSQL indexes                                           │
│  ├── Single Redis instance                                              │
│  └── Single server                                                      │
│                                                                          │
│  1,000 - 10,000 questions                                               │
│  ├── React Query frontend cache                                         │
│  ├── Debounced search                                                   │
│  ├── Redis cache cluster                                                │
│  └── Database read replica                                              │
│                                                                          │
│  10,000 - 100,000 questions                                             │
│  ├── Cursor-based pagination (not offset)                               │
│  ├── Elasticsearch for full-text search                                 │
│  ├── Connection pooling                                                 │
│  └── Horizontal scaling (2-3 servers)                                   │
│                                                                          │
│  100,000+ (future consideration)                                        │
│  ├── CQRS (separate read/write databases)                               │
│  ├── Database sharding by subject/category                              │
│  ├── CDN for global distribution                                        │
│  ├── Queue-based bulk operations (Redis Bull/Celery)                    │
│  ├── Auto-scaling Kubernetes cluster                                    │
│  └── Multi-region deployment                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Principles

| Principle | Implementation |
|-----------|---------------|
| **Single Source of Truth** | React Query cache |
| **Optimistic Updates** | Immediate UI feedback |
| **Decomposed Components** | Each ~100-200 lines, independently testable |
| **Smart Caching** | staleTime, cacheTime, automatic background refetch |
| **Scalability** | Server-side pagination, Redis caching, Elasticsearch |

---
