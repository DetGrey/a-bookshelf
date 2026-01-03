# A Bookshelf
A personal library dashboard that tracks reading status, progress, and links across multiple sources. The frontend is a React + Vite SPA hosted on GitHub Pages and backed by Supabase Auth, tables, and two Edge Functions.

## Highlights
- Smart add: paste a URL (Webtoons, Bato) and the `fetch-metadata` Edge Function scrapes title, description, cover, genres, language, latest chapter, and upload date.
- Reading states and shelves: built-in shelves (reading, plan to read, waiting, completed, dropped, on hold) plus custom shelves.
- Progress tracking: personal notes, last read, latest scraped chapter, and last uploaded timestamp per book.
- Multi-source links: keep multiple URLs per book (official, scanlation, etc.) and switch quickly.
- Waiting shelf updates: throttled batch checks via `fetch-latest` (3-at-a-time with progress), unchanged rows are skipped and errors are shown in a collapsible log.
- Dashboard stats: genre breakdown pie (top genres + Other), average score (ignores 0), score-10 count, and latest updates.
- Data portability: one-click JSON backup + upload/restore (profiles, books, shelves, links, mappings).
- Filtering and sorting: status, genre, or last update.

## Repo layout
- frontend/ — React app (Vite) with routes, components, sample data, and tests.
- tables.sql — Supabase schema and RLS policies for profiles, books, shelves, shelf_books, and book_links.
- src/supabase/functions/ — Edge Functions `fetch-metadata` and `fetch-latest` (Deno + cheerio) plus minimal Supabase CLI config.

## Prerequisites
- Node 18+ and npm
- Supabase project and the Supabase CLI (for running/deploying functions and applying the schema)
- GitHub Pages (or any static host) if you want the provided deploy path

## Quick start (frontend)
1) Copy envs: `cp frontend/.env.example frontend/.env.local`; fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2) Install deps: `cd frontend && npm install`.
3) Dev server: `npm run dev -- --host` (so phones/tablets can reach it).
4) Lint: `npm run lint`. Tests: `npm test`. Build: `npm run build` (adds `dist/404.html` for GitHub Pages).

## Supabase setup
1) Create the Edge Functions (from repo root):
	 - `npx supabase functions deploy fetch-metadata --no-verify-jwt`
	 - `npx supabase functions deploy fetch-latest --no-verify-jwt`
2) Frontend uses `supabase.functions.invoke` with anon key, so enable the functions for anon access in the Supabase dashboard or keep JWT disabled as above.

## Edge Functions (payloads)
- fetch-metadata
	- Request: `{ "url": "https://example.com/some-book" }`
	- Response: `{ metadata: { title, description, image, genres[], original_language, latest_chapter, last_uploaded_at } }`
	- Supports Webtoons, Bato (ing/si), and a generic Bato v3 parser; returns 200 with error payload on failures to avoid client-side swallowing.
- fetch-latest
	- Request: `{ "url": "https://example.com/some-book" }`
	- Response: `{ latest_chapter, last_uploaded_at }`
	- Mirrors the same site support and date parsing (Webtoons date +1 day hack for stable time zones).

## Data model
- profiles: user profile row per auth user (auto-created trigger).
- books: core book metadata, progress fields, scraper fields, user ownership, and status enum.
- shelves: custom shelf names per user.
- shelf_books: join table mapping shelves to books.
- book_links: multiple URLs per book entry.
Row Level Security is enabled on every table; policies limit access to the owning user.

## Testing and quality
- Unit/component tests: `npm test` (Vitest + Testing Library) inside frontend/.
- Linting: `npm run lint` (eslint 9).
- CI: add a GitHub Actions workflow to run lint + test on PRs (not included yet).

## Future improvement

### PWA (Progressive Web App) Support:

> Status: Optional / Planned when icon is created

Since this is a personal tool, you likely want to use it on your phone while reading in bed.

Action: Add a manifest.json and service worker (Vite has a plugin vite-plugin-pwa). This lets you "Install" the website as an app on iOS/Android, removing the browser address bar.

