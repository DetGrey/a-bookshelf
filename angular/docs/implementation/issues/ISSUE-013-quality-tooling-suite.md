# ISSUE-013 — Quality Tooling Suite (Duplicates, Stale Waiting, Cover Health, Genre Consolidation)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§4 services, §9 errors, §11 tests)
- `../../FRONTEND_BLUEPRINT.md` (§6.3 tools, §7 maintenance tools, §10 quality logic)
- `../../FRONTEND_REPLICATION_CHECKLIST.md` (Utility tools)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-010, ISSUE-012
- User stories covered:
  - As a user, I can detect and clean library quality issues from one toolset.

## What to build
Implement maintenance workflows for duplicate detection, stale waiting detection, cover URL checks/upload-repair, and genre merge/replace operations. Include review checkpoints for merge policy and destructive action confirmations.

## Acceptance criteria
- [x] Duplicate and stale-waiting scans produce actionable grouped results.
- [x] Cover checker detects broken/external URLs and can trigger proxy/upload repair.
- [x] Genre consolidator supports merge/replace with explicit confirmation.
- [x] Expensive scans use caching to avoid repeated heavy work.
- [x] Tests validate tool outputs and guardrails around destructive cleanup actions.

## Blocked by
- Blocked by ISSUE-010.
- Blocked by ISSUE-012.
