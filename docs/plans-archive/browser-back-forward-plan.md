# Plan: Browser Back/Forward Button Support for Quiz Flow

## Objective
Enable browser back/forward navigation in the quiz flow so users can navigate between quiz selection steps using browser history.

## Current Flow (Single Page)
```
Home → Quiz → Subject → Chapter → Mode → Play → Results
```
All state is managed in-memory (useState), no URL changes.

## Target Flow (With URL History)
```
/                    → Home
/quiz               → Subject selection
/quiz?subject=animals → Chapter selection
/quiz?subject=animals&chapter=mammals → Mode selection
/quiz/play?subject=animals&chapter=mammals&mode=practice → Playing
/quiz/results → Results
```

## Implementation Plan

### Phase 1: URL State Management
1. **Modify quiz page.tsx to read URL params on load**
   - Check for `searchParams` (subject, chapter, mode)
   - Initialize state from URL params instead of useState defaults
   
2. **Update navigation to modify URL**
   - Use `window.history.pushState()` or Next.js router
   - Each selection updates URL without full page reload
   - Preserve query params through navigation

### Phase 2: Handle Browser Navigation
1. **Add popstate event listener**
   - Listen to `window.addEventListener('popstate', ...)`
   - Restore state from URL when back/forward pressed
   
2. **Sync state with URL**
   - State changes → URL updates
   - URL changes → State updates

### Phase 3: Testing & Refinement
1. Test back/forward at each step
2. Test bookmarking/sharing URLs
3. Handle edge cases (direct URL access, invalid params)

## Files to Modify

### apps/frontend/src/app/quiz/page.tsx
- Add useEffect to read URL params on mount
- Add popstate listener
- Update navigation functions to pushState
- Handle initial state from URL params

## Implementation Approach

```typescript
// Pseudo-code for quiz page.tsx

// 1. Read URL params
const [searchParams, setSearchParams] = useSearchParams();
const subject = searchParams.get('subject');
const chapter = searchParams.get('chapter');

// 2. Update URL on selection
const handleSubjectSelect = (slug: string) => {
  router.push(`/quiz?subject=${slug}`, undefined, { shallow: true });
};

// 3. Handle browser back/forward
useEffect(() => {
  const handlePopState = () => {
    // Read current URL and update state
    // This syncs state with browser history
  };
  
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);
```

## Alternative: Next.js useRouter
```typescript
const router = useRouter();

// Push to history (doesn't reload page)
router.push('/quiz?subject=animals', undefined, { shallow: true });

// Listen for changes
useEffect(() => {
  router.events.on('routeChangeComplete', () => {
    // Sync state
  });
}, [router.events]);
```

## Risks & Considerations
1. **Shallow routing** - Must use `{ shallow: true }` to avoid full page reload
2. **Server-side rendering** - URL params may not be available initially
3. **State sync** - Need to ensure state and URL stay in sync
4. **Results page** - May need separate route handling

## Success Criteria
- [ ] User can press browser Back to return to previous step
- [ ] User can press browser Forward to move forward
- [ ] URLs are shareable/bookmarkable
- [ ] Back button works correctly after page refresh
- [ ] No navigation loops or errors
