# ISSUE-011 — Realtime Sync

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§4 realtime effect, §6)
- `../../FRONTEND_BLUEPRINT.md` (§2 global state, §9 library load/update flows)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 2 and dependency order)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-003, ISSUE-009
- User stories covered:
  - As a user, I see library changes made on other devices reflected without a manual refresh.

## What to build
Tie the Supabase realtime subscription lifecycle to auth state in `BookService` using `effect()`. The subscription must start on login, stop on logout, and merge incoming events with the local signal state without creating duplicates or clobbering in-flight optimistic updates (established in ISSUE-009).

## Acceptance criteria
- [ ] Realtime subscription starts when `AuthService.currentUser` signal becomes non-null and stops when it returns to null.
- [ ] Incoming realtime INSERT/UPDATE/DELETE events update the `books` signal correctly.
- [ ] Realtime events arriving during an in-flight optimistic update do not revert the optimistic state prematurely.
- [ ] No component writes directly to service signals.
- [ ] Conflicting realtime events do not leave duplicate or stale entries in the signal.
- [ ] Tests cover subscription lifecycle (start/stop with auth) and event merge behavior.

## Blocked by
- Blocked by ISSUE-003.
- Blocked by ISSUE-009.
