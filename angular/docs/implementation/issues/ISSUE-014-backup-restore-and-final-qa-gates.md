# ISSUE-014 — Backup/Restore Portability + Final QA Gates

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§11 testing strategy, §13 architectural checklist)
- `../../FRONTEND_BLUEPRINT.md` (§6.3 data portability, §9 import/export flow, §12)
- `../../FRONTEND_REPLICATION_CHECKLIST.md` (Quality assurance, backend and storage)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 6)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-011, ISSUE-013
- User stories covered:
  - As a user, I can export and restore my full library safely.
  - As a team, we can verify readiness with repeatable QA gates.

## What to build
Implement JSON export/import portability flow for profile + books + shelves + joins/links, with chunked restore and validation messaging. Add final QA gates (lint, build, tests, checklist pass) to define release readiness.

## Acceptance criteria
- [x] Export generates a complete JSON payload for all required entities.
- [x] Restore supports chunked upsert with error reporting and partial-failure handling.
- [x] Round-trip backup/restore preserves key relations and critical fields.
- [x] Release checklist includes lint/build/tests and architecture-rule compliance checks.
- [x] Final validation notes are documented in the implementation docs folder.

## Blocked by
- Blocked by ISSUE-011.
- Blocked by ISSUE-013.

## Validation notes
- `npm test -- --runInBand` passed: 24 suites, 98 tests.
- `npm run build` passed.
- `npx eslint src/app --ext .ts,.js,.jsx` completed without reported errors.
