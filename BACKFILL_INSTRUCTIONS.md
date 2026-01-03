# Backfill Chapter Counts - One-Time Setup

## Step 1: Add Database Columns

Run this in your Supabase SQL Editor:

```sql
-- Add the new columns (if not exists)
alter table public.books
  add column if not exists times_read integer not null default 1 check (times_read >= 1);

alter table public.books
  add column if not exists chapter_count integer check (chapter_count is null or chapter_count >= 1);

-- Ensure all existing books have times_read = 1
update public.books set times_read = 1 where times_read is null;
```

## Step 2: Backfill Chapter Counts

Navigate to `/admin-backfill` in your app and click "Start Backfill". 

This will:
- Fetch all books from all users
- Call fetch-metadata for each book with a source URL
- Update chapter_count when available
- Show progress and results

**Note:** This is a temporary admin page. Remove it after running once.

## Step 3: Cleanup (After Backfill)

Delete the following files:
- `frontend/src/pages/AdminBackfill.jsx`
- Update `frontend/src/main.jsx` to remove the `/admin-backfill` route
- Delete this instruction file
