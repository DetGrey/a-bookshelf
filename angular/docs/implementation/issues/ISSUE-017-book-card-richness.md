# ISSUE-017 — BookCard and Book Details Read Mode Richness

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 component rules — smart/dumb split)
- `../../FRONTEND_BLUEPRINT.md` (§6.4 bookshelf, §6.6 book details)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-016
- User stories covered:
  - As a user, I can see score, language, chapter count, genres, shelves, and latest-chapter info at a glance on each book card.
  - As a user, I can add or remove a book from a custom shelf directly from the card without leaving the bookshelf.
  - As a user, I can click a genre pill on a card to instantly filter the bookshelf to that genre.

## What to build

The Angular `BookCardComponent` currently shows only title, status, score, and an "Open details" link. The React `BookCard.jsx` is the reference. Bring the card to full parity.

### BookCardComponent changes

#### New inputs
The component is dumb — all data comes via inputs. Add:
- `customShelves = input<Shelf[]>([])` — for shelf badge display and the "+ Shelf" dropdown
- `activeGenres = input<string[]>([])` — to highlight active genre pills
- `compact = input<boolean>(false)` — compact mode hides some fields (used on Dashboard)

#### New outputs
- `genreToggled = output<string>()` — emits a genre name when a genre pill is clicked
- `shelfToggled = output<{ bookId: string; shelfId: string }>()` — emits when the shelf dropdown toggles a shelf

#### Template additions (non-compact unless noted)

**Pill row** (always):
- Status pill (already present)
- Score pill — colour-coded inline style using `scoreColor(score)`:
  - ≥ 9 → `#b34ad3` (great)
  - ≥ 7 → `#0ba360` (good)
  - ≥ 5 → `#c6a700` (average)
  - ≥ 3 → `#d97706` (bad)
  - ≥ 1 → `#d14343` (appalling)
  - Show score label from `SCORE_OPTIONS` if matched, otherwise `Score: N`
  - Hide if score is null or 0
- Reading language pill with emoji flag (non-compact only):
  - 🇬🇧 English/en/eng, 🇯🇵 Japanese/jp/ja/jpn, 🇰🇷 Korean/kr/ko, 🇨🇳 Chinese/cn/zh, 🇪🇸 Spanish/es
  - No flag for unrecognised languages — just show the text
- Original language pill (same emoji logic; always shown if non-null)
- "Reads: N" pill if `timesRead > 1`
- "Chapters: N" pill if `chapterCount` is non-null
- Shelf badge pills — `📚 {shelfName}` for each custom shelf the book belongs to (non-compact only)

**Notes line** (non-compact):
- `📝 {notes}` paragraph, shown only if `notes` is non-empty

**Genre pills row** (non-compact):
- Render each genre as a button
- Apply active pill style if genre is in `activeGenres`
- On click: emit `genreToggled` with the genre name
- Hide entire row if `genres.length === 0`

**Card footer** (new section at bottom of card):
- Left column:
  - "Last read" label + value if `lastRead` is non-null and `status !== 'completed'`
  - "Latest chapter" label + value (show `—` if null)
  - Last uploaded date formatted `MMM D, YYYY` if non-null (non-compact only)
- Right column:
  - Up to 1 source link (non-compact) — anchor with `siteName` as text, opens in new tab
  - "+ Shelf" button (non-compact; only if `customShelves.length > 0`):
    - Clicking opens an inline dropdown listing all custom shelves
    - Each shelf shows ✓ if book is already on it, ○ otherwise
    - Clicking a shelf emits `shelfToggled` and closes dropdown
    - Dropdown is local state (`showShelfMenu = signal(false)`)
  - "Details" primary link — `[routerLink]="['/book', book.id]"`

#### Compact mode (Dashboard use)
In compact mode, hide: language reading pill, shelf badges, notes, genre pills, last-uploaded date, source links, + Shelf button.
Show: title, description (truncated), status pill, score pill, original language pill, times-read pill, chapter count pill, footer left column (latest chapter).

#### `truncateText` helper
Add a `truncateText(text: string, maxWords = 15)` pure function in `shared/utils/` (or as a private method). Split on whitespace, join first 15 words, append `…` if truncated.

### BookshelfPageComponent wiring
- Pass `customShelves` and `activeGenres` down to `<app-book-grid>` → `<app-book-card>`.
- Handle `genreToggled` output: call `filters.updateFilter('genres', [...current, genre])` (or remove if already active — toggle).
- Handle `shelfToggled` output: call `ShelfService.toggleBookOnShelf(bookId, shelfId)` (add if not present, remove if present). Add this method to `ShelfService` if it doesn't exist.

### BookGridComponent wiring
- Accept `customShelves`, `activeGenres` as inputs and pass them through to each `BookCardComponent`.
- Accept `(genreToggled)` and `(shelfToggled)` outputs and re-emit them upward.

### Book Details read mode
The read mode already shows a structured section list. Enrich it to match the card's footer:
- Show "Latest chapter" field (may already exist — verify and align with ISSUE-016 field).
- Show "Last uploaded at" formatted date.
- Show "Notes" with 📝 prefix if non-null.
- Show "Times read" if > 1.
- Show "Original language" if non-null.
- Show source links as proper anchors with `siteName` as the link text (not raw URL).
- Show related books as titles (resolved from `relatedBooks` array which already has `bookId`; look up in `BookService.books()` for title — same pattern as `BookSearchLinkerComponent`).

## Acceptance criteria
- [x] `BookCardComponent` renders score pill with correct colour-coding for all score ranges.
- [x] Language pills show correct emoji flags for EN/JP/KR/CN/ES; plain text for others.
- [x] Genre pills emit `genreToggled` on click; active genres are visually distinguished.
- [x] Notes line renders with 📝 prefix when non-empty; hidden when null/empty.
- [x] "Latest chapter" and "Last read" display correctly in card footer.
- [x] "+ Shelf" dropdown lists all custom shelves, marks active ones, emits `shelfToggled` on selection.
- [x] Compact mode hides the correct fields.
- [x] `BookshelfPageComponent` wires genre-toggle and shelf-toggle events through to filter/shelf services.
- [x] Book Details read mode shows all enriched fields (notes, times-read, latest-chapter, last-uploaded, original-language, source names, related-book titles).
- [x] Tests cover: score colour thresholds, genre toggle wiring, shelf dropdown open/close/toggle, compact mode hiding.
- [x] Existing test baseline preserved.

## Blocked by
- Blocked by ISSUE-016 (needs `notes`, `timesRead`, `lastRead`, `latestChapter`, `lastUploadedAt`, `originalLanguage` on the `Book` model).
