# ISSUE-007 — Add Book Metadata Fetch + Apply

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 self-contained exceptions, §8 metadata prefill)
- `../../FRONTEND_BLUEPRINT.md` (§5 Edge Functions, §6.5 autofill behavior, §10)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 4)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-006
- User stories covered:
  - As a user, I can paste a source URL and prefill the Add Book form from scraped metadata.

## What to build
Implement `MetadataFetcher` as a documented smart exception that calls metadata endpoint, previews payload, and safely patches the parent form without overwriting valid user input unexpectedly.

## Acceptance criteria
- [x] URL fetch action calls metadata endpoint and shows loading/success/error states.
- [x] Preview UI displays incoming metadata before apply.
- [x] Apply action maps metadata to `BookFormModel` and patches form safely.
- [x] Empty/partial metadata payloads do not corrupt existing form fields.
- [x] Tests cover mapping and non-destructive apply behavior.

## Blocked by
- Blocked by ISSUE-006.
