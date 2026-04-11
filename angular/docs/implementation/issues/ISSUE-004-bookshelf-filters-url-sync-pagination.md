# ISSUE-004 — Bookshelf Filters, URL Sync, and Pagination Memory

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§6 Data flow rules, §7 Routing)
- `../../FRONTEND_BLUEPRINT.md` (§6.4 Bookshelf, §9 Data flow rules, §10)
- `../../FRONTEND_REPLICATION_CHECKLIST.md` (Bookshelf)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-003
- User stories covered:
  - As a user, I can search, filter, and sort books.
  - As a user, my filter and page state survives navigation and refresh.

## What to build
Implement `BookshelfFilterService` as the sole query-param owner and wire search/sort/language/genre/chapter filters plus pagination. URL state must remain the single source of truth. The service reads `ActivatedRoute` query params into typed signals and exposes `updateFilter()` — the only public mutation method. Components never touch the router directly.

## Acceptance criteria
- [ ] `BookshelfFilterService` is the only class that calls `Router.navigate()` for filter state — components call `filterService.updateFilter()` only.
- [ ] No component inside `features/bookshelf/` imports `Router` directly for filter-state purposes.
- [ ] Filter controls update URL query params and restore correctly on reload.
- [ ] Sorting/filtering logic follows documented ordering and semantics.
- [ ] Pagination works with page size and state persistence rules.
- [ ] Scroll and selected-anchor memory restore after returning from details.
- [ ] Tests cover query-param derivation, `updateFilter()` navigation calls, and round-trips.

## Blocked by
- Blocked by ISSUE-003.
