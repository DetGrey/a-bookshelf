# ISSUE-021 — Dashboard Visual Enhancements (Extra Stats and Per-Status Book Sections)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§4 services, §5 component rules)
- `../../FRONTEND_BLUEPRINT.md` (§6.3 dashboard tools)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-017
- User stories covered:
  - As a user, the dashboard shows me how many books I've completed and which book was most recently updated.
  - As a user, the dashboard shows me a grid of recent books for each reading status so I can quickly jump back to something I was reading.

## What to build

Two discrete additions to `DashboardPageComponent`:

### 1. Two additional stats cards

React's dashboard shows 6 stat cards; Angular shows 4. Add the two missing ones:

**"Completed"** — count of books with `status === 'completed'`
```typescript
readonly completedCount = computed(() =>
  this.books().filter((book) => book.status === 'completed').length
);
```

**"Last updated"** — title of the most recently updated book
```typescript
readonly lastUpdatedTitle = computed(() => {
  const sorted = [...this.books()].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
  return sorted[0]?.title ?? '—';
});
```

Add both to the stats grid in the template:
```html
<article>
  <h2>Completed</h2>
  <p>{{ completedCount() }}</p>
</article>
<article>
  <h2>Last updated</h2>
  <p>{{ lastUpdatedTitle() }}</p>
</article>
```

---

### 2. Per-status recent book sections

React's Dashboard renders a compact BookCard grid for each of four statuses (Reading, Plan to Read, Waiting, Completed) showing the most recently updated N books per status.

Add this below the existing breakdown sections. For each status in `['reading', 'plan_to_read', 'waiting', 'completed']`:
- Filter `books()` to that status
- Sort descending by `updatedAt`
- Take the first `booksPerStatus()` books

```typescript
readonly booksPerStatus = signal(4);

readonly sectionStatuses = [
  { key: 'reading', label: 'Reading' },
  { key: 'plan_to_read', label: 'Plan to Read' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'completed', label: 'Completed' },
] as const;

readonly statusSections = computed(() =>
  this.sectionStatuses.map((section) => ({
    ...section,
    books: [...this.books()]
      .filter((b) => b.status === section.key)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, this.booksPerStatus()),
  }))
);
```

Template (below status breakdown section):
```html
@for (section of statusSections(); track section.key) {
  @if (section.books.length > 0) {
    <section>
      <h2>{{ section.label }}</h2>
      <app-book-grid [books]="section.books" [compact]="true" (opened)="onOpenDetails($event)" />
    </section>
  }
}
```

#### `BookGridComponent` compact input
Add a `compact = input<boolean>(false)` input to `BookGridComponent`. When `compact=true`, pass `[compact]="true"` to each `BookCardComponent`.

#### Responsive `booksPerStatus`
Listen to window resize and set `booksPerStatus` appropriately:
```typescript
constructor() {
  afterNextRender(() => {
    this.updateBooksPerStatus();
    fromEvent(this.document.defaultView!, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateBooksPerStatus());
  });
}

private updateBooksPerStatus(): void {
  this.booksPerStatus.set(
    (this.document.defaultView?.innerWidth ?? 1024) < 768 ? 3 : 4
  );
}
```
Inject `DestroyRef` and use `takeUntilDestroyed` to avoid memory leaks. Import `fromEvent` from `rxjs` and `takeUntilDestroyed` from `@angular/core/rxjs-interop`.

## Acceptance criteria
- [ ] Dashboard stat grid shows 6 cards: Total saved, Waiting, Average score, Rated 10, Completed, Last updated.
- [ ] "Completed" count matches books with `status === 'completed'`.
- [ ] "Last updated" shows the title of the book with the most recent `updatedAt`.
- [ ] Per-status sections appear for Reading, Plan to Read, Waiting, Completed.
- [ ] Each section shows the N most recently updated books for that status (4 on wide screens, 3 on narrow).
- [ ] Sections with 0 books are hidden entirely.
- [ ] `BookGridComponent` accepts and forwards a `compact` input to `BookCardComponent`.
- [ ] Resize listener is torn down on component destroy.
- [ ] Tests cover: correct book counts in stat cards, section ordering (most recently updated first), compact flag forwarded.
- [ ] Existing test baseline preserved.

## Blocked by
- Blocked by ISSUE-017 (needs `compact` mode on `BookCardComponent`).
