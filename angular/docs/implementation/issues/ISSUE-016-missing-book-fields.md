# ISSUE-016 — Missing Book Fields (notes, times_read, last_read, latest_chapter, last_uploaded_at, original_language)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§3 type layers, §5 component rules, §6 data flow)
- `../../FRONTEND_BLUEPRINT.md` (§6.5 add/edit helpers, §6.6 book details)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-015
- User stories covered:
  - As a user, I can record and view notes, read count, last-read progress, and chapter update timestamps for each book.
  - As a user, I can record the original language of a book separately from the language I'm reading it in.

## What to build

The React app stores and displays six fields that the Angular app currently ignores entirely. Add them to every layer of the Angular stack.

### Fields to add

| Field | DB column | TypeScript type | Notes |
|---|---|---|---|
| Notes | `notes` | `string \| null` | Free-text personal notes |
| Times read | `times_read` | `number` (min 1) | How many times the user has read the book; defaults to 1 |
| Last read | `last_read` | `string \| null` | User-entered text like "Ch 50"; not a date |
| Latest chapter | `latest_chapter` | `string \| null` | Site-reported latest chapter string; auto-filled by fetch-latest |
| Last uploaded at | `last_uploaded_at` | `Date \| null` | When the source site last uploaded a new chapter |
| Original language | `original_language` | `string \| null` | The language the book was originally written in |

### Layer changes required

#### 1. `BookRecord` (raw Supabase row — `models/book.model.ts`)
Add the six columns alongside the existing ones. The Supabase select query in `BookRepository.getByUserId` already fetches `latest_chapter` and `last_uploaded_at` (used by `fetchLatestChapterForBook`); add the rest to the select string.

#### 2. `Book` (domain model — `models/book.model.ts`)
Add camelCase properties:
- `notes: string | null`
- `timesRead: number` (never null; normalize to 1 if missing)
- `lastRead: string | null`
- `latestChapter: string | null` (already present — verify)
- `lastUploadedAt: Date | null` (already present — verify)
- `originalLanguage: string | null`

#### 3. `BookFormModel` (`models/book.model.ts`)
Add form fields:
- `notes: string`
- `timesRead: number`
- `lastRead: string`
- `latestChapter: string`
- `lastUploadedAt: string` (datetime-local string, empty string = null)
- `originalLanguage: string`

#### 4. Book mapper (`models/mappers/book.mapper.ts`)
- `toBook`: map each new column to the domain model. Normalize `times_read` to `Math.max(1, n)` when null/0. Parse `last_uploaded_at` to `Date | null`.
- `toSupabasePayload`: map form values back to snake_case columns. Treat empty strings as `null`. Treat `timesRead < 1` as `1`.

#### 5. `BookFormFieldsComponent` (`shared/components/book-form-fields/`)
Add the six fields to the FormGroup and template, matching React's `BookFormFields.jsx` layout:
- **Notes**: `<textarea>` (3 rows), placeholder "Personal notes, reading progress, etc."
- **Times read**: `<input type="number" min="1">`, defaults to 1, normalize on blur (min 1, round to int)
- **Last read**: `<input type="text">`, placeholder "Ch 50"
- **Latest chapter**: `<input type="text">` — shown in edit, but note it is also auto-filled by fetch-latest
- **Last uploaded at**: `<input type="datetime-local">` — empty string maps to null on save
- **Original language**: `<input type="text">`, placeholder "Japanese, Korean, English..."

All new form controls must use `nonNullable: true` where the domain type is `string` to avoid nullable-string drift.

#### 6. `BookFormModel` type in Add Book and Book Details
The parent pages pass `BookFormModel` to `BookService`. The `toFormModel()` private method in both pages must include the six new fields. Both pages must initialise the form controls.

#### 7. Book Details read mode
Show the new fields in the read-mode template:
- Notes: show paragraph with 📝 prefix if non-empty
- Times read: show if > 1 (e.g. "Read 3 times")
- Last read: show if non-null and status ≠ 'completed'
- Latest chapter: show (already may be wired — verify)
- Last uploaded at: show formatted date if non-null
- Original language: show if non-null (separate from reading language)

#### 8. Supabase select query
In `BookRepository.getByUserId`, add the new columns to the select string:
```
notes, times_read, last_read, original_language
```
(`latest_chapter`, `last_uploaded_at`, `last_fetched_at` should already be present.)

## Acceptance criteria
- [x] `Book` domain model includes all six new fields with correct TypeScript types.
- [x] `BookRecord` includes matching snake_case columns.
- [x] `BookFormModel` includes all six fields.
- [x] Mapper round-trips correctly: `null` DB → domain default; domain → save payload treats empty strings as `null`.
- [x] `times_read` is normalised to minimum 1 in both mapper and form blur handler.
- [x] `BookFormFieldsComponent` renders all six fields with correct input types and placeholders.
- [x] Book Details read mode displays all six fields (with appropriate "show if non-null / non-default" guards).
- [x] Add Book and Book Details edit mode include all six form controls in the FormGroup.
- [x] Tests cover mapper normalisation, form default values, and read-mode display guards.
- [x] Existing ISSUE-000 through ISSUE-015 test baseline preserved.

## Blocked by
- Blocked by ISSUE-015.

## Notes
- `last_read` is a plain text field (e.g. "Ch 50"), not a date — match the React behaviour exactly.
- `latest_chapter` may already be partially wired in `fetchLatestChapterForBook`; confirm and unify rather than duplicate.
- Do not add `last_fetched_at` to the form — it is read-only metadata updated only by the edge function.
