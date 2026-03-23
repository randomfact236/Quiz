# Cleanup Tasks - To Do Later

## Date: 2026-03-18

---

## Lint Warnings (Non-blocking)

These are warnings only - build passes successfully. Can be fixed later if needed.

### React Hooks Dependencies
| File | Line | Issue |
|------|------|-------|
| `apps/frontend/src/app/quiz/page.tsx` | 228 | Missing dependency 'openCategories.size' |
| `apps/frontend/src/app/riddles/components/RiddleCard.tsx` | 208 | Missing dependency 'activeShownBubblesRef' |
| `apps/frontend/src/app/riddles/play/page.tsx` | 180, 242, 265, 274, 355 | Multiple missing dependencies |
| `apps/frontend/src/components/quiz/FloatingBackground.tsx` | 54 | Missing dependencies 'count' and 'emojis' |
| `apps/frontend/src/components/quiz/QuestionCard.tsx` | 226 | Missing dependency 'activeShownBubblesRef' |

### Image Optimization
| File | Line | Issue |
|------|------|-------|
| `apps/frontend/src/app/admin/components/QuizManagementSection.tsx` | 435 | Use `<Image />` instead of `<img>` |
| `apps/frontend/src/app/admin/page.tsx` | 579 | Use `<Image />` instead of `<img>` |

---

## Future Enhancements (From Feature List)

### Filter System (Future)
- [ ] Filter Presets (save combinations, localStorage persistence)
- [ ] Sort Options (sort by date, level, status)
- [ ] Date Range Filter (filter by creation/update date)
- [ ] Redis Caching (for 100K+ questions)

### Other
- [ ] Materialized Views (NOT recommended - real-time AJAX, no pre-computation needed)

---

## Notes

- Build is clean with `--no-lint` flag
- All core functionality works correctly
- Lint warnings are pre-existing and don't affect production
