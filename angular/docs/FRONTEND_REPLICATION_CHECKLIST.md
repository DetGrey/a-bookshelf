# Frontend Replication Checklist

Use this as a final pass when recreating the frontend.

## Core app shell
- [ ] App starts cleanly in the chosen platform/framework.
- [ ] Navigation or routing structure is correct.
- [ ] Global shell renders navigation and active content.
- [ ] Auth screens hide the main navigation when needed.

## Authentication
- [ ] Login works through the chosen auth backend.
- [ ] Signup validates password confirmation.
- [ ] Protected pages redirect unauthenticated users.
- [ ] Session loading state is visible.

## Global state
- [ ] Auth/session layer exposes current user/session and auth actions.
- [ ] Library state layer loads books and shelves.
- [ ] Library state layer caches data for a short TTL.
- [ ] Realtime or sync updates refresh the local state.

## Dashboard
- [ ] Stats cards render library totals.
- [ ] Genre breakdown shows top genres and expandable extras.
- [ ] Source breakdown groups by host.
- [ ] Quality tools render correctly.
- [ ] Backup and restore work.

## Bookshelf
- [ ] Sidebar lists built-in status shelves.
- [ ] Custom shelves can be created and deleted.
- [ ] Search, sort, language, genre, and chapter filters work.
- [ ] Filter state persists to the URL.
- [ ] Pagination works and remembers the last page.
- [ ] Waiting shelf update checker works with progress and error details.

## Add Book
- [ ] URL metadata fetch works.
- [ ] Autofill populates the form.
- [ ] Manual editing still works after autofill.
- [ ] Sources can be added before save.
- [ ] Related books can be queued.
- [ ] Shelf selection can be pre-applied.
- [ ] Cover URLs are proxied when needed.

## Book details
- [ ] Read mode shows hero, stats, notes, sources, shelves, related books.
- [ ] Edit mode shows full editable form.
- [ ] Save updates core data and relationships.
- [ ] Delete confirmation works.
- [ ] Fetch latest chapter works.

## Utility tools
- [ ] Duplicate scanner works.
- [ ] Stale waiting checker works.
- [ ] Cover checker works.
- [ ] Image upload/proxy flow works.
- [ ] Genre consolidator merges or replaces cleanly.

## Backend and storage
- [ ] `books`, `shelves`, `shelf_books`, `book_links`, `related_books`, `profiles` exist.
- [ ] RLS policies restrict access to owner rows.
- [ ] Metadata endpoint responds with metadata payloads.
- [ ] Latest-chapter endpoint responds with latest chapter payloads.
- [ ] Image proxy/storage layer stores and serves covers.

## UX polish
- [ ] Loading and empty states are present everywhere.
- [ ] Error messages are visible and actionable.
- [ ] Focus outlines are visible.
- [ ] Touch targets are large enough.
- [ ] Desktop and mobile layouts both feel intentional.

## Quality assurance
- [ ] Unit tests pass.
- [ ] Component tests pass.
- [ ] Lint passes.
- [ ] Build passes.
- [ ] JSON backup/restore round-trips cleanly.
