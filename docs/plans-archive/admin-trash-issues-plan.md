# Admin Trash/Restore Issues - Working Plan

## Issues to Fix

### Issue 1: "No questions found" after moving to trash
- [ ] Investigate: What happens when question is moved to trash
- [ ] Fix: Ensure page refreshes or redirects correctly after trash action

### Issue 2: "No questions found" on next page after trash
- [ ] Investigate: Pagination logic after trash action
- [ ] Fix: Correct pagination state after moving to trash

### Issue 3: Flickering effect before page change
- [ ] Investigate: What's causing the flicker
- [ ] Fix: Smooth page transitions

### Issue 4: Restore from trash not working
- [ ] Investigate: Restore functionality
- [ ] Fix: Implement proper restore action

## Working Process
1. Investigate each issue
2. Implement fix
3. Build and deploy
4. Test on web
5. If not fixed, iterate

## Files to Check
- `apps/frontend/src/app/admin/components/QuestionManagementSection.tsx`
- Bulk action handlers
- Pagination logic
