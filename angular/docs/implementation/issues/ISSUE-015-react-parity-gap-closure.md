# ISSUE-015 — React Parity Gap Closure (Post-014)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 component rules, §6 data flow, §11 tests)
- `../../FRONTEND_BLUEPRINT.md` (§6.3 dashboard tools, §6.4 filters, §6.5 add/edit helpers, §6.6 book details)
- `../../FRONTEND_REPLICATION_CHECKLIST.md` (Dashboard, Bookshelf, Add Book, Book details, Utility tools)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 7 parity closure)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-014
- User stories covered:
  - As a user, Angular provides the same high-value maintenance and editing workflows as the React version.
  - As a maintainer, parity gaps are tracked in one issue without reopening completed ISSUE-000–014 tickets.

## What to build
Close the confirmed parity gaps between the React app and Angular app without regressing completed Angular slices. Implement missing/trimmed UX in focused vertical slices:

1. Dashboard quality tooling parity
   - Wire genre consolidation scan/select/merge/replace flow to `QualityToolsService`.
   - Extend cover-health actions beyond count messaging to include actionable repair workflow.

2. Bookshelf filtering parity
   - Expose genre filter controls (including mode behavior) and chapter min/max controls already supported by filter state.

3. Add/Edit helper parity
   - Upgrade `ShelfSelector` from manual shelf-id input to selectable named shelves.
   - Upgrade `SourceManager` from URL-only append to full source-item management UX.
   - Upgrade `BookSearchLinker` from manual related-id entry to searchable linker workflow with relation metadata.

4. Book details latest-check parity
   - Add per-book "Fetch latest chapter" action and result messaging in Book Details.

## Acceptance criteria
- [x] Dashboard exposes actionable genre consolidation workflow (not help-only placeholder).
- [x] Dashboard exposes actionable cover-repair workflow (not check-only summary).
- [x] Bookshelf UI exposes genre and chapter filters that drive existing URL/filter service state.
- [x] Add/Edit flows use shelf/source/related-book UX comparable to React behavior (no raw-ID-only workflows).
- [x] Book Details includes per-book latest-chapter fetch action with success/skip/error feedback.
- [x] Tests cover newly added parity flows and preserve existing ISSUE-014 pass baseline.
- [x] Existing ISSUE-000 through ISSUE-014 markdown files remain unchanged.

## Blocked by
- Blocked by ISSUE-014.

## Notes
- This issue is intentionally additive and does not reopen or re-scope completed issues.
- Keep architecture guardrails intact (`OnPush`, boundaries, service-driven mutations, no direct global DOM access).