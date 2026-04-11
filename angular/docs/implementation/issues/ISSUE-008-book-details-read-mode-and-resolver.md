# ISSUE-008 — Book Details Read Mode + Resolver

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§7 `bookDetailResolver`, §5 component rules)
- `../../FRONTEND_BLUEPRINT.md` (§6.6 Book Details read mode, §9 Update flow)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 3)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-003
- User stories covered:
  - As a user, I can open a book details page and view all primary metadata and relations.

## What to build
Implement detail route resolver and read-mode details UI (hero, metadata grid, notes, sources, shelves, related books) so the page receives resolved data before initial render.

## Acceptance criteria
- [x] Route uses resolver to fetch `book/:bookId` before component initial render.
- [x] Read mode shows core sections with fallbacks for missing values.
- [x] Genre pills can route back to Bookshelf filters.
- [x] Resolver and details errors surface appropriately.
- [x] Tests cover resolver success/failure and read-mode rendering.

## Blocked by
- Blocked by ISSUE-003.
