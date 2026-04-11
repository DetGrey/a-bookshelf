# Frontend Implementation Plan

This plan breaks the frontend into practical build phases so the app can be recreated in a controlled order, regardless of the UI framework or target platform.

## Phase 0 — Foundation
Goal: create the application shell and core wiring before any feature work.

### Tasks
- Define the app shell structure.
- Configure backend client configuration and secrets.
- Add auth/session state management.
- Add library state management.
- Create the route/navigation map.
- Add protected routing or guarded screens.
- Add shared design tokens and layout scaffolding.

### Output
- App boots cleanly.
- Auth state works.
- Protected pages redirect correctly.
- Global shell renders with navigation and content outlet.

## Phase 1 — Authentication and shell
Goal: users can sign in and see the app.

### Tasks
- Build Login screen.
- Build Signup screen.
- Wire sign-in, sign-up, and sign-out actions.
- Add loading and session checks.
- Hide navigation on auth pages.

### Output
- Login and signup flows complete.
- Unauthenticated users are gated.
- Authenticated users return to their intended page.

## Phase 2 — Core library data
Goal: the app can read and display books and shelves.

### Tasks
- Implement book fetch and shelf fetch logic.
- Normalize the library data shape.
- Add short-lived cache behavior.
- Add realtime synchronization for books and shelves.
- Build Bookshelf view.
- Build ShelfSidebar.
- Build BookGrid and BookCard.

### Output
- Library loads from the data backend.
- Shelf counts work.
- Book cards render consistently.
- Realtime changes refresh the UI automatically.

## Phase 3 — Add and edit flows
Goal: the app can create and update book entries.

### Tasks
- Build AddBook page.
- Build BookDetails page.
- Build BookFormFields.
- Build SourceManager.
- Build ShelfSelector.
- Build BookSearchLinker.
- Wire create, update, delete, link, and shelf toggle actions.
- Add cover image proxy processing.

### Output
- A new book can be created from scratch or from scraped metadata.
- Existing books can be edited safely.
- Sources, shelves, and related books persist correctly.

## Phase 4 — Metadata and scraping
Goal: the app can pull external site data.

### Tasks
- Deploy metadata scraping endpoints.
- Deploy latest-status update endpoints.
- Handle metadata preview and apply flow.
- Handle waiting shelf update checks.
- Normalize response payloads and timestamps.

### Output
- Scraped metadata autofills forms.
- Waiting books can be checked in batches.
- Up-to-date fields are not overwritten unnecessarily.

## Phase 5 — Quality tooling
Goal: the app can audit and clean the library.

### Tasks
- Build duplicate title scanner.
- Build stale waiting checker.
- Build cover checker and image upload/proxy flow.
- Build genre consolidator with merge/replacement tools.
- Add caches for expensive scans.

### Output
- The dashboard includes library maintenance tools.
- Duplicate books and messy genres can be cleaned up.
- Broken or external cover URLs can be repaired.

## Phase 6 — Portability and polish
Goal: the app is usable as a long-term personal tool.

### Tasks
- Add JSON backup download.
- Add JSON restore upload.
- Confirm data portability of books, shelves, links, and profile.
- Implement scroll restore and pagination memory.
- Tune responsive layouts and accessibility.
- Validate via tests.

### Output
- The app survives refreshes and navigation smoothly.
- Backup/restore supports full recovery.
- Mobile and desktop UX feel deliberate.

## Suggested build order within each phase
1. UI skeleton.
2. State and data hooks.
3. API calls.
4. Loading/error states.
5. Persistence/optimistic updates.
6. Cleanup and responsive styling.

## Important dependency order
- Auth/session state before data-dependent screens.
- Library state before any page that consumes books.
- Data-layer helpers before page actions.
- Style tokens before component polish.
- Scraping/back-end endpoints before scrape-heavy features.

## Done criteria for each feature
A feature is complete when it has:
- UI state
- backend integration
- error handling
- empty/loading states
- responsive behavior
- test coverage or a clear validation path

## Platform translation note
These phases are intentionally framework-neutral. They can be implemented in Kotlin Android, SwiftUI, Flutter, React, Vue, Svelte, or any other stack by mapping:
- auth/session state to the platform’s session model
- library data to the platform’s state store
- route pages to screens/views
- reusable components to native widgets or view components
- styles to the platform’s design system/theme tokens
