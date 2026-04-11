# ISSUE-018 — Bookshelf Filter UX Parity (Genre Mode, Chapter Presets, Relevance Search)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§6 data flow rules, §7 routing — URL as source of truth)
- `../../FRONTEND_BLUEPRINT.md` (§6.4 bookshelf filters)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-015
- User stories covered:
  - As a user, I can toggle genre filtering between "match any selected genre" and "match all selected genres".
  - As a user, I can filter books by chapter count using one-click preset buttons (10, 20, 50, 100, 200) and toggle between "at most N" and "at least N" modes.
  - As a user, searching by title returns better results than plain substring matching.

## What to build

Three distinct enhancements to the existing bookshelf filter system. Each builds on `BookshelfFilterService` (URL-as-source-of-truth) without breaking existing behaviour.

---

### 1. Genre filter mode (Any / All)

#### State
Add a `genreMode: 'any' | 'all'` filter key to `BookshelfFilterService`.
- URL query param name: `genreMode`
- Default: `'all'`
- Parse: only accept `'any'` or `'all'`; anything else defaults to `'all'`

#### Filter logic in `BookshelfPageComponent.filteredSortedBooks`
Change the genre-filter block from the current hard-coded "every" to:
```typescript
if (genres.length > 0) {
  collection = collection.filter((book) => {
    const bookGenres = book.genres.map((g) => g.toLowerCase());
    return genreMode === 'any'
      ? genres.some((g) => bookGenres.includes(g))
      : genres.every((g) => bookGenres.includes(g));
  });
}
```

#### Template
In the genre filter section, show Any / All toggle buttons **when at least one genre is active**:
```html
@if (filters.genres().length > 0) {
  <button type="button"
    [class.active]="filters.genreMode() === 'any'"
    (click)="setGenreMode('any')">Any</button>
  <button type="button"
    [class.active]="filters.genreMode() === 'all'"
    (click)="setGenreMode('all')">All</button>
}
```
Add `setGenreMode(mode: 'any' | 'all')` to the component.

---

### 2. Chapter count filter presets

#### State
Replace the current separate `chapterMin` / `chapterMax` approach with a single compound state object. Add two new filter keys to `BookshelfFilterService`:
- `chapterValue: number | null` — the selected chapter threshold (null = no filter)
- `chapterMode: 'min' | 'max'` — whether it means "at least N" or "at most N"
- Default: `chapterValue = null`, `chapterMode = 'max'`
- URL params: `chapterValue` (number string), `chapterMode` (`'min'` or `'max'`)
- Keep existing `chapterMin` / `chapterMax` params as a migration path OR remove them — decide: **remove** them and migrate the filter logic to the single-value model (simpler UX).

#### Filter logic
```typescript
const chapterValue = this.filters.chapterValue();
const chapterMode = this.filters.chapterMode();

if (chapterValue !== null) {
  collection = chapterMode === 'max'
    ? collection.filter((book) => (book.chapterCount ?? Number.MAX_SAFE_INTEGER) <= chapterValue)
    : collection.filter((book) => (book.chapterCount ?? 0) >= chapterValue);
}
```

#### Template — replace the current min/max inputs with:
```html
<div>
  <p>Filter by Chapter Count</p>
  @if (filters.chapterValue() !== null) {
    <button type="button" (click)="setChapterMode('max')" [class.active]="filters.chapterMode() === 'max'">Max</button>
    <button type="button" (click)="setChapterMode('min')" [class.active]="filters.chapterMode() === 'min'">Min</button>
    <button type="button" (click)="clearChapterFilter()">✕ Clear</button>
  }
  @for (preset of chapterPresets; track preset) {
    <button type="button"
      [class.active]="filters.chapterValue() === preset"
      (click)="toggleChapterPreset(preset)">
      {{ preset }} chapters
    </button>
  }
</div>
```

Component properties:
```typescript
readonly chapterPresets = [10, 20, 50, 100, 200] as const;

setChapterMode(mode: 'min' | 'max'): void { ... }
toggleChapterPreset(value: number): void {
  // If already selected → clear; otherwise set new value, preserve mode
  if (this.filters.chapterValue() === value) {
    void this.filters.updateFilter('chapterValue', null);
  } else {
    void this.filters.updateFilter('chapterValue', value);
  }
}
clearChapterFilter(): void { void this.filters.updateFilter('chapterValue', null); }
```

---

### 3. Relevance-ranked search

The current search is plain `book.title.toLowerCase().includes(query)`. React uses a scoring approach that surfaces title matches above description matches.

#### Scoring algorithm
When `search` is non-empty, score each book and sort scored results to the top:

```typescript
function scoreBook(book: Book, query: string): number {
  const q = query.trim().toLowerCase();
  const title = book.title.toLowerCase();
  const desc = (book.description ?? '').toLowerCase();

  // Exact title match
  if (title === q) return 1000;
  // Title starts with query
  if (title.startsWith(q)) return 500;
  // Title contains query as a whole word boundary
  if (new RegExp(`\\b${escapeRegex(q)}`).test(title)) return 300;
  // Title contains query (any position)
  if (title.includes(q)) return 200;
  // Description contains query
  if (desc.includes(q)) return 50;
  return 0;
}
```

Filter out books where `scoreBook === 0`. Then sort descending by score, with the existing sort applied as a tie-breaker within equal-score groups.

Add a `'relevance'` option to the sort dropdown (only shown when `search` is non-empty):
```html
@if (filters.search()) {
  <option value="relevance">Relevance</option>
}
```

When `sort === 'relevance'`, use score-based ordering instead of the current field comparators.

Add `escapeRegex(s: string): string` pure helper (escapes `\.+*?[^]$(){}=!<>|:-#`) somewhere in `shared/utils/`.

---

## Acceptance criteria
- [ ] `BookshelfFilterService` exposes `genreMode`, `chapterValue`, `chapterMode` signals read from URL params.
- [ ] `genreMode` round-trips to/from URL; defaults to `'all'`.
- [ ] Any/All toggle buttons appear only when at least one genre tag is active.
- [ ] "All" mode: a book must match every selected genre to appear.
- [ ] "Any" mode: a book matching at least one selected genre appears.
- [ ] Chapter preset buttons (10, 20, 50, 100, 200) toggle the `chapterValue` filter on/off.
- [ ] Min/Max mode buttons appear only when a chapter value is selected; toggle `chapterMode`.
- [ ] Chapter filter round-trips to/from URL.
- [ ] Relevance search ranks exact title matches above partial, above description matches.
- [ ] "Relevance" sort option appears in dropdown only when search query is non-empty.
- [ ] Tests cover: genre mode filter semantics (any vs all), chapter preset toggle/clear, relevance scoring (exact > partial > description).
- [ ] Existing filter tests (URL round-trips, pagination, shelf selection) continue to pass.

## Blocked by
- Blocked by ISSUE-015.

## Notes
- The `chapterMin` / `chapterMax` URL params from ISSUE-004 can be removed. Update `BookshelfFilterService` and remove the corresponding inputs from the template. This is intentional regression of the free-form range in favour of the preset UX.
- `genreMode` is a new URL param; existing bookmarks without it default correctly to `'all'`.
