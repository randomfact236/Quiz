# User Demographics & Analytics - Implementation Plan

## Overview

Collect user demographics on first visit and display in admin panel.

---

## Features

### Feature 1: Demographics Popup (Priority 1)

**When:** Shows on first website visit (only once per browser)

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| Country | Dropdown | All countries list |
| Sex | Two columns | Male / Female |
| Age Group | Dropdown | 10-15, 15-20, 20-25, 25-30, 30-35, 35-40, 40-45, 45-50, 50+ |

**Logic:**
1. Check if demographics already stored in localStorage → If yes, don't show
2. If logged in user without demographics → Show popup
3. If guest → Store in localStorage + session
4. After submit → Store in localStorage (never show again)

---

### Feature 2: Admin User Tables (Priority 2)

**Guest Users Table:**
| Field | Description |
|-------|-------------|
| ID | Session/Guest ID |
| Country | Selected country |
| Sex | Male/Female |
| Age Group | Selected age range |
| Created At | First visit date |
| Last Active | Last activity |

**Registered Users Table:**
| Field | Description |
|-------|-------------|
| ID | User UUID |
| Email | From Google/login |
| Name | From Google/login |
| Country | From demographics popup |
| Sex | From demographics popup |
| Age Group | From demographics popup |
| Created At | Registration date |
| Last Active | Last activity |

---

## Implementation Steps

### PHASE 1: Database & Backend

| # | Task | Status |
|---|------|--------|
| 1.1 | Add demographics fields to User entity | ✅ |
| 1.2 | Add guest demographics entity (for non-logged users) | ✅ |
| 1.3 | Create API endpoints for demographics | ✅ |
| 1.4 | Create admin endpoints for user lists | ✅ |

### PHASE 2: Frontend Popup

| # | Task | Status |
|---|------|--------|
| 2.1 | Create DemographicsPopup component | ✅ |
| 2.2 | Add to layout/providers | ✅ |
| 2.3 | Handle localStorage logic (show once) | ✅ |
| 2.4 | Submit to API | ⏳ Pending (needs API endpoint) |

### PHASE 3: Admin Panel

| # | Task | Status |
|---|------|--------|
| 3.1 | Create Users page with tabs (Guests/Registered) | ✅ |
| 3.2 | Guest Users table | ✅ |
| 3.3 | Registered Users table | ✅ |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER VISITS WEBSITE                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────────┐
                    │  Check localStorage          │
                    │  (hasSeenDemographics)        │
                    └───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │ YES                          │ NO
                    ▼                              ▼
            ┌───────────────┐            ┌─────────────────────┐
            │ Don't show    │            │ SHOW POPUP          │
            │ Popup         │            │ Country dropdown     │
            └───────────────┘            │ Sex (Male/Female)    │
                                        │ Age range dropdown    │
                                        └─────────────────────┘
                                                      │
                                                      ▼
                              ┌───────────────────────────────────────┐
                              │  User submits OR closes popup          │
                              │  Store in localStorage (show once)     │
                              │  Store in user profile (if logged in)  │
                              └───────────────────────────────────────┘
                                                      │
                                                      ▼
                              ┌───────────────────────────────────────┐
                              │  GUESTS: Store in localStorage       │
                              │  REGISTERED: Send to backend API      │
                              └───────────────────────────────────────┘
                                                      │
                                                      ▼
                              ┌───────────────────────────────────────┐
                              │  Admin Panel: View Users              │
                              │  - Guest Users table                   │
                              │  - Registered Users table              │
                              └───────────────────────────────────────┘
```

---

## File Structure

### Backend Changes

```
apps/backend/src/
├── users/
│   ├── entities/
│   │   └── user.entity.ts     → Add country, sex, ageGroup, lastActive
│   ├── users.service.ts       → Add demographics update methods
│   └── users.controller.ts    → Add admin user list endpoints
├── guest-users/
│   ├── entities/
│   │   └── guest-user.entity.ts   (NEW)
│   ├── guest-users.service.ts      (NEW)
│   └── guest-users.controller.ts   (NEW)
└── auth/
    └── auth.controller.ts     → Update demographics on login
```

### Frontend Changes

```
apps/frontend/src/
├── app/
│   ├── layout.tsx                     → Add DemographicsPopup
│   └── admin/
│       └── users/
│           └── page.tsx                (NEW) - Users management
├── components/
│   └── DemographicsPopup.tsx           (NEW)
└── lib/
    └── analytics.ts                   (NEW) - localStorage helpers
```

---

## Technical Details

### localStorage Keys

```typescript
DEMOGRAPHICS_SHOWN: boolean      // Popup shown
DEMOGRAPHICS_DATA: {
  country: string,
  sex: 'male' | 'female',
  ageGroup: string
}
GUEST_ID: string                 // Anonymous guest session ID
```

### User Entity Fields

```typescript
country?: string
sex?: 'male' | 'female'
ageGroup?: string
lastActive?: Date
```

### Guest User Entity

```typescript
guestId: string (unique)
country?: string
sex?: 'male' | 'female'
ageGroup?: string
createdAt: Date
lastActive: Date
```

---

## Time Estimate

| Phase | Time | Complexity |
|-------|------|-------------|
| Phase 1: Backend | 45-60 min | Medium |
| Phase 2: Popup | 30-45 min | Low |
| Phase 3: Admin | 30-45 min | Low |
| **Total** | **1.5-2.5 hours** | - |

---

## Dependencies

- Demographics popup needs to check localStorage
- Popup should not block page render
- Guest tracking works without login
- Logged-in users link demographics to their profile

---

## Future Enhancements (Phase 2)

- Quiz history tracking
- Score tracking
- Time spent tracking
- User journey analytics
- Conversion tracking (guest → registered)
