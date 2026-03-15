# Implementation Automation Workflow

## Overview

This document outlines the automated workflow for implementing the Quiz All Subjects feature, including automatic error scanning and fixing.

---

## Automation Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    START IMPLEMENTATION                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Implement Backend Changes                              │
│  1.1 quiz.service.ts - Add getAllQuestionsStatusCounts()       │
│  1.2 quiz.controller.ts - Add /questions/all endpoint           │
│  1.3 quiz.controller.ts - Add /questions/all/status-counts     │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Implement Frontend API Layer                           │
│  2.1 quiz-api.ts - Add getAllQuestions()                        │
│  2.2 quiz-api.ts - Add getAllQuestionsStatusCounts()           │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Implement Frontend Page.tsx                           │
│  3.1 Fix handleSubjectSelect URL sync                          │
│  3.2 Add handleGetAllQuestions handler                          │
│  3.3 Add handleGetAllQuestionsStatusCounts handler              │
│  3.4 Pass new props to QuestionManagementSection                │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Implement QuestionManagementSection                    │
│  4.1 Add new props to interface                                │
│  4.2 Add showAllSubjects state                                 │
│  4.3 Add allModeQuestions/Pagination/StatusCounts state        │
│  4.4 Add effects to fetch "All" mode data                      │
│  4.5 Add "All" button to subject filter row                    │
│  4.6 Show question counts next to subjects                      │
│  4.7 Update display logic for "All" mode                      │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: ERROR SCANNING PHASE                                   │
│  Run: npm run lint, npm run typecheck, npm run build           │
└─────────────────────────┬───────────────────────────────────────┘
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌───────────────┐       ┌───────────────┐
    │ ERRORS FOUND  │       │ NO ERRORS     │
    └───────┬───────┘       └───────┬───────┘
            │                       │
            ▼                       ▼
┌─────────────────────┐   ┌─────────────────────────┐
│ STEP 6: FIX ERRORS  │   │ STEP 7: VERIFY & TEST   │
│ Analyze & Fix       │   │ - Test "All" button    │
│ Go to STEP 5        │   │ - Test filters work     │
└─────────────────────┘   │ - Test counts display   │
                          │ - Test URL sync         │
                          └───────────┬─────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────┐
                          │    IMPLEMENTATION        │
                          │    COMPLETE              │
                          └─────────────────────────┘
```

---

## Error Scanning Commands

### Backend (NestJS)
```bash
cd apps/backend && npm run build
```

### Frontend (Next.js)
```bash
cd apps/frontend && npm run typecheck
npm run lint
npm run build
```

---

## Implementation Checklist

### Backend
- [x] Add `getAllQuestionsStatusCounts()` to quiz.service.ts
- [x] Add `GET /quiz/questions/all` endpoint to quiz.controller.ts
- [x] Add `GET /quiz/questions/all/status-counts` endpoint to quiz.controller.ts

### Frontend - API Layer
- [x] Add `getAllQuestionsWithFilters()` to quiz-api.ts
- [x] Add `getAllQuestionsStatusCounts()` to quiz-api.ts

### Frontend - page.tsx
- [x] Fix `handleSubjectSelect` to call `updateURL`
- [x] Add `handleGetAllQuestions` handler
- [x] Add `handleGetAllQuestionsStatusCounts` handler
- [x] Pass new props to QuestionManagementSection

### Frontend - QuestionManagementSection
- [x] Add new props to interface
- [x] Add showAllSubjects state
- [x] Add allModeQuestions/Pagination/StatusCounts state
- [x] Add effects to fetch "All" mode data
- [x] Add "All" button to subject filter row
- [x] Show question counts next to subjects
- [x] Update display logic for "All" mode
