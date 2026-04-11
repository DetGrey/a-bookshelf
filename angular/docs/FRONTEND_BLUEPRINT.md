# A Bookshelf Frontend Blueprint

This document is the master reference for recreating the frontend in any UI stack.

## 1. Purpose
A Bookshelf is a personal reading-library frontend. The current implementation is a web app, but this blueprint is intentionally framework-neutral so it can be recreated in a mobile app, desktop app, or different web stack.

It connects to a backend for authentication, persistence, and realtime updates, and it uses server-side scraping endpoints plus an image proxy for metadata and cover handling.

This blueprint describes:
- all screens
- all reusable components
- UI micro-elements
- data flow
- backend contracts
- logic rules
- safety checks
- flows and behaviors that matter when rebuilding the same product

## 2. App architecture

### Shell
- The app starts from a shell/root view.
- The shell wires auth/session state and library state.
- The shell renders the navigation and the active screen content area.
- The current web implementation uses a deployment base path, but other platforms can ignore that detail.

### Global state
- Auth/session layer
  - session and loading state
  - signIn, signUp, signOut helpers
- Library state layer
  - books, shelves, loading, error
  - cached fetches
  - realtime subscriptions
  - refetch helpers

### Core integration layers
- Identity/auth backend for sign-in and sign-up.
- Data storage backend for books, shelves, links, and relationships.
- Scraping endpoints for metadata and latest-chapter checks.
- Image proxy/storage layer for cover images.

## 3. Routes
- `/` → Dashboard
- `/bookshelf` → Bookshelf
- `/add` → Add Book
- `/book/:bookId` → Book Details
- `/login` → Login
- `/signup` → Signup
- `*` → redirect to home

Protected pages require a valid session.

For native platforms, treat each route as a screen or destination in the app navigation model.

## 4. Shared data model

### Book object shape
- id
- user_id
- title
- description
- cover_url
- genres[]
- language
- original_language
- score
- status
- last_read
- notes
- latest_chapter
- last_fetched_at
- last_uploaded_at
- times_read
- chapter_count
- created_at
- updated_at
- sources[]
- shelves[]

### Status keys
- reading
- plan_to_read
- waiting
- completed
- dropped
- on_hold

### Score scale
- 0 = N/A
- 1-10 = rated items

## 5. Backend contract summary

### Supabase tables
- profiles
- books
- shelves
- shelf_books
- book_links
- related_books

### Edge Functions
- `fetch-metadata`
- `fetch-latest`

### Cloudflare Worker
- uploads image URLs to R2
- serves proxied cover images
- falls back to the original URL when upload fails

### Platform-neutral mapping
- tables become collections/tables/models in the target stack
- edge functions become HTTP endpoints or server actions
- realtime subscriptions become push listeners, polling, or websocket updates
- the image proxy becomes any media caching service

## 6. Screen inventory

### 6.1 Login
Purpose:
- sign in existing users

UI:
- email field
- password field
- submit button
- error text
- signup link

Behavior:
- submit calls the auth backend sign-in flow
- redirects to the original protected page if present

### 6.2 Signup
Purpose:
- create an account

UI:
- email field
- password field
- confirm password field
- submit button
- error/success messages
- login link

Behavior:
- passwords must match
- sign-up uses the auth backend
- success redirects to login

### 6.3 Dashboard
Purpose:
- overview page and utilities hub

Visible sections:
- intro heading and Smart Add CTA
- stats cards
- genre breakdown
- source breakdown
- status sections
- quality tools
- backup/restore actions

Stats shown:
- total saved
- completed count
- waiting count
- last updated
- average score ignoring 0
- score 10 count

Breakdown logic:
- genre counts are per book, not per total occurrence
- source counts are by host name
- top five items are shown first, extras collapse behind a toggle

Tools:
- duplicate scan
- stale waiting scan
- cover checks and Cloudflare uploads
- genre consolidation

Data portability:
- download JSON backup
- upload JSON restore

The dashboard should remain useful even if some analytics or tools are simplified in a rebuild.

### 6.4 Bookshelf
Purpose:
- browse, filter, sort, and manage the full library

Layout:
- left sidebar with shelves
- main panel with filters and results

Shelf behavior:
- built-in status shelves
- custom shelves
- create shelf form
- delete custom shelf action

Controls:
- search box
- sort dropdown
- sort direction toggle
- language dropdown
- genre filter pills
- chapter count filter presets

Filtering and sorting rules:
- shelf filter is applied first
- genre filter can use ANY or ALL mode
- language filter compares normalized strings
- chapter count supports min/max semantics
- search scoring favors title matches over description matches
- relevance sort uses computed scores
- other sorts use timestamps, title, score, chapter count, or status

Pagination:
- 20 books per page
- previous/next buttons
- page selector
- visible range summary

Waiting updates:
- only appears on waiting shelf
- processes books in small throttled batches
- calls the latest-chapter endpoint for the first source URL
- updates only changed fields
- shows progress, summary, update details, and error details

Scroll/state memory:
- remembers selected page
- remembers scroll position
- remembers clicked anchor
- restores after returning from a book detail page

### 6.5 Add Book
Purpose:
- create a new library entry quickly from a source URL

Flow:
1. paste source URL
2. fetch metadata
3. review autofilled fields
4. add sources, shelves, and related books
5. save to library

UI pieces:
- URL input
- fetch metadata button
- `BookFormFields`
- `SourceManager`
- `BookSearchLinker`
- `ShelfSelector`
- save button
- preview card

Autofill behavior:
- metadata can fill title, description, cover, genres, language, original language, latest chapter, last uploaded time, and chapter count

Save behavior:
- cover URL may be proxied through an image storage service
- genres are converted from comma-separated text into arrays
- source links and relations are inserted after the book record is created
- selected shelves are toggled after creation
- success navigates to Bookshelf

### 6.6 Book Details
Purpose:
- inspect, edit, and manage a single book

Read mode UI:
- back button
- edit button
- delete button
- hero section with cover, title, description
- metadata stats grid
- fetch latest chapter action
- notes block
- source links block
- shelf block
- related books block
- genre pills that link back to Bookshelf filters

Edit mode UI:
- compact metadata fetch panel
- full editable form
- shelf selector
- editable source manager
- related books linker
- save and cancel buttons

Save behavior:
- normalizes score and times read
- processes cover URL through the image proxy/storage layer
- updates the main books row
- adds/removes source links
- adds/removes related links
- toggles shelf membership diffs
- refreshes global book context

Delete behavior:
- confirms before deleting
- removes the book
- returns to the dashboard

## 6.7 Angular parity follow-up scope (post-ISSUE-014)
This section captures confirmed parity gaps found after the first Angular completion pass. It is a tracking baseline for ISSUE-015 and should be treated as additive follow-up work.

Dashboard parity gaps:
- actionable genre consolidation flow (scan/select/merge/replace)
- actionable cover repair/upload workflow from quality checks

Bookshelf parity gaps:
- UI controls for genre filters and chapter-count range filters wired to existing filter state

Add/Edit parity gaps:
- shelf selector should use named shelf selection UX (not raw shelf-id entry)
- source manager should support richer source-item editing/removal behavior
- related-book linker should support searchable linking workflow and relation metadata

Book Details parity gaps:
- per-book latest-chapter fetch action with updated/skipped/error feedback

Issue linkage:
- tracked in `implementation/issues/ISSUE-015-react-parity-gap-closure.md`
- does not reopen ISSUE-000 through ISSUE-014

## 7. Reusable component inventory

### Navigation and auth
- `NavigationBar`
  - sticky nav
  - active route links
  - sign out
  - mobile hide-on-scroll behavior
- `ProtectedRoute`
  - loading spinner while session is being checked
  - redirect to login when unauthenticated
- `AuthForm`
  - shared auth form layout

### Book display
- `BookCard`
  - cover image
  - title
  - truncated description
  - status pill
  - score pill
  - language pills
  - reads/chapter count pills
  - note preview
  - genre pills
  - source links
  - shelf dropdown in bookshelf mode
- `BookGrid`
  - loading state
  - empty state
  - book card grid
- `CoverImage`
  - lazy load
  - fallback gradient cover
  - timeout handling for broken images

### Forms and editing
- `BookFormFields`
  - all core editable fields
- `MetadataFetcher`
  - fetch metadata panel with preview and apply action
- `SourceManager`
  - list sources
  - add a source
  - remove a source
- `ShelfSelector`
  - custom shelf selection pills
- `BookSearchLinker`
  - search books
  - add relation type
  - manage pending and saved related books

### Filtering and organization
- `ShelfSidebar`
  - built-in status shelves
  - custom shelves
  - create shelf form
  - delete shelf action
- `GenreFilter`
  - genre pills
  - any/all mode
- `ChapterCountFilter`
  - preset chapter count filters
  - min/max mode

### Maintenance tools
- `QualityChecks`
  - duplicate detection
  - stale waiting detection
  - cover checking and uploads
- `GenreConsolidator`
  - similar genre detection
  - bulk merge
  - manual replacement

## 8. Small UI elements that matter
- eyebrow labels
- muted helper text
- pill chips
- ghost buttons
- primary gradient buttons
- stat cards
- collapsible sections
- progress bars
- error/success text blocks
- hidden file input for backup restore
- compact labels inside pills and cards
- search result dropdown rows

## 9. Data flow rules

### Auth flow
1. App mounts.
2. AuthProvider loads session.
3. ProtectedRoute either renders the page or redirects.

### Library load flow
1. BooksProvider fetches books and shelves for the signed-in user.
2. Data is cached briefly.
3. Realtime events invalidate the cache and refetch.
4. Pages read from context rather than fetching independently where possible.

In a non-web platform, the same logic can be implemented with a repository or store layer feeding view models/state objects.

### Create flow
1. User fills Add Book form.
2. Book row is created.
3. Related rows are created.
4. Shelf relations are toggled.
5. Realtime refresh updates the app.

### Update flow
1. User edits Book Details.
2. Main row is updated.
3. Link and relation diffs are applied.
4. Shelf membership changes are toggled.
5. Context refetch syncs all views.

### Import/export flow
- Export builds a JSON object with profile, books, shelves, joins, and links.
- Restore upserts rows in chunks to avoid large payload issues.

If a target platform cannot perform full JSON restore natively, the same data can be imported through a file picker, share sheet, or server endpoint.

## 10. Quality logic to preserve
- Ignore score 0 in average calculations.
- Never overwrite a waiting book unless new data actually differs.
- Accept empty metadata payloads without corrupting the current book.
- Normalize language names and times read counts.
- Keep URLs and filter state in sync with the location bar.
- Preserve scroll position when navigating away and back.

For native apps, replace location-bar sync with equivalent screen state persistence.

## 11. Visual system summary
- dark theme
- teal/orange accent palette
- glassy cards
- rounded buttons and pills
- subtle blur and shadow
- modern library dashboard aesthetic
- high-density but readable layouts

## 12. Files that should exist in a recreated frontend
- app shell or root navigation
- auth/session state layer
- library data state layer
- data access helpers
- image proxy or media handling helper
- screen/view definitions
- shared widgets/components
- style/theme modules
- tests
- docs folder with blueprint, style guide, plan, and checklist

## 13. What makes this app feel like the current website
- fast browsing with compact cards
- powerful library tools in one dashboard
- clean visual hierarchy
- small but useful interaction details everywhere
- smart use of pills, cards, and collapsible controls
- practical quality tools for a personal collection
