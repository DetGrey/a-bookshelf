# Data Models Reference (Angular Version)

This document provides a comprehensive overview of the data models, interfaces, and types used in the **A Bookshelf** Angular application. 

It covers database entities, domain models, form representation models, operation results, quality check audits, and backup structures.

---

## Table of Contents
1. [Core Database Records (Supabase Schemas)](#1-core-database-records-supabase-schemas)
2. [Frontend Domain Models](#2-frontend-domain-models)
3. [Form Representation Models](#3-form-representation-models)
4. [Operation Result & Error Models](#4-operation-result--error-models)
5. [Quality Check & Diagnosis Models](#5-quality-check--diagnosis-models)
6. [Waiting Shelf Scraper Models](#6-waiting-shelf-scraper-models)
7. [Backup & Data Portability Models](#7-backup--data-portability-models)

---

## 1. Core Database Records (Supabase Schemas)
These interfaces define the raw structures stored in and retrieved from the Supabase PostgreSQL database.

### `BookRecord`
Defined in [book.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/book.model.ts). Represents the database table row for a book.

```typescript
export interface BookRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  score: number | null;
  status: string; // Cast to status string
  genres: string[] | null;
  language: string | null;
  chapter_count: number | null;
  latest_chapter?: string | null;
  last_uploaded_at?: string | null;
  last_fetched_at?: string | null;
  notes?: string | null;
  times_read?: number | null;
  last_read?: string | null;
  original_language?: string | null;
  cover_url: string | null;
  book_links?: Array<{ site_name: string | null; url: string }>;
  created_at: string; // ISO Datetime string
  updated_at: string; // ISO Datetime string
}
```

### `ShelfRecord`
Defined in [shelf.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/shelf.model.ts). Represents a custom user shelf row in the database.

```typescript
export interface ShelfRecord {
  id: string;
  user_id: string;
  name: string;
  book_count?: number | null;
  shelf_books?: { book_id: string }[];
  created_at: string; // ISO Datetime string
}
```

---

## 2. Frontend Domain Models
These models represent sanitized, strongly-typed domain objects used throughout components and services in the Angular application. They are mapped from raw database records.

### `BookStatus`
Defined in [book.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/book.model.ts). Defines the explicit status values a book can take.

```typescript
export type BookStatus = 'reading' | 'plan_to_read' | 'waiting' | 'completed' | 'dropped' | 'on_hold';
```

### `Book`
Defined in [book.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/book.model.ts). The client-side entity featuring parsed date objects, source arrays, and immutable arrays.

```typescript
export interface Book {
  id: string;
  userId: string;
  title: string;
  description: string;
  score: number | null;
  status: BookStatus;
  genres: readonly string[];
  language: string | null;
  chapterCount: number | null;
  latestChapter: string | null;
  lastUploadedAt: Date | null;
  lastFetchedAt: Date | null;
  notes: string | null;
  timesRead: number;
  lastRead: string | null;
  originalLanguage: string | null;
  coverUrl: string | null;
  sources?: readonly BookSourceDraft[];
  createdAt: Date;
  updatedAt: Date;
}
```

### `BookSourceDraft`
Defined in [book.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/book.model.ts). Represents a sanitized external website source URL.

```typescript
export interface BookSourceDraft {
  siteName: string;
  url: string;
}
```

### `Shelf`
Defined in [shelf.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/shelf.model.ts). The client-side shelf representation.

```typescript
export interface Shelf {
  id: string;
  userId: string;
  name: string;
  bookCount: number;
  bookIds?: readonly string[];
  createdAt: Date;
}
```

---

## 3. Form Representation Models
These models map between client forms (Angular Reactive Form Groups) and database payloads.

### `BookFormModel`
Defined in [book.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/book.model.ts). Holds raw, unvalidated form values for additions and edits.

```typescript
export interface BookFormModel {
  title: string;
  description: string;
  score: number | null;
  status: BookStatus | null;
  genres: string; // Comma separated string list e.g. "Action, Fantasy"
  language: string;
  chapterCount: number | null;
  coverUrl: string;
  notes: string;
  timesRead: number;
  lastRead: string;
  latestChapter: string;
  lastUploadedAt: string; // formatted datetime-local value
  lastFetchedAt?: string; // formatted datetime-local value
  originalLanguage: string;
  sources: BookSourceDraft[];
  shelves: string[]; // List of shelf IDs
  relatedBookIds: string[]; // List of linked book IDs
}
```

---

## 4. Operation Result & Error Models
The error and result wrapping framework used across services, endpoints, and repositories.

### `ErrorCode`
Defined in [result.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/result.model.ts).

```typescript
export enum ErrorCode {
  Unknown = 'unknown',
  Validation = 'validation',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  Conflict = 'conflict',
  Network = 'network',
}
```

### `AppError`
Defined in [result.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/result.model.ts).

```typescript
export interface AppError {
  code: ErrorCode;
  message: string;
  cause?: unknown;
}
```

### `Result<T>`
Defined in [result.model.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/models/result.model.ts). A discriminated union representing success with generic data `T`, or failure with `AppError`.

```typescript
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };
```

---

## 5. Quality Check & Diagnosis Models
Used on the Dashboard page to query, scan, list, and consolidate data anomalies.

### Duplicate Titles Audit
Defined in [quality-tools.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/quality/quality-tools.service.ts).

```typescript
export interface DuplicateTitleGroup {
  title: string;
  normalizedTitle: string;
  books: string[]; // List of candidate book IDs matching
  count: number;
}

export interface DuplicateTitleScanResult {
  groups: DuplicateTitleGroup[];
  duplicateCount: number;
}
```

### Stale Waiting Books Audit
Defined in [quality-tools.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/quality/quality-tools.service.ts).

```typescript
export interface StaleWaitingGroup {
  label: string;
  books: string[]; // Book IDs
  count: number;
  oldestDays: number;
}

export interface StaleWaitingScanResult {
  groups: StaleWaitingGroup[];
  staleCount: number;
  thresholdDays: number;
}
```

### Cover Health Audit & Repair
Defined in [quality-tools.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/quality/quality-tools.service.ts).

```typescript
export interface CoverHealthIssue {
  bookId: string;
  title: string;
  status: 'missing' | 'external' | 'proxied';
  currentUrl: string | null;
  suggestedUrl: string | null;
}

export interface CoverHealthScanResult {
  issues: CoverHealthIssue[];
  missingCount: number;
  externalCount: number;
  proxiedCount: number;
}

export interface CoverRepairSummary {
  repairedCount: number;
  skippedCount: number;
  issues: CoverHealthIssue[];
}
```

### Genre Consolidation
Defined in [quality-tools.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/quality/quality-tools.service.ts).

```typescript
export interface GenreConsolidationSummary {
  updatedCount: number;
  targetGenre: string;
  sourceGenres: string[];
  mode: 'merge' | 'replace';
}
```

---

## 6. Waiting Shelf Scraper Models
Structures defining progress reports and outcomes when scraping waiting books for site updates.

### `WaitingUpdateProgress`
Defined in [book.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/book/book.service.ts).

```typescript
export interface WaitingUpdateProgress {
  processed: number;
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}
```

### `WaitingUpdateSummary` & `WaitingUpdateItemOutcome`
Defined in [book.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/book/book.service.ts).

```typescript
export interface WaitingUpdateItemOutcome {
  bookId: string;
  title: string;
  status: 'updated' | 'skipped' | 'error';
  detail: string;
}

export interface WaitingUpdateSummary {
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  outcomes: WaitingUpdateItemOutcome[];
}
```

---

## 7. Backup & Data Portability Models
Data portability models mapping the flat JSON database tables schema representation exported/imported via backup JSON.

### Database Backup Payload Components
Defined in [backup-restore.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/backup/backup-restore.service.ts).

```typescript
export interface BackupProfileRecord {
  id: string;
  email: string | null;
}

export interface BackupBookLinkRecord {
  bookId: string;
  siteName: string | null;
  url: string;
}

export interface BackupRelatedBookRecord {
  bookId: string;
  relatedBookId: string;
  relationshipType: string | null;
}

export interface BackupShelfBookRecord {
  shelfId: string;
  bookId: string;
}
```

### `BackupPayload`
Defined in [backup-restore.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/backup/backup-restore.service.ts).

```typescript
export interface BackupPayload {
  profile: BackupProfileRecord;
  books: BookRecord[];
  shelves: ShelfRecord[];
  bookLinks: BackupBookLinkRecord[];
  relatedBooks: BackupRelatedBookRecord[];
  shelfBooks: BackupShelfBookRecord[];
}
```

### `BackupRestoreSummary` & `BackupRestoreErrorDetail`
Defined in [backup-restore.service.ts](file:///c:/Users/aneno/OneDrive/Personal/Creativity/Hjemmesider/a-bookshelf/angular/src/app/core/backup/backup-restore.service.ts).

```typescript
export interface BackupRestoreErrorDetail {
  section: string;
  message: string;
}

export interface BackupRestoreSummary {
  booksUpserted: number;
  shelvesUpserted: number;
  bookLinksUpserted: number;
  relatedBooksUpserted: number;
  shelfBooksUpserted: number;
  errorCount: number;
  errors: BackupRestoreErrorDetail[];
}
```
