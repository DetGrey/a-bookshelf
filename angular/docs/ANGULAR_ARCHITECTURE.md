# Angular Architecture — A Bookshelf

This document is the authoritative architectural reference for the Angular rewrite of the bookshelf frontend. Every decision here was made deliberately. Deviations require explicit justification and a doc update.

---

## Table of Contents

1. [Stack Decisions](#1-stack-decisions)
2. [Folder Structure](#2-folder-structure)
3. [Type Model Layers](#3-type-model-layers)
4. [Service Architecture](#4-service-architecture)
5. [Component Rules](#5-component-rules)
6. [Data Flow Rules](#6-data-flow-rules)
7. [Routing Architecture](#7-routing-architecture)
8. [Forms](#8-forms)
9. [Error Handling Contract](#9-error-handling-contract)
10. [Styling](#10-styling)
11. [Testing Strategy](#11-testing-strategy)
12. [Tooling Configuration](#12-tooling-configuration)
13. [Architectural Rules Reference](#13-architectural-rules-reference)

---

## 1. Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Framework | Angular 21 | Latest stable |
| Component model | Standalone components | NgModules are being phased out; standalone is the Angular team's default |
| State management | Services + Signals | Two clear state domains (auth, library); NgRx adds 3× code for the same result |
| TypeScript | All strict flags | See §12; retrofitting strictness is painful, starting strict is free |
| Change detection | `OnPush` everywhere | Enforces data flow discipline; components re-render only on signal change or new `@Input()` |
| API layer | Repository + Service | Repository: raw Supabase CRUD. Service: business logic. Separation is the testability seam |
| Type layers | Three (Record / Domain / Form) | Prevents form state polluting domain model; mapper functions are the single transformation point |
| Routing | Hybrid — global signals + resolvers | Library state: global `BookService` signal. Per-book detail: route resolver |
| Forms | Reactive Forms | Fully typed with `FormGroup<T>`; required for nested `FormArray` structures |
| Error handling | Result type | Errors are part of the type signature; callers are forced to handle both outcomes |
| Styling | SCSS + component-scoped + global tokens | Preserves existing design system; no utility framework fighting custom aesthetic |
| Testing | Jest + Angular Testing Library | Fast; ATL encourages testing behaviour over implementation |
| Supabase DI | Injection token (`SUPABASE_CLIENT`) | DI seam for testing without a wrapper-service layer |
| Realtime | `BookService` + `effect()` | Subscription lifecycle tied to auth state, not component lifecycle |
| Filter state | URL as single source of truth | Filters persist on refresh and are shareable by design |
| Optimistic updates | In `BookService` with rollback | Signal updated immediately; rolled back on `Result.success === false` |
| Auth bootstrap | `APP_INITIALIZER` | App renders nothing until auth state is known; guards stay synchronous |
| Enforcement | ESLint + `@angular-eslint` + `eslint-plugin-boundaries` + this document | Architectural rules are machine-verifiable, not just convention |

---

## 2. Folder Structure

```
src/
├── app/
│   ├── app.config.ts              # Bootstrap: providers, APP_INITIALIZER, router
│   ├── app.routes.ts              # Root route definitions
│   │
│   ├── core/                      # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── auth.guard.ts
│   │   ├── book/
│   │   │   ├── book.repository.ts
│   │   │   └── book.service.ts
│   │   ├── shelf/
│   │   │   ├── shelf.repository.ts
│   │   │   └── shelf.service.ts
│   │   └── supabase.token.ts      # SUPABASE_CLIENT injection token
│   │
│   ├── shared/                    # Dumb components, pipes, directives
│   │   ├── components/
│   │   │   ├── book-card/
│   │   │   ├── book-grid/
│   │   │   ├── cover-image/
│   │   │   ├── status-pill/
│   │   │   ├── genre-pill/
│   │   │   └── loading-spinner/
│   │   └── pipes/
│   │       └── score-display.pipe.ts
│   │
│   ├── features/                  # Smart feature components, one folder per route
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── components/        # Feature-local dumb components
│   │   │       ├── stats-card/
│   │   │       ├── genre-breakdown/
│   │   │       └── quality-tools/
│   │   ├── bookshelf/
│   │   │   ├── bookshelf.component.ts
│   │   │   ├── bookshelf.routes.ts
│   │   │   ├── bookshelf-filter.service.ts
│   │   │   └── components/
│   │   │       ├── shelf-sidebar/
│   │   │       ├── genre-filter/
│   │   │       └── chapter-count-filter/
│   │   ├── add-book/
│   │   │   ├── add-book.component.ts
│   │   │   ├── add-book.routes.ts
│   │   │   └── components/
│   │   │       ├── metadata-fetcher/   # Self-contained smart exception
│   │   │       ├── source-manager/
│   │   │       ├── shelf-selector/
│   │   │       └── book-form-fields/
│   │   └── book-details/
│   │       ├── book-details.component.ts
│   │       ├── book-details.resolver.ts
│   │       ├── book-details.routes.ts
│   │       └── components/
│   │           └── book-search-linker/  # Self-contained smart exception
│   │
│   └── models/                    # All TypeScript interfaces and mapper functions
│       ├── book.model.ts          # BookRecord, Book, BookFormModel
│       ├── shelf.model.ts
│       ├── source.model.ts
│       ├── result.model.ts        # Result<T>, AppError, ErrorCode
│       └── mappers/
│           ├── book.mapper.ts     # toBook(), toFormModel(), toSupabasePayload()
│           └── shelf.mapper.ts
│
├── styles/
│   ├── _tokens.scss               # All design tokens as SCSS variables
│   ├── _buttons.scss
│   ├── _cards.scss
│   ├── _pills.scss
│   ├── _forms.scss
│   ├── _layout.scss
│   └── _sidebar.scss
└── styles.scss                    # Global imports only; no rules here
```

### Import boundary rules (enforced by `eslint-plugin-boundaries`)

| Layer | May import from |
|---|---|
| `features/*` | `core/`, `shared/`, `models/` |
| `shared/` | `models/` only |
| `core/` | `models/` only |
| `models/` | nothing inside `app/` |
| Cross-feature imports | **Forbidden** — `features/bookshelf` cannot import from `features/dashboard` |

---

## 3. Type Model Layers

Three distinct layers for every entity that crosses a boundary.

### Layer 1 — `BookRecord` (Supabase shape)

Raw database row. Comes directly from Supabase, never used in templates or forms.

```typescript
// models/book.model.ts
export interface BookRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  score: number | null;
  status: string;
  genres: string[];
  language: string | null;
  chapter_count: number | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  // ... all raw DB columns
}
```

### Layer 2 — `Book` (domain model)

Transformed, validated, application-ready. This is what services, signals, and smart components work with.

```typescript
export interface Book {
  id: string;
  title: string;
  description: string;
  score: number | null;          // null = unscored, never 0
  status: BookStatus;            // enum, not raw string
  genres: readonly string[];
  language: string | null;
  chapterCount: number | null;   // camelCase, not snake_case
  coverUrl: string | null;
  sources: readonly Source[];
  shelves: readonly string[];
  relatedBooks: readonly string[];
  createdAt: Date;
  updatedAt: Date;
}

export type BookStatus = 'reading' | 'completed' | 'dropped' | 'plan_to_read' | 'waiting';
```

### Layer 3 — `BookFormModel` (form state)

Mutable, nullable fields for form binding. Separate from the domain model so form state never pollutes signals.

```typescript
export interface BookFormModel {
  title: string;
  description: string;
  score: number | null;
  status: BookStatus | null;
  genres: string;                // Comma-separated string while editing
  language: string;
  chapterCount: number | null;
  coverUrl: string;
  sources: SourceFormModel[];
  shelves: string[];
  relatedBookIds: string[];
}
```

### Mapper functions

All transformations between layers live exclusively in `models/mappers/`. No ad-hoc mapping in services or components.

```typescript
// models/mappers/book.mapper.ts
export function toBook(record: BookRecord, sources: SourceRecord[], shelves: string[]): Book
export function toFormModel(book: Book): BookFormModel
export function toSupabasePayload(form: BookFormModel): Partial<BookRecord>
```

---

## 4. Service Architecture

### `core/supabase.token.ts`

```typescript
import { InjectionToken } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SupabaseClient');
```

Provided once in `app.config.ts`:
```typescript
{ provide: SUPABASE_CLIENT, useFactory: () => createClient(URL, KEY) }
```

### Repositories — raw data access only

Repositories inject `SUPABASE_CLIENT`. They return `Promise<Result<T>>`. They contain no business logic.

```typescript
// core/book/book.repository.ts
@Injectable({ providedIn: 'root' })
export class BookRepository {
  private supabase = inject(SUPABASE_CLIENT);

  async getAll(userId: string): Promise<Result<BookRecord[]>>
  async getById(id: string): Promise<Result<BookRecord>>
  async create(payload: Partial<BookRecord>): Promise<Result<BookRecord>>
  async update(id: string, payload: Partial<BookRecord>): Promise<Result<BookRecord>>
  async delete(id: string): Promise<Result<void>>
}
```

### Services — business logic and state

Services inject repositories (never `SUPABASE_CLIENT` directly). They own signals and implement business rules.

```typescript
// core/book/book.service.ts
@Injectable({ providedIn: 'root' })
export class BookService {
  private repo = inject(BookRepository);
  private auth = inject(AuthService);

  // State
  readonly books = signal<Book[]>([]);
  readonly isLoading = signal(false);

  // Derived state
  readonly bookCount = computed(() => this.books().length);
  readonly averageScore = computed(() =>
    // Business rule: ignore score 0 in averages
    ...
  );

  constructor() {
    // Realtime: subscription lifecycle tied to auth state
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadLibrary(user.id);
        this.subscribeToRealtime(user.id);
      } else {
        this.books.set([]);
        this.unsubscribeFromRealtime();
      }
    });
  }

  async updateBook(id: string, changes: Partial<Book>): Promise<Result<Book>> {
    // Optimistic update with rollback
    const previous = this.books();
    this.books.update(books => books.map(b => b.id === id ? { ...b, ...changes } : b));

    const result = await this.repo.update(id, toSupabasePayload({ ...toFormModel(this.books().find(b => b.id === id)!), ...changes }));

    if (!result.success) {
      this.books.set(previous); // Rollback
    }

    return result;
  }
}
```

### `AuthService` — bootstrap contract

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);
  readonly isInitialised = signal(false);

  async init(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    this.isInitialised.set(true);
  }
}
```

Called in `app.config.ts` via `APP_INITIALIZER`:
```typescript
{
  provide: APP_INITIALIZER,
  useFactory: (auth: AuthService) => () => auth.init(),
  deps: [AuthService],
  multi: true
}
```

---

## 5. Component Rules

### The fundamental rule

> **If it renders, it does not fetch. If it fetches, it delegates rendering.**

### Smart components (containers)

- Live in `features/`
- Inject services
- Own local UI state (e.g. `isEditMode = signal(false)`)
- Pass data to dumb children via `@Input()`
- Handle `@Output()` events from dumb children
- Call service methods; never write to signals directly
- Always `OnPush`

### Dumb components (presentational)

- Live in `shared/components/` or `features/*/components/`
- **Never inject services**
- Receive data via `@Input()` only
- Communicate upward via `@Output()` only
- Contain zero business logic
- Always `OnPush`

```typescript
// shared/components/book-card/book-card.component.ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;
  @Output() selected = new EventEmitter<string>();
  @Output() statusChanged = new EventEmitter<{ id: string; status: BookStatus }>();
}
```

### Self-contained feature component exceptions

`MetadataFetcher` and `BookSearchLinker` are complex enough to warrant their own service interaction. They are permitted to inject services but must still expose their output via `@Output()` so the parent form controls the result. Document each exception with a comment explaining why the exception applies.

---

## 6. Data Flow Rules

```
URL params
    ↓
BookshelfFilterService (reads ActivatedRoute, writes via Router.navigate)
    ↓
BookshelfComponent (smart — reads filter service + BookService signals)
    ↓ @Input()
BookGridComponent (dumb)
    ↓ @Input()
BookCardComponent (dumb)
    ↑ @Output()
BookshelfComponent → calls BookService.updateBook()
    ↓ signal.update()
BookService.books signal (single source of truth for library state)
    ↑
BookRepository (Supabase) ← rollback on failure
```

### Explicit rules

1. Components never write to service signals directly
2. All mutations go through a service method that returns `Promise<Result<T>>`
3. Smart components read signals; dumb components read `@Input()`
4. Filter state lives in the URL; `BookshelfFilterService` is the only class that reads/writes query params
5. The `books` signal in `BookService` is the single source of truth — never duplicate it locally

---

## 7. Routing Architecture

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'bookshelf', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/...') },
  { path: 'signup', loadComponent: () => import('./features/auth/signup/...') },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'bookshelf', loadComponent: () => import('./features/bookshelf/...') },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/...') },
      { path: 'add',       loadComponent: () => import('./features/add-book/...') },
      {
        path: 'book/:bookId',
        resolve: { book: bookDetailResolver },
        loadComponent: () => import('./features/book-details/...')
      }
    ]
  }
];
```

### `authGuard`

Reads `AuthService.currentUser` signal synchronously (safe because `APP_INITIALIZER` guarantees auth is resolved before any route activates).

### `bookDetailResolver`

Fetches the single book by `bookId` param. Returns `Promise<Result<Book>>`. Component receives fully-loaded data — no loading state needed inside the component for the initial render.

---

## 8. Forms

All forms use `ReactiveFormsModule`. Form structure is defined in TypeScript, typed with `FormGroup<T>`.

### Add Book / Edit Book form structure

```typescript
interface BookFormControls {
  title: FormControl<string>;
  description: FormControl<string>;
  score: FormControl<number | null>;
  status: FormControl<BookStatus | null>;
  genres: FormControl<string>;
  language: FormControl<string>;
  chapterCount: FormControl<number | null>;
  coverUrl: FormControl<string>;
  sources: FormArray<FormGroup<SourceFormControls>>;
  shelves: FormControl<string[]>;
  relatedBookIds: FormControl<string[]>;
}
```

### Sub-form components

`SourceManager` and `ShelfSelector` accept a `FormArray` as `@Input()` and manipulate it directly. This avoids event bubbling for nested mutations while keeping the parent form as the single owner of form state.

### Metadata prefill

```typescript
onMetadataFetched(metadata: BookMetadata): void {
  this.bookForm.patchValue(toFormModel(metadata));
}
```

---

## 9. Error Handling Contract

### `Result<T>` type

```typescript
// models/result.model.ts
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export interface AppError {
  code: ErrorCode;
  message: string;
  raw?: unknown;
}

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONFLICT';
```

### Rules

1. Every repository method returns `Promise<Result<T>>`
2. Every service method that calls a repository returns `Promise<Result<T>>`
3. No `try/catch` in smart components — call the service, check `result.success`
4. Errors are surfaced to the user by the smart component; they are never swallowed
5. The domain `Book` type never carries error state

---

## 10. Styling

### Global tokens (`styles/_tokens.scss`)

All design tokens from the existing CSS variable system are migrated here as SCSS variables and re-exported as CSS custom properties:

```scss
// SCSS variables for use in component SCSS files
$color-bg: #06070f;
$color-accent-teal: #00c9a7;
$color-accent-orange: #ff9e2c;
$color-text-primary: #e8ecf3;
$color-text-muted: #a8b2c1;
$radius-card: 12px;

// CSS custom properties for runtime use
:root {
  --color-bg: #{$color-bg};
  --color-accent-teal: #{$color-accent-teal};
  // ...
}
```

### Component styles

- Each component has its own `.scss` file
- `ViewEncapsulation.Emulated` (Angular default) — styles are scoped, never leak
- No global class overrides inside component SCSS
- Theme tokens used via SCSS variables (not string literals)

### Rules

1. No inline styles
2. No global class names defined inside component SCSS
3. All colour/spacing values must reference a token — no magic numbers
4. `styles.scss` contains only `@use` imports — no rules

---

## 11. Testing Strategy

### What to test and how

| Target | Tool | Approach |
|---|---|---|
| Mapper functions | Jest | Pure function unit tests; exhaustive coverage |
| `BookRepository` | Jest | Mock `SUPABASE_CLIENT` token; test each method in isolation |
| `BookService` | Jest | Mock `BookRepository`; test business rules (score averaging, waiting-book logic, rollback) |
| `BookshelfFilterService` | Jest | Mock `Router` + `ActivatedRoute`; test signal derivation from query params |
| Dumb components | Angular Testing Library | Provide `@Input()` values; assert rendered output |
| Smart components | Angular Testing Library | Provide mock services via `TestBed`; test user interactions |
| Reactive forms | Jest | Test validity rules and `patchValue` in isolation |
| Route guards | Jest | Mock `AuthService` signal; test allow/redirect logic |
| Route resolvers | Jest | Mock repository; test data mapping |

### Rules

1. Repositories are the Supabase boundary — tests never hit a real Supabase instance
2. Mapper tests must cover all three directions: `toBook()`, `toFormModel()`, `toSupabasePayload()`
3. Service tests must explicitly cover business rules documented in `FRONTEND_BLUEPRINT.md`
4. Dumb component tests assert DOM output, not internal state

---

## 12. Tooling Configuration

### `tsconfig.json` flags

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true
  }
}
```

### Angular CLI defaults (`angular.json` schematics)

```json
{
  "schematics": {
    "@schematics/angular:component": {
      "changeDetection": "OnPush",
      "standalone": true,
      "style": "scss"
    }
  }
}
```

Every generated component defaults to `OnPush`, standalone, and SCSS — no manual flag required.

### ESLint configuration

Install:
```bash
npm install --save-dev @angular-eslint/eslint-plugin @angular-eslint/template-parser eslint-plugin-boundaries
```

Key rules enforced:

```js
// .eslintrc.js (excerpt)
{
  rules: {
    // Enforce OnPush on all components
    "@angular-eslint/prefer-on-push-component-change-detection": "error",

    // No direct DOM manipulation
    "@angular-eslint/no-host-metadata-property": "error",

    // Template type safety
    "@angular-eslint/template/no-any": "error",
    "@angular-eslint/template/strict-attribute-types": "error",

    // Import boundaries
    "boundaries/element-types": ["error", {
      "default": "disallow",
      "rules": [
        { "from": "features", "allow": ["core", "shared", "models"] },
        { "from": "shared",   "allow": ["models"] },
        { "from": "core",     "allow": ["models"] },
        { "from": "models",   "allow": [] }
      ]
    }],

    // No cross-feature imports
    "boundaries/no-unknown-files": "error"
  }
}
```

---

## 13. Architectural Rules Reference

A concise checklist. Every rule here is enforced by lint, compiler, or this document.

### Enforced by TypeScript compiler
- [ ] `strict: true` — no implicit any, null checks everywhere
- [ ] `strictTemplates: true` — template bindings are type-checked
- [ ] `noUncheckedIndexedAccess: true` — array access returns `T | undefined`
- [ ] `exactOptionalPropertyTypes: true` — absent vs undefined are distinct

### Enforced by ESLint (`@angular-eslint`)
- [ ] Every component has `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] No direct DOM manipulation
- [ ] No `any` in templates
- [ ] Strict attribute type binding in templates

### Enforced by ESLint (`eslint-plugin-boundaries`)
- [ ] `features/*` imports only from `core/`, `shared/`, `models/`
- [ ] `shared/` imports only from `models/`
- [ ] `core/` imports only from `models/`
- [ ] No cross-feature imports between different features
- [ ] `models/` has no internal app imports

### Enforced by convention (code review)
- [ ] Dumb components never inject services
- [ ] Mutations always go through a service method — never `signal.set()` from a component
- [ ] All mapper functions live in `models/mappers/` — no inline transformations in services or components
- [ ] Every service method that touches Supabase returns `Promise<Result<T>>`
- [ ] `styles.scss` contains only `@use` imports
- [ ] Self-contained smart component exceptions are commented with justification
- [ ] Filter state is never stored in component — always derived from URL via `BookshelfFilterService`
