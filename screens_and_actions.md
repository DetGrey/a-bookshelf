# Screens, UI Elements, and User Actions Audit (Angular Version)

This document provides a comprehensive audit of all screens, UI elements, inputs, informational displays, and every user action available in the Angular version of **A Bookshelf**, with a specific focus on **mobile responsive layouts**.

---

## Table of Contents
1. [Global Layout & Responsive Navigation Header](#1-global-layout--responsive-navigation-header)
2. [Login Screen (`/login`)](#2-login-screen-login)
3. [Signup Screen (`/signup`)](#3-signup-screen-signup)
4. [Bookshelf Screen (`/bookshelf`)](#4-bookshelf-screen-bookshelf)
5. [Dashboard Screen (`/dashboard`)](#5-dashboard-screen-dashboard)
6. [Smart Add Screen (`/add`)](#6-smart-add-screen-add)
7. [Book Details Screen (`/book/:bookId`)](#7-book-details-screen-bookbookid)

---

## 1. Global Layout & Responsive Navigation Header
The global shell (`app-shell`) encapsulates the main content and handles dynamic, responsive hiding/revealing of the navigation bar on small viewports.

### UI Elements & Fields (Mobile presentation):
* **Responsive Navigation Bar (`.app-nav`):**
  * On mobile viewports (< 768px), the navbar is fixed at the top and auto-hides when scrolling down, reappearing when scrolling up (with a threshold of 70px scroll depth and 140px upward drag).
* **Brand Logo & Mark (`.brand`):**
  * fav-icon image (`a_bookshelf_favicon.png`).
  * Title text: `A Bookshelf` (strong).
  * Subtitle text: `Personal library HQ` (muted).
* **Navigation Links (`.nav-links`):**
  * Stacks horizontally on mobile. Contains links for: `Dashboard`, `Bookshelf`, and `Smart Add`.
* **Actions Panel (`.nav-actions`):**
  * Stacks at the end of the navigation. Shows:
    * Logged-in user's email address (hidden or truncated on very small mobile screens).
    * `Sign out` button.
  * If logged out:
    * `Log in` ghost link button.
    * `Create account` ghost link button.

### User Actions:
* **Click Logo / Brand Mark:** Navigates back to the Dashboard page (`/dashboard`).
* **Click "Dashboard" Link:** Navigates to the Dashboard page (`/dashboard`).
* **Click "Bookshelf" Link:** Navigates to the Bookshelf page (`/bookshelf`).
* **Click "Smart Add" Link:** Navigates to the Smart Add page (`/add`).
* **Click "Sign out" Button:** Signs out using `AuthService` and redirects to `/login`.
* **Click "Log in" / "Create account" Links:** Navigates to the respective authentication screens.

---

## 2. Login Screen (`/login`)
A centered, responsive authentication card layout (`.auth-card`) designed to scale cleanly to mobile screen widths.

### UI Elements & Fields:
* **Eyebrow Header:** `Welcome back` text.
* **Main Heading:** `Login` (h1).
* **Subheading:** `Sign in to continue to your bookshelf.` (muted text).
* **Email Field:** Label name `Email` with a single-line text input field (type `email`, validated).
* **Password Field:** Label name `Password` with a single-line password input field (type `password`).
* **Error Banner:** A warning message block (`p.error`) that appears if authentication fails.
* **Form Button:** Primary action button labelled `Sign in` (toggles to `Signing in...` when processing).
* **Alternative Link:** Link text `Create account`.

### User Actions:
* **Type in Email Input:** Enter user email.
* **Type in Password Input:** Enter account password.
* **Submit Form / Click "Sign in" Button:** Triggers login request. Redirects to `/dashboard` (or `redirectTo` parameter query) on success.
* **Click "Create account" Link:** Navigates to `/signup`.

---

## 3. Signup Screen (`/signup`)
A standalone registration portal matching the Login screen layout, optimized for single-column mobile viewports.

### UI Elements & Fields:
* **Eyebrow Header:** `Create account` text.
* **Main Heading:** `Signup` (h1).
* **Subheading:** `Create your account to start tracking reads.` (muted text).
* **Email Field:** Label name `Email` with a text input field (type `email`).
* **Password Field:** Label name `Password` with a password input field (type `password`).
* **Confirm Password Field:** Label name `Confirm password` with a password input field (type `password`).
* **Success Banner:** Success status message block (`p.success`) shown upon successful creation.
* **Error Banner:** Warning message block (`p.error`) shown on registration failures.
* **Form Button:** Primary action button labelled `Create account` (toggles to `Signing up...` when processing).
* **Alternative Link:** Link text `Back to login`.

### User Actions:
* **Type in Email / Password / Confirm Password Inputs:** Enter registration credentials.
* **Submit Form / Click "Create account" Button:** Validates password matching and invokes signup. Redirects to `/login` on success.
* **Click "Back to login" Link:** Navigates to `/login`.

---

## 4. Bookshelf Screen (`/bookshelf`)
The core reading library dashboard. On mobile, the sidebars collapse entirely, and all desktop filtering/sorting features slide into a mobile filter drawer.

### UI Elements & Fields (Mobile View):
* **Page Head:**
  * Eyebrow: `Library`.
  * Title: `Bookshelf` (h1).
  * Subtitle: `Browse, filter, and organize your collection` (muted).
  * Action: `Smart Add` primary link button.
* **Mobile Mini-Bar (Only visible on screens < 768px):**
  * **Search Input:** A full-width text input with placeholder `Search titles...` to type queries.
  * **Filters Toggle Button:** A ghost style button labeled `Filters`.
  * **Summary Bar:** Small helper text showing active filter count and current sorting rules (e.g. `2 active • Sort: Last Updated ↓`).
* **Mobile Filter Sheet (Slide-up modal sheet triggered by "Filters" button):**
  * **Backdrop overlay:** Fades out the background screen.
  * **Sheet Header:** Contains Title `Filters` (h2) and `Close` button (ghost).
  * **Sort Option dropdown:** Label `Sort by` with a select dropdown (options: Date Added, Last Updated, Last Read, Last Uploaded, Score, Chapter Count, Title, Status, or Relevance if search query is active).
  * **Sort Direction button:** Toggles descending (`↓`) and ascending (`↑`) indicators.
  * **Language dropdown:** Label `Language` showing options: `All languages` and a dynamically generated list of language tags.
  * **Genre Filters block:**
    * Eyebrow: `Genres`.
    * Match logic switcher (shows only when genres are selected): `Any` vs `All` pill buttons.
    * `✕ Clear` button.
    * Dynamically generated list of Genre pills (highlighted if active).
  * **Chapter Filters block:**
    * Eyebrow: `Chapter Count`.
    * Range operator switcher (shows only when chapter value selected): `Max` vs `Min` pill buttons.
    * Clear button: `✕ Clear` or `Any`.
    * Preset range chips: `10 chapters`, `20 chapters`, `50 chapters`, `100 chapters`, `200 chapters`.
  * **Status Shelf selection:**
    * Eyebrow: `Status`.
    * List of status buttons (`All Books`, `Reading`, `Plan to read`, `Waiting`, `Completed`, `Dropped`, `On hold`) with numeric book counters.
  * **Custom Shelves list:**
    * Eyebrow: `Custom Shelves` alongside a `+ New` button.
    * Inline creation form (reveals when clicking `+ New`):
      * Label: `Shelf name` with a text input box (placeholder `Favorites, To Buy...`).
      * Row buttons: `Create` (primary) and `Cancel` (ghost).
    * List of custom shelf name buttons (with count counters) and red `✕` delete buttons on each row.
    * Error alert banner (`p.error`) for sidebar/shelf database errors.
* **Waiting Shelf Section (Only visible under "Waiting" status shelf context):**
  * **Check Updates button:** Primary action button to fetch latest updates (disabled when checking).
  * **Progress area:** Shows text `Progress: [processed] / [total]` and a horizontal visual progress bar.
  * **Error banner:** Displays scraper/edge function failure text.
  * **Summary outcome notice:** Displays counts (`Updated: [x]`, `Skipped: [y]`, `Errors: [z]`) and bullet points showing specific error details per book.
* **Book Grid (Single-column layout on small viewports):**
  * Renders a grid of book card components (`app-book-card`).
  * **Book Card Elements:**
    * Cover thumbnail image (loads placeholder if broken or empty).
    * Title text (h3).
    * Description snippet (truncated description max 15 words).
    * Badges Row (Horizontal list of pills):
      * Status indicator.
      * Score indicator (color-coded border reflecting score category, e.g. purple for Masterpiece, green for Good).
      * Language indicator.
      * Original Language indicator.
      * Times read indicator (only if read > 1).
      * Chapter count pill.
      * Custom shelves list (pills with book icons `📚 [Shelf Name]`).
    * Truncated notes block: Displays `📝 [Notes Text]` (truncated, desktop-only but hidden in compact grids).
    * Info Section:
      * Last read chapter text (e.g. `Ch 22`) - hidden if completed status.
      * Latest chapter text (e.g. `Ch 25`).
      * Upload date (e.g. `Jul 11, 2026`).
    * Card Action Links:
      * Primary external source link (first source link).
      * `+ Shelf` dropdown button (shows list of shelves to tick/untick).
      * `Details` primary button (links to `/book/:bookId`).
* **Pagination Controls:**
  * Pagination Text info: `Showing [x]–[y] of [z] books`.
  * Buttons: `← Previous` and `Next →`.
  * Page Selector: Dropdown selector menu (`Page [N]`).

### User Actions:
* **Search / Filter in Mini-Bar:** Type inside search input; click `Filters` button to show drawer.
* **Toggle Filter Drawer Options:** Tap sorting dropdown, select language, tap sorting direction, tap genre chips, or tap status shelves.
* **Create/Delete Custom Shelf:** Click `+ New` inside mobile sheet, enter name, click `Create` to save. Tap `✕` next to any custom shelf to delete.
* **Run waiting shelf scrape:** Click `Check Updates` when viewing "Waiting" shelf.
* **Navigate Pagination:** Tap page dropdown or select arrow buttons.
* **Interact with Card:** Tap cover/title/details to navigate to `/book/:bookId`. Tap external source links. Click `+ Shelf` dropdown and click list item to toggle shelf membership.

---

## 5. Dashboard Screen (`/dashboard`)
An overview of reading statistics and library diagnostics. On mobile, grid layouts stack into a vertical single-column feed.

### UI Elements & Fields (Mobile View):
* **Page Head:**
  * Eyebrow: `Overview`.
  * Title: `Dashboard` (h1).
  * Subtitle: `Track reading, pull metadata, and jump back into the next chapter fast.` (muted).
  * Action: `Smart Add` primary link button.
* **Statistics Grid (Stacks into 1-column layout on mobile):**
  * Card: `Total saved` + strong book counter.
  * Card: `Completed` + strong completed counter.
  * Card: `Waiting for updates` + strong waiting counter.
  * Card: `Last updated` + strong title of recently updated book.
  * Card: `Average score` + strong average score.
  * Card: `Score 10 count` + strong count.
* **Genre Breakdown Card:**
  * Heading: `Genre breakdown` (h2).
  * Subtext: `Books by genre (% of your library)` (muted).
  * Horizontal bar chart list: Shows name, percentage value, count badge, and a color-filled progress bar.
  * Action: `+ [N] more genres` / `Show top five` expand toggle button.
* **Sources Breakdown Card:**
  * Heading: `Sources breakdown` (h2).
  * Subtext: `Books by source (% of your library)` (muted).
  * Horizontal bar chart list: Shows hostnames, percentage, count, and progress bar.
  * Action: `+ [N] more sources` / `Show top five` expand toggle button.
* **Status Sections (Reading, Plan to Read, Waiting, Completed):**
  * Heading: e.g. `Currently reading` or `Plan to Read`.
  * Grid: Displays up to 3 compact book cards on mobile (4 on desktop).
  * Compact Book Card has cover image, title, limited badges, latest chapter tracker, main source link, and "Details" button.
* **Quality Checks & Tools Shell:**
  * Main Title: `Quality checks & tools` / `Audit and improve your library`.
  * Separates into two columns that stack vertically on mobile:
    * **Quality Checks Column:**
      * **Duplicate Titles Card:**
        * Title: `Find possible duplicate titles`.
        * Action: `Scan for duplicates` button.
        * Message: status report text (e.g. `Duplicate groups: [N]`).
        * Results: duplicate card blocks containing title, entry count, and inline clickable book links.
      * **Stale Waiting Books Card:**
        * Title: `Stale waiting books` (with subtitle explaining criteria).
        * Action: `Check for stale books` button.
        * Message: status report text.
        * Results: lists book title links alongside age badge (e.g., `120 days`).
      * **Cover Image Issues Card:**
        * Title: `Cover image issues`.
        * Action: `Check covers` button.
        * Message: results breakdown text.
        * Results:
          * `Repair [N] external covers` primary action button (loads if repair candidates exist).
          * `Missing covers: [N]` count.
          * List of problematic cover items with book title link and status labels.
    * **Tools Column:**
      * **Consolidate Genres Card:**
        * Title: `Consolidate similar genres`.
        * Action: `Find similar genres` button.
        * Message: status report text.
        * Group Checkboxes list (reveals when results found): Shows checkbox, path mappings (`mergeGenre → keepGenre`), count comparisons, and match similarity percentage.
        * Group Controls: `Merge [N] pairs` button (primary) and `Cancel` button.
        * Manual Override Form:
          * Heading: `Or replace manually`.
          * Fields: `Replace this genre` input box and `With this genre` input box.
          * Action: `Replace` primary button.
* **Data Portability Section:**
  * Eyebrow: `Data portability`.
  * Subtext: `Download or upload all your data as JSON (books, shelves, links).` (muted).
  * Message: Status alerts.
  * Actions row:
    * `Upload JSON` button (binds to a hidden `<input type="file">` accepting JSON).
    * `Download Backup` button.

### User Actions:
* **Stat Review:** Tap "Smart Add" or toggle expanded genre/source breakdown lists.
* **Interact with Grid:** Tap status books details or external source links.
* **Execute Audits:** Tap "Scan for duplicates", "Check for stale books", or "Check covers". Click "Repair" if covers proxy is ready.
* **Execute Genre Merge:** Click "Find similar genres", select checkbox pairs, click "Merge". Alternatively, type manual values in input fields and click "Replace".
* **Manage Backup/Restore:** Tap "Download Backup" to export. Tap "Upload JSON", select backup file to restore.

---

## 6. Smart Add Screen (`/add`)
A form interface designed for single-column mobile navigation. Contains metadata fetch utilities, collapsible field sets, and a live visual card preview.

### UI Elements & Fields:
* **Page Head:**
  * Eyebrow: `Smart Add`.
  * Title: `Paste a link, capture the details` (h1).
  * Subtitle: `Connects to the Supabase Edge Function fetch-metadata...` (muted).
* **Metadata Fetcher Card:**
  * Eyebrow: `Fetch Metadata`.
  * Field: `Source URL` (text input, placeholder `https://example.com/...`).
  * Action: `Fetch` / `Fetching...` button.
  * Alert: Error or Success feedback texts.
* **Book Details Form:**
  * Eyebrow: `Book Details`.
  * **Input Fields (`app-book-form-fields`):**
    * `Title` input field (text, required).
    * `Description` input field (textarea).
    * `Status` select dropdown (options: Plan to read, Reading, Waiting, Completed, Dropped, On hold).
    * `Score` select dropdown (options: Unscored, 1 to 10).
    * `Times Read` number input field (min 1, defaults to 1).
    * `Chapter Count` number input field (min 0).
    * `Last Read` input field (text, placeholder `Ch 50`).
    * `Cover Image URL` input field (url, placeholder `https://...`).
    * `Language` input field (text, placeholder `English`).
    * `Original Language` input field (text, placeholder `Korean`).
    * `Genres` input field (text, placeholder `Action, Romance...`).
    * `Latest Chapter (site)` input field (text).
    * `Last Uploaded At (site)` input field (datetime-local).
    * `Notes` input field (textarea).
  * **Source Links Manager Card (collapsible block):**
    * Collapsible header: `Source Links` title and status arrow (`▶/▼`).
    * Existing list (shows only if items added): Displays label, URL, and a `Remove` button.
    * Entry fields: `Label` input text and `URL` input text (auto-detects label on url blur).
    * Action button: `+ Add Source` (ghost style).
  * **Related Books Linker Card (collapsible block):**
    * Collapsible header: `Related Books` title and status arrow (`▶/▼`).
    * Subtitle: `Link language versions or related books` (muted).
    * Existing list (shows only if linked): Displays linked title and a `✕` delete button.
    * Field: `Search` input field (text, placeholder `Find a book...`).
    * Suggestions list: Drops down below input showing titles and language badges.
  * **Add to Shelves selector:**
    * Legend: `Add to Shelves (optional)`.
    * Checkbox pill list: displays all loaded shelves with checkbox toggle inputs.
    * If shelves empty:
      * Field: `Shelf ID` input.
      * Action: `Add shelf` button.
      * Manual list showing added shelf IDs with `✕` remove buttons.
  * Form actions row: `Save to Library` / `Saving...` button (disabled if invalid).
* **Metadata Preview Card (renders below form on mobile when form contains data):**
  * Displays: Cover image thumbnail, Eyebrow `Preview`, Book title (h2), description snippet, status badge, last read badge, and genre pills.

### User Actions:
* **Fetch Auto-Metadata:** Type URL into fetch input, click `Fetch`.
* **Fill Form Details:** Input texts, select dropdowns, adjust numbers.
* **Manage Sources:** Click header to expand, input label/URL, click `+ Add Source`. Tap `Remove` to delete a source.
* **Manage Related Books:** Click header to expand, type in search, select suggestion from dropdown. Tap `✕` to unlink.
* **Select Shelves:** Tap custom shelf pills to toggle.
* **Save Record:** Tap `Save to Library`.

---

## 7. Book Details Screen (`/book/:bookId`)
The screen that details a single book record. Stacks vertically on mobile viewports.

### UI Elements & Fields (Mobile View):
* **Page Head:**
  * Navigation link: `← Back to Library`.
  * **Toolbar Row (Read-Only Mode):** Contains `Edit` button (ghost) and `Delete` button (ghost, danger red).
  * **Toolbar Row (Edit Mode):** Contains `Save Changes` button (primary) and `Cancel` button (ghost).
* **Read-Only Mode UI:**
  * **Book Hero Area (stacks image over text on mobile):**
    * Large cover image.
    * Eyebrow: Status label.
    * Title: Book title (h1).
    * Subtitle: Description text (or "No description available").
    * Pill row: `Last read: [x]` and `Latest: [y]` chapter badges.
    * **Stat Grid (double column on mobile):**
      * Box: `Status` label and value.
      * Box: `Score` label and text (e.g. `8 — Pretty Good` or `Unscored`).
      * Box: `Language` label and value.
      * Box: `Original Language` label and value.
      * Box: `Last Updated` label and date.
      * Box: `Fetched` label and last fetch date.
      * Box: `Last Upload` label and last upload date.
      * Box: `Times Read` (only appears if > 1) label and value.
      * Box: `Chapter Count` label and value.
    * **Fetch Chapter Area:**
      * Action button: `Fetch Latest Chapter` (disabled when fetching).
      * Alert message: outcome of latest chapter check.
    * **Genres List:** Pill list of clickable genre buttons.
  * **Personal Notes Card (only appears if notes filled):**
    * Eyebrow: `Personal Notes`.
    * Body text: Notes content.
  * **Source Links Card:**
    * Eyebrow: `Source Links`.
    * Grid of Source items: site name label, URL text.
  * **Shelves Card:**
    * Eyebrow: `Shelves` (or "No shelves").
    * Pill row: links to shelves.
  * **Related Books Card:**
    * Eyebrow: `Related Books` (or "No related books").
    * Grid of Related book items: Cover thumbnail, Title, Relation type badge (e.g. `related`).
* **Edit Mode UI:**
  * Heading: `Edit Book` (h1).
  * **Fetch Metadata Card:**
    * Prefilled search url with fetch action button.
  * **Form Fields, Source Links, Related Books, and Shelves selector:**
    * Contains identical input fields and collapsible managers outlined on the [Smart Add Screen](#6-smart-add-screen-add) above.
    * Includes `Last Fetched At` read-only datetime-local input field.
  * Form actions row: `Save Changes` (primary) and `Cancel` (ghost) buttons.

### User Actions:
* **Manage Mode:** Click `Edit` to modify or `Delete` to remove (displays a confirm dialog).
* **Fetch Latest Chapter:** Click `Fetch Latest Chapter` button.
* **Navigate via details:** Tap genre buttons to filter library, tap source URLs to open new tabs, tap shelf tags, or tap related book cards to browse their details.
* **Save/Cancel Edits:** Click `Save Changes` to save modifications or `Cancel` to discard.
