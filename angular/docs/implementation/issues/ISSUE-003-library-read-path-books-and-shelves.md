# ISSUE-003 — Library Read Path (Books + Shelves)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§3, §4 Repositories/Services, §6, §9)
- `../../FRONTEND_BLUEPRINT.md` (§4, §6.4, §9 Library load flow)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 2)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-001, ISSUE-002
- User stories covered:
  - As an authenticated user, I can open Bookshelf and see my books and shelves.

## What to build
Build the first complete data pipeline for library read operations: establish all three type layers and mapper functions, implement repository calls, wire service-owned signals, and render the baseline bookshelf (`BookGrid` + `BookCard`) with loading/empty/error states.

## Acceptance criteria
- [x] All three type layers are defined in `models/book.model.ts`: `BookRecord` (raw Supabase row), `Book` (domain model), `BookFormModel` (form state).
- [x] All three mapper functions are implemented in `models/mappers/book.mapper.ts`: `toBook()`, `toFormModel()`, and `toSupabasePayload()`.
- [x] Tests cover all three mapper directions — not just `toBook()` but also `toFormModel()` and `toSupabasePayload()` — including edge cases (null fields, empty arrays).
- [x] `BookRepository` and `ShelfRepository` return `Promise<Result<T>>` only — no raw Supabase responses leak past the repository boundary.
- [x] `BookService`/`ShelfService` expose signal state and derived values (e.g. `bookCount`, `averageScore`).
- [x] Bookshelf screen renders fetched books and shelf counts via smart/dumb component split.
- [x] Errors are surfaced in smart component UI (not swallowed).

## Blocked by
- Blocked by ISSUE-001.
- Blocked by ISSUE-002.
