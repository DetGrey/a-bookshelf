# ISSUE-009 — Book Details Edit/Save/Delete

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§8 forms, §4 optimistic rules, §9 errors)
- `../../FRONTEND_BLUEPRINT.md` (§6.6 edit mode/save/delete behavior, §9 Update flow)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 3)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-006, ISSUE-008
- User stories covered:
  - As a user, I can edit and save a book.
  - As a user, I can delete a book with confirmation.

## What to build
Implement edit mode for details using typed form controls and mutation orchestration: update core row, apply source/related diffs, apply shelf diffs, then sync global state with optimistic updates and rollback. Include delete flow with confirmation.

## Acceptance criteria
- [x] Edit mode toggles cleanly and preloads current values into typed form controls.
- [x] Save applies row + relation + shelf diff operations in deterministic order.
- [x] Save operations use optimistic updates — `BookService` signals are updated immediately and rolled back if the repository call returns `Result.success === false`.
- [x] Delete confirmation prevents accidental removal and returns to bookshelf on success.
- [x] Failure in any step surfaces a clear UI error, and any optimistic signal change is fully reverted.
- [x] Tests cover save diff logic, optimistic rollback on repository failure, and delete guardrails.

## Blocked by
- Blocked by ISSUE-006.
- Blocked by ISSUE-008.
