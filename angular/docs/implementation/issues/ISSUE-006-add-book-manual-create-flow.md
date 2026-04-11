# ISSUE-006 — Add Book Manual Create Flow

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§8 Forms, §4 Service architecture, §9 Errors)
- `../../FRONTEND_BLUEPRINT.md` (§6.5 Add Book, §9 Create flow)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 3)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-003, ISSUE-005
- User stories covered:
  - As a user, I can manually add a book with metadata, sources, shelves, and related links.

## What to build
Build an end-to-end manual Add Book flow using typed reactive forms (`BookFormModel`) and sub-components (`BookFormFields`, `SourceManager`, `ShelfSelector`, `BookSearchLinker`), including create + related rows + shelf toggles.

## Acceptance criteria
- [x] Add Book screen supports manual data entry and form validation.
- [x] Save flow creates book row, then sources/relations, then shelf links.
- [x] The raw cover URL is stored as-is in Supabase at save time — no proxy or transformation is applied during persistence.
- [x] `CoverImage` component applies the Cloudflare Worker image proxy at render time, not at save time — these are separate concerns in separate components.
- [x] Success navigates to Bookshelf and state refreshes correctly.
- [x] Tests cover form mapping (`toSupabasePayload`) and save orchestration.

## Blocked by
- Blocked by ISSUE-003.
- Blocked by ISSUE-005.
