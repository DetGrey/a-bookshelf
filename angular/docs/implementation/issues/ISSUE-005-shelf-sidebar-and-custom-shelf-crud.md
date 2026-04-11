# ISSUE-005 — Shelf Sidebar + Custom Shelf CRUD

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§4 Service architecture, §5 Component rules, §6)
- `../../FRONTEND_BLUEPRINT.md` (§6.4 Bookshelf, §7 ShelfSidebar)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 2)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-003
- User stories covered:
  - As a user, I can create and delete custom shelves.
  - As a user, I can browse built-in status shelves and custom shelves with counts.

## What to build
Implement shelf management end-to-end for sidebar operations: create/delete custom shelves, render shelf counts, and ensure shelf selection affects bookshelf result sets.

## Acceptance criteria
- [x] Built-in status shelves and custom shelves render in sidebar with counts.
- [x] Create shelf and delete shelf actions persist through repository/service layers.
- [x] Current shelf selection updates list results and URL state.
- [x] Failure states show actionable messages without corrupting local UI state.
- [x] Tests cover custom shelf CRUD and count recalculation.

## Blocked by
- Blocked by ISSUE-003.
