# ISSUE-012 — Dashboard Analytics + Quality Hub Entry

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 component rules, §6 data flow)
- `../../FRONTEND_BLUEPRINT.md` (§6.3 Dashboard, §10 quality logic)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 5)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-003
- User stories covered:
  - As a user, I can view dashboard stats and launch maintenance tools.

## What to build
Implement dashboard view with summary metrics and breakdown sections (genre/source/status), including business rules such as score-average ignoring zero and expandable top-five behavior.

## Acceptance criteria
- [x] Dashboard renders stat cards and breakdown blocks from service data.
- [x] Average score excludes unrated/zero values per documented rule.
- [x] Breakdown sections support top-five + expandable extras behavior.
- [x] Quality tools and backup/restore entry points are visible.
- [x] Tests cover key metric calculations and section toggling.

## Blocked by
- Blocked by ISSUE-003.
