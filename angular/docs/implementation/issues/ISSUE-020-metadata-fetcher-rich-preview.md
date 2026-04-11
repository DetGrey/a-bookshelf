# ISSUE-020 — MetadataFetcher Rich Preview

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 component rules — documented smart exceptions)
- `../../FRONTEND_BLUEPRINT.md` (§6.5 add/edit helpers)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-016
- User stories covered:
  - As a user, after fetching metadata from a URL I can see a preview of the cover, title, description, genres, and chapter info before deciding to apply it.

## What to build

The Angular `MetadataFetcherComponent` currently fetches metadata and shows only a bare "Ready to apply metadata" message with the title. The React `MetadataFetcher.jsx` shows a full preview card. Bring the Angular component to full parity.

### Current state
The Angular component:
- Has a URL input and Fetch button (working)
- Calls `BookService` or Supabase edge function `fetch-latest` to get metadata
- On success: shows a minimal message and an "Apply to fields" button
- Does NOT show: cover image, description, genre pills, chapter count pill, latest chapter pill

### Fetched metadata shape
The preview data returned from the edge function / metadata fetch should include:
```typescript
interface FetchedMetadata {
  title?: string | null;
  description?: string | null;
  image?: string | null;        // cover image URL
  genres?: string[];
  latest_chapter?: string | null;
  chapter_count?: number | null;
}
```
Verify this is the actual shape returned by the `fetch-latest` edge function. If the component currently only extracts `title` from the response, expand the extraction to include all fields above.

### Component changes

#### Signal to hold full metadata
Change the current "fetched" signal to hold the full metadata object:
```typescript
readonly fetchedMetadata = signal<FetchedMetadata | null>(null);
```

#### On successful fetch
Set `fetchedMetadata` to the full parsed response object (not just the title string).

#### Apply logic
When "Apply to fields" is clicked, patch the parent FormGroup with all available fields:
- `title` → `form.controls.title`
- `description` → `form.controls.description` (only if non-empty)
- `coverUrl` → `form.controls.coverUrl` (use `image` field)
- `genres` → `form.controls.genres` (join array with `, `)
- `latestChapter` → `form.controls.latestChapter` (ISSUE-016 field)
- `chapterCount` → `form.controls.chapterCount`
- Clear `fetchedMetadata` after applying (close the preview)

#### Preview template
Shown when `fetchedMetadata()` is non-null:
```html
<div class="metadata-preview">
  <app-cover-image [src]="fetchedMetadata()!.image" [alt]="fetchedMetadata()!.title ?? ''" />
  <div>
    <strong>{{ fetchedMetadata()!.title }}</strong>
    <p>{{ fetchedMetadata()!.description }}</p>

    @if (fetchedMetadata()!.genres?.length) {
      <div class="pill-row">
        @for (genre of fetchedMetadata()!.genres!; track genre) {
          <span class="pill">{{ genre }}</span>
        }
      </div>
    }

    <div class="pill-row">
      @if (fetchedMetadata()!.latest_chapter) {
        <span class="pill">Latest: {{ fetchedMetadata()!.latest_chapter }}</span>
      }
      @if (fetchedMetadata()!.chapter_count != null) {
        <span class="pill">Chapters: {{ fetchedMetadata()!.chapter_count }}</span>
      }
    </div>

    <button type="button" (click)="applyMetadata()">Apply to fields</button>
  </div>
</div>
```

Import `CoverImageComponent` into `MetadataFetcherComponent`.

#### Compact mode
The component already has a `compact` input. In compact mode, the preview can omit description and show a smaller layout. Keep the cover thumbnail, pills, and apply button in both modes.

#### Edit mode (Book Details)
`MetadataFetcherComponent` is currently only used in `AddBookPageComponent`. Add it to `BookDetailsPageComponent` edit mode as well, mirroring the React behaviour where the fetcher is available during both add and edit flows.

In `BookDetailsPageComponent`:
- Import and add `MetadataFetcherComponent` to the `imports` array
- Add it to the edit-mode template above `<app-book-form-fields>`
- Pass the `editForm` FormGroup to it

## Acceptance criteria
- [x] After a successful fetch, the preview card shows: cover image (with gradient fallback), title, description, genre pills, latest-chapter pill (if present), chapter count pill (if present).
- [x] "Apply to fields" patches the parent FormGroup with all available fields and closes the preview.
- [x] The preview is hidden until a fetch completes.
- [x] Fetching again with a new URL replaces the previous preview.
- [x] Error and loading states continue to work as before.
- [x] `MetadataFetcherComponent` is included in `BookDetailsPageComponent` edit mode.
- [x] Tests cover: preview appears after successful fetch, apply patches all fields, preview clears after apply, error state shown on failed fetch.
- [x] Existing test baseline preserved.

## Completion notes
- Implemented in Angular shared and feature layers:
  - `src/app/shared/components/metadata-fetcher/metadata-fetcher.component.ts`
  - `src/app/shared/components/metadata-fetcher/metadata-fetcher.mapper.ts`
  - `src/app/features/book-details/book-details-page.component.ts`
- Verified edge payload handling from `fetch-metadata` (`{ metadata: ... }`) and direct payload parsing compatibility in the component.
- Test coverage updated in:
  - `src/app/shared/components/metadata-fetcher/metadata-fetcher.component.spec.ts`
  - `src/app/shared/components/metadata-fetcher/metadata-fetcher.mapper.spec.ts`
  - `src/app/features/book-details/book-details-page.component.spec.ts`
- Regression verification:
  - `npm test`
  - Result: 30/30 suites passed, 204/204 tests passed.

## Blocked by
- Blocked by ISSUE-016 (needs `latestChapter` and `chapterCount` form controls).
- Blocked by ISSUE-019 (uses `CoverImageComponent` in the preview).
