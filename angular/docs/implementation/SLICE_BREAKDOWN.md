# Proposed Vertical Slice Breakdown

This is adapted from the PRD-to-issues workflow, using docs as the parent source and local markdown files instead of GitHub issues.

0. **Title**: Project Scaffold + CI Setup
   **Type**: AFK
   **Blocked by**: None — start here
   **User stories covered**: ng new, Jest setup, environment files, 404.html trick, deploy.yml update

1. **Title**: Foundation Shell + Angular Guardrails  
   **Type**: AFK  
   **Blocked by**: ISSUE-000  
   **User stories covered**: app shell boot, route map, architectural rule enforcement

2. **Title**: Authentication + Guarded Navigation  
   **Type**: AFK  
   **Blocked by**: ISSUE-001  
   **User stories covered**: login, signup, protected routes, redirect behavior

3. **Title**: Library Read Path (Books + Shelves)  
   **Type**: AFK  
   **Blocked by**: ISSUE-001, ISSUE-002  
   **User stories covered**: bookshelf baseline rendering from backend data

4. **Title**: Bookshelf Filters, URL Sync, Pagination Memory  
   **Type**: AFK  
   **Blocked by**: ISSUE-003  
   **User stories covered**: search/sort/filter/pagination with URL state as source of truth

5. **Title**: Shelf Sidebar + Custom Shelf CRUD  
   **Type**: AFK  
   **Blocked by**: ISSUE-003  
   **User stories covered**: built-in/custom shelves, create/delete shelf, counts

6. **Title**: Add Book Manual Create Flow  
   **Type**: AFK  
   **Blocked by**: ISSUE-003, ISSUE-005  
   **User stories covered**: create book with form, sources, shelves, related links

7. **Title**: Metadata Fetch + Apply in Add Book  
   **Type**: AFK  
   **Blocked by**: ISSUE-006  
   **User stories covered**: fetch metadata from URL and apply safe autofill

8. **Title**: Book Details Read Mode + Resolver  
   **Type**: AFK  
   **Blocked by**: ISSUE-003  
   **User stories covered**: detail page read mode with resolver-first load

9. **Title**: Book Details Edit/Save/Delete Flow  
   **Type**: AFK  
   **Blocked by**: ISSUE-006, ISSUE-008  
   **User stories covered**: update/delete book + relation/shelf diffs

10. **Title**: Waiting Shelf Latest-Update Batch Flow  
    **Type**: AFK  
    **Blocked by**: ISSUE-004, ISSUE-008  
    **User stories covered**: waiting books batch latest-chapter checks with progress/errors

11. **Title**: Realtime Sync  
    **Type**: AFK  
    **Blocked by**: ISSUE-003, ISSUE-009  
    **User stories covered**: realtime refresh without clobbering in-flight optimistic updates

12. **Title**: Dashboard Analytics + Quality Hub Entry  
    **Type**: AFK  
    **Blocked by**: ISSUE-003  
    **User stories covered**: stats cards, breakdowns, maintenance hub

13. **Title**: Quality Tooling (Duplicates, Stale Waiting, Cover Health, Genre Consolidation)  
    **Type**: HITL  
    **Blocked by**: ISSUE-010, ISSUE-012  
    **User stories covered**: quality maintenance actions and cleanup operations

14. **Title**: Backup/Restore Portability + Final QA Gates  
    **Type**: HITL  
    **Blocked by**: ISSUE-011, ISSUE-013  
    **User stories covered**: JSON export/import recovery and end-to-end release checks

15. **Title**: React Parity Gap Closure (Post-014)  
   **Type**: HITL  
   **Blocked by**: ISSUE-014  
   **User stories covered**: close confirmed React→Angular feature/UX parity gaps without reopening completed issues

