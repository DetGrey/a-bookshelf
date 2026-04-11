# ISSUE-010 — Waiting Shelf Latest-Update Batch Flow

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§4 services, §6 data flow, §9 errors)
- `../../FRONTEND_BLUEPRINT.md` (§6.4 waiting updates, §5 `fetch-latest`, §10)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 4)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-004, ISSUE-008
- User stories covered:
  - As a user, I can batch-check waiting books for latest chapter updates with progress feedback.

## What to build
Implement waiting-shelf batch updates that process throttled calls to latest-chapter endpoint using first source URL, update only changed fields, and report per-item outcomes.

## Acceptance criteria
- [ ] Batch action appears only for waiting shelf context.
- [ ] Jobs execute in small throttled batches with progress UI.
- [ ] Only changed fields are persisted; unchanged books remain untouched.
- [ ] Summary includes updated count, skipped count, and error details.
- [ ] Tests cover changed-vs-unchanged update behavior.

## Blocked by
- Blocked by ISSUE-004.
- Blocked by ISSUE-008.
