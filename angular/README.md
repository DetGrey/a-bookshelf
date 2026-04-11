# A Bookshelf (Angular)

This folder contains the Angular implementation of **A Bookshelf**: a personal reading-library web app where you can save books, organize shelves, track progress, and fetch metadata from source URLs.

## What this website does

The app helps you manage your reading library with:

- Authentication (login/signup)
- Dashboard stats and quality tools
- Bookshelf view with advanced filters (search, genre any/all, chapter min/max, sorting, pagination)
- Add Book flow with metadata fetching from source URLs
- Book Details read/edit mode (notes, times read, last read, latest chapter, source links, related books)
- Built-in status shelves + custom shelves
- Backup/restore and waiting-shelf update flows

It uses Supabase for auth/data and invokes Edge Functions for metadata/latest-chapter scraping.

## Tech stack

- Angular 21 (standalone components, signals, OnPush)
- TypeScript (strict)
- Supabase JS client
- Jest + Angular Testing Library
- ESLint

## Prerequisites

- Node.js 20+
- npm
- A Supabase project (URL + anon key)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment files from examples:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

3. Configure environment values in:

- `src/environments/environment.ts` (local, ignored by git)
- `src/environments/environment.prod.ts` (local, ignored by git)

Set:

- `supabaseUrl`
- `supabaseAnonKey`
- `imageProxyUrl` (optional but recommended if using cover proxy)

## Run locally

Start the dev server:

```bash
npm start
```

Open:

- `http://localhost:4200/`

## Useful scripts

- Run tests:

```bash
npm test
```

- Lint:

```bash
npm run lint
```

- Lint with auto-fix:

```bash
npm run lint:fix
```

- Production build:

```bash
npm run build
```

## Notes

- If Supabase values are empty, authenticated/data-driven pages will fail to load correctly.
- Real environment files are intentionally ignored by git to prevent accidental secret commits.
- This Angular app is built to match the existing React product behavior and UI parity.
