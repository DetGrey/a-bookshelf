import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BookService, WaitingUpdateProgress, WaitingUpdateSummary } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookGridComponent } from '../../shared/components/book-grid/book-grid.component';
import { BookshelfFilterService } from './bookshelf-filter.service';
import { FormsModule } from '@angular/forms';
import { Book, BookStatus } from '../../models/book.model';
import { escapeRegex } from '../../shared/utils/string.util';

@Component({
  selector: 'app-bookshelf-page',
  standalone: true,
  imports: [BookGridComponent, FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <p class="eyebrow">Library</p>
          <h1>Bookshelf</h1>
          <p class="muted">Browse, filter, and organize your collection</p>
        </div>
        <a href="/add" class="primary">Smart Add</a>
      </div>

      <section class="bookshelf-layout">
        <aside class="shelf-sidebar">
          <div class="block">
            <div class="block-head cursor-pointer" (click)="statusOpen.set(!statusOpen())">
              <p class="eyebrow">Status {{ statusOpen() ? '▼' : '▶' }}</p>
            </div>

            @if (statusOpen()) {
              <nav class="shelf-list">
                <button
                  data-testid="shelf-all"
                  type="button"
                  class="shelf-item"
                  [class.active]="isShelfSelected('all')"
                  (click)="selectShelf('all')"
                >
                  <div>
                    <span>All Books<span class="sr-only"> ({{ books().length }})</span></span>
                    <span class="shelf-count">{{ books().length }}</span>
                  </div>
                </button>

                @for (statusShelf of statusShelves(); track statusShelf.key) {
                  <button
                    [attr.data-testid]="'shelf-status-' + statusShelf.value"
                    type="button"
                    class="shelf-item"
                    [class.active]="isShelfSelected(statusShelf.key)"
                    (click)="selectShelf(statusShelf.key)"
                  >
                    <div>
                      <span>{{ statusShelf.label }}<span class="sr-only"> ({{ statusShelf.count }})</span></span>
                      <span class="shelf-count">{{ statusShelf.count }}</span>
                    </div>
                  </button>
                }
              </nav>
            }
          </div>

          <div class="block shelf-block-section">
            <div class="block-head cursor-pointer" (click)="customOpen.set(!customOpen())">
              <p class="eyebrow">Custom Shelves {{ customOpen() ? '▼' : '▶' }}</p>
              <button
                class="ghost shelf-header-button"
                type="button"
                (click)="$event.stopPropagation(); showNewShelfForm.set(!showNewShelfForm())"
              >
                + New
              </button>
            </div>

            @if (customOpen()) {
              <nav class="shelf-list">
                @for (shelf of customShelves(); track shelf.id) {
                  <div class="shelf-item-wrapper">
                    <button
                      [attr.data-testid]="'shelf-custom-' + shelf.id"
                      type="button"
                      class="shelf-item flex-1"
                      [class.active]="isShelfSelected('custom:' + shelf.id)"
                      (click)="selectShelf('custom:' + shelf.id)"
                    >
                      <div>
                        <span>{{ shelf.name }}<span class="sr-only"> ({{ shelf.bookCount }})</span></span>
                        <span class="shelf-count">{{ shelf.bookCount }}</span>
                      </div>
                    </button>

                    <button
                      [attr.data-testid]="'delete-shelf-' + shelf.id"
                      type="button"
                      class="shelf-delete"
                      (click)="deleteCustomShelf(shelf.id)"
                    >
                      ×
                    </button>
                  </div>
                }
              </nav>

              @if (showNewShelfForm()) {
                <form class="stack" (submit)="onCreateShelfSubmit($event)">
                  <label class="field">
                    <span>Shelf name</span>
                    <input
                      data-testid="create-shelf-input"
                      name="newShelfName"
                      [(ngModel)]="newShelfName"
                      placeholder="Favorites, To Buy..."
                    />
                  </label>

                  <div class="shelf-form-section">
                    <button data-testid="create-shelf-button" type="submit" class="primary shelf-form-button">Create</button>
                    <button type="button" class="ghost shelf-form-button" (click)="showNewShelfForm.set(false)">Cancel</button>
                  </div>
                </form>
              }
            }
          </div>

          @if (sidebarMessage()) {
            <p class="error">{{ sidebarMessage() }}</p>
          }
        </aside>

        <div class="shelf-content">
          @if (isLoading()) {
            <p>Loading library...</p>
          } @else if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          } @else if (books().length === 0) {
            <p>No books yet.</p>
          } @else {
            <div class="shelf-controls">
              <label class="field shelf-search">
                <span>Search</span>
                <input
                  data-testid="search-input"
                  [value]="filters.search()"
                  (input)="onSearchInput($event)"
                  placeholder="Search by title or description..."
                />
              </label>

              <div class="shelf-controls-row">
                <label class="field min-w-180">
                  <span>Sort by</span>
                  <select [value]="filters.sort()" (change)="onSortChange($event)">
                    @if (filters.search()) {
                      <option value="relevance">Relevance (search)</option>
                    }
                    <option value="createdAt">Date Added</option>
                    <option value="updatedAt">Last Updated</option>
                    <option value="score">Score</option>
                    <option value="chapterCount">Chapter Count</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="status">Status</option>
                  </select>
                </label>

                <button
                  class="ghost sort-direction-button"
                  type="button"
                  (click)="toggleSortDirection()"
                  [attr.title]="filters.sortDir() === 'desc' ? 'Descending' : 'Ascending'"
                >
                  {{ filters.sortDir() === 'desc' ? '↓' : '↑' }}
                </button>

                <label class="field min-w-160">
                  <span>Language</span>
                  <select [value]="filters.language() || 'all'" (change)="onLanguageChange($event)">
                    <option value="all">All languages</option>
                    @for (language of allLanguages(); track language) {
                      <option [value]="language">{{ language }}</option>
                    }
                  </select>
                </label>
              </div>
            </div>

            <div class="block mt-12">
              <div class="filter-header" data-testid="genre-filter-toggle" (click)="genreFilterOpen.set(!genreFilterOpen())">
                <p class="eyebrow">Filter by Genre {{ genreFilterOpen() ? '▼' : '▶' }}</p>

                @if (filters.genres().length > 0) {
                  <div class="mode-toggle genre-mode-toggle">
                    <button
                      type="button"
                      data-testid="genre-mode-any"
                      class="pill filter-toggle-button"
                      [class.ghost]="filters.genreMode() !== 'any'"
                      (click)="$event.stopPropagation(); setGenreMode('any')"
                    >
                      Any
                    </button>
                    <button
                      type="button"
                      data-testid="genre-mode-all"
                      class="pill filter-toggle-button"
                      [class.ghost]="filters.genreMode() !== 'all'"
                      (click)="$event.stopPropagation(); setGenreMode('all')"
                    >
                      All
                    </button>
                  </div>
                }
              </div>

              @if (genreFilterOpen()) {
                <div class="filter-options">
                  @if (filters.genres().length > 0) {
                    <button class="pill radius-8" type="button" (click)="clearGenres()">✕ Clear</button>
                  }

                  @for (genre of allGenres(); track genre) {
                    <button
                      type="button"
                      class="pill radius-8 filter-chip"
                      [class.ghost]="!isGenreActive(genre)"
                      [attr.data-testid]="'genre-chip-' + genre"
                      (click)="onGenreToggled(genre)"
                    >
                      {{ genre }}
                    </button>
                  }
                </div>

                <div class="filter-options selected-tags">
                  @for (genre of filters.genres(); track genre) {
                    <span class="pill">
                      {{ genre }}
                      <button
                        type="button"
                        class="genre-remove"
                        [attr.data-testid]="'remove-genre-' + genre"
                        (click)="removeGenreTag(genre)"
                      >
                        ×
                      </button>
                    </span>
                  }
                </div>
              }
            </div>

            <div class="block mt-12">
              <div class="filter-header" data-testid="chapter-filter-toggle" (click)="chapterFilterOpen.set(!chapterFilterOpen())">
                <p class="eyebrow">Filter by Chapter Count {{ chapterFilterOpen() ? '▼' : '▶' }}</p>

                @if (filters.chapterValue() !== null) {
                  <div class="mode-toggle">
                    <button
                      type="button"
                      data-testid="chapter-mode-max"
                      class="filter-toggle-button"
                      [class.pill]="filters.chapterMode() === 'max'"
                      [class.ghost]="filters.chapterMode() !== 'max'"
                      (click)="$event.stopPropagation(); setChapterMode('max')"
                    >
                      Max
                    </button>
                    <button
                      type="button"
                      data-testid="chapter-mode-min"
                      class="filter-toggle-button"
                      [class.pill]="filters.chapterMode() === 'min'"
                      [class.ghost]="filters.chapterMode() !== 'min'"
                      (click)="$event.stopPropagation(); setChapterMode('min')"
                    >
                      Min
                    </button>
                  </div>
                }
              </div>

              @if (chapterFilterOpen()) {
                <div class="preset-options">
                  @if (filters.chapterValue() !== null) {
                    <button class="pill radius-8 filter-chip" type="button" data-testid="chapter-preset-clear" (click)="clearChapterFilter()">✕ Clear</button>
                  } @else {
                    <button class="pill filter-chip" type="button" data-testid="chapter-preset-clear" (click)="setChapterValue(null)">Any</button>
                  }

                  @for (preset of chapterPresets; track preset) {
                    <button
                      type="button"
                      class="pill radius-8 filter-chip"
                      [attr.data-testid]="'chapter-preset-' + preset"
                      [class.ghost]="filters.chapterValue() !== preset"
                      (click)="setChapterValue(preset)"
                    >
                      {{ preset }} chapters
                    </button>
                  }
                </div>
              }
            </div>

            <div class="results-header" id="bookshelf-results">
              <p class="muted">
                {{ filteredSortedBooks().length }} {{ filteredSortedBooks().length === 1 ? 'book' : 'books' }} found
                {{ isLoading() ? '(loading...)' : '' }}
              </p>

              @if (isWaitingShelfContext() && filteredSortedBooks().length > 0) {
                <button
                  data-testid="waiting-updates-button"
                  type="button"
                  class="primary text-small"
                  [disabled]="waitingUpdatesRunning()"
                  (click)="runWaitingUpdates()"
                >
                  {{ waitingUpdatesRunning() ? 'Checking…' : 'Check Updates' }}
                </button>
              }
            </div>

            @if (waitingUpdateProgress(); as progress) {
              <div class="notice mb-12">
                <p class="muted m-0">Progress: {{ progress.processed }} / {{ progress.total }}</p>
                @if (progress.total > 0) {
                  <div class="progress-container">
                    <div class="progress-bar" [style.width.%]="(progress.processed / progress.total) * 100"></div>
                  </div>
                }
              </div>
            }

            @if (waitingUpdateError()) {
              <p class="error">{{ waitingUpdateError() }}</p>
            }

            @if (waitingUpdateSummary()) {
              <div class="notice mb-12">
                <p>Updated: {{ waitingUpdateSummary()!.updatedCount }}</p>
                <p>Skipped: {{ waitingUpdateSummary()!.skippedCount }}</p>
                <p>Errors: {{ waitingUpdateSummary()!.errorCount }}</p>

                @if (waitingErrorDetails().length > 0) {
                  <ul>
                    @for (item of waitingErrorDetails(); track item.bookId) {
                      <li>{{ item.title }}: {{ item.detail }}</li>
                    }
                  </ul>
                }
              </div>
            }

            <p class="muted">Shelves: {{ shelfCount() }}</p>
            <app-book-grid
              [books]="pagedBooks()"
              [customShelves]="customShelves()"
              [activeGenres]="filters.genres()"
              (opened)="onOpenDetails($event)"
              (genreToggled)="onGenreToggled($event)"
              (shelfToggled)="onShelfToggled($event)"
            />

            @if (totalPages() > 1) {
              <div class="pagination-controls">
                <div class="pagination-info">
                  Showing {{ (filters.page() - 1) * filters.pageSize() + 1 }}–{{ pageEndIndex() }} of {{ filteredSortedBooks().length }} books
                </div>
                <div class="pagination-buttons">
                  <button class="ghost" type="button" [disabled]="filters.page() <= 1" (click)="setPage(filters.page() - 1)">← Previous</button>
                  <select class="page-selector" [value]="filters.page()" (change)="onPageSelect($event)">
                    @for (pageNumber of pageOptions(); track pageNumber) {
                      <option [value]="pageNumber">Page {{ pageNumber }}</option>
                    }
                  </select>
                  <button class="ghost" type="button" [disabled]="filters.page() >= totalPages()" (click)="setPage(filters.page() + 1)">Next →</button>
                </div>
              </div>
            } @else {
              <p class="muted">Page {{ filters.page() }} of {{ totalPages() }}</p>
            }
          }
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookshelfPageComponent {
  private readonly bookService = inject(BookService);
  private readonly shelfService = inject(ShelfService);
  private readonly document = inject(DOCUMENT);
  readonly filters = inject(BookshelfFilterService);

  readonly books = this.bookService.books;
  readonly customShelves = this.shelfService.shelves;
  readonly shelfCount = this.shelfService.shelfCount;
  readonly isLoading = computed(() => this.bookService.isLoading() || this.shelfService.isLoading());
  readonly errorMessage = this.bookService.errorMessage;
  readonly sidebarMessage = this.shelfService.errorMessage;
  readonly selectedShelf = computed(() => {
    const shelfReader = (this.filters as Partial<BookshelfFilterService>).shelf;
    const shelf = typeof shelfReader === 'function' ? shelfReader() : null;
    return shelf ?? 'all';
  });
  readonly isWaitingShelfContext = computed(() => this.selectedShelf() === 'status:waiting');
  readonly waitingUpdatesRunning = signal(false);
  readonly waitingErrorDetails = computed(() => this.waitingUpdateSummary()?.outcomes.filter((item) => item.status === 'error') ?? []);
  readonly statusOpen = signal(true);
  readonly customOpen = signal(true);
  readonly showNewShelfForm = signal(true);
  readonly genreFilterOpen = signal(false);
  readonly chapterFilterOpen = signal(false);
  readonly statusShelves = computed(() => {
    const source = this.books();
    return this.statusOptions.map((status) => ({
      key: `status:${status}`,
      value: status,
      label: this.statusLabels[status],
      count: source.filter((book) => book.status === status).length,
    }));
  });
  
  readonly filteredSortedBooks = computed(() => {
    let collection = [...this.books()];

    const selectedShelf = this.selectedShelf();
    if (selectedShelf.startsWith('status:')) {
      const status = selectedShelf.slice('status:'.length) as BookStatus;
      collection = collection.filter((book) => book.status === status);
    } else if (selectedShelf.startsWith('custom:')) {
      const customShelfId = selectedShelf.slice('custom:'.length);
      const shelf = this.customShelves().find((candidate) => candidate.id === customShelfId);
      const allowedIds = new Set(shelf?.bookIds ?? []);
      collection = collection.filter((book) => allowedIds.has(book.id));
    }

    const search = this.filters.search().trim().toLowerCase();
    const language = (this.filters.language() ?? '').trim().toLowerCase();
    const genres = this.filters.genres().map((genre) => genre.toLowerCase());
    const genreMode = this.filters.genreMode ? this.filters.genreMode() : 'all';
    
    const chapterValue = this.filters.chapterValue();
    const chapterMode = this.filters.chapterMode();

    if (search) {
      collection = collection.filter((book) => this.scoreBook(book, search) > 0);
    }

    if (language) {
      collection = collection.filter((book) => (book.language ?? '').toLowerCase() === language);
    }

    if (genres.length > 0) {
      collection = collection.filter((book) => {
        const bookGenres = book.genres.map((genre) => genre.toLowerCase());
        
        // ISSUE-018: Any vs All genre logic
        return genreMode === 'any'
          ? genres.some((genre) => bookGenres.includes(genre))
          : genres.every((genre) => bookGenres.includes(genre));
      });
    }

    if (chapterValue !== null) {
      collection = chapterMode === 'max'
        ? collection.filter((book) => (book.chapterCount ?? Number.MAX_SAFE_INTEGER) <= chapterValue)
        : collection.filter((book) => (book.chapterCount ?? 0) >= chapterValue);
    }

    const direction = this.filters.sortDir() === 'asc' ? 1 : -1;
    const sort = this.filters.sort();

    collection.sort((left, right) => {
      const result = this.compareBooks(left, right, sort);
      return result * direction;
    });

    return collection;
  });

  readonly totalPages = computed(() => {
    const total = Math.ceil(this.filteredSortedBooks().length / this.filters.pageSize());
    return Math.max(1, total);
  });

  readonly pagedBooks = computed(() => {
    const page = Math.min(this.filters.page(), this.totalPages());
    const pageSize = this.filters.pageSize();
    const start = (page - 1) * pageSize;
    return this.filteredSortedBooks().slice(start, start + pageSize);
  });

  constructor() {
    void this.bookService.loadBooks();
    void this.shelfService.loadShelves();

    afterNextRender(() => {
      this.restoreViewMemory();
    });
  }

  newShelfName = '';
  readonly allGenres = computed(() => {
    const values = this.books().flatMap((book) => book.genres ?? []);
    return [...new Set(values)].sort((left, right) => left.localeCompare(right));
  });
  readonly allLanguages = computed(() => {
    const values = this.books()
      .map((book) => (book.language ?? '').trim())
      .filter((value) => value.length > 0);
    return [...new Set(values)].sort((left, right) => left.localeCompare(right));
  });

  readonly pageOptions = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));
  readonly pageEndIndex = computed(() => {
    const upper = this.filters.page() * this.filters.pageSize();
    return Math.min(upper, this.filteredSortedBooks().length);
  });

  readonly waitingUpdateProgress = signal<WaitingUpdateProgress | null>(null);
  readonly waitingUpdateSummary = signal<WaitingUpdateSummary | null>(null);
  readonly waitingUpdateError = signal<string | null>(null);

  readonly statusOptions: readonly BookStatus[] = ['reading', 'plan_to_read', 'waiting', 'completed', 'dropped', 'on_hold'];

  readonly statusLabels: Record<BookStatus, string> = {
    reading: 'Reading',
    plan_to_read: 'Plan to read',
    waiting: 'Waiting',
    completed: 'Completed',
    dropped: 'Dropped',
    on_hold: 'On hold',
  };

  selectShelf(key: string): void {
    void this.filters.updateFilter('shelf', key);
  }

  isShelfSelected(key: string): boolean {
    return this.selectedShelf() === key;
  }

  onCreateShelfSubmit(event: Event): void {
    event.preventDefault();
    void this.createCustomShelf();
  }

  async createCustomShelf(): Promise<void> {
    const result = await this.shelfService.createShelf(this.newShelfName);
    if (result.success) {
      this.newShelfName = '';
    }
  }

  async deleteCustomShelf(shelfId: string): Promise<void> {
    const result = await this.shelfService.deleteShelf(shelfId);
    if (!result.success) {
      return;
    }

    if (this.selectedShelf() === `custom:${shelfId}`) {
      await this.filters.updateFilter('shelf', 'all');
    }
  }

  async runWaitingUpdates(): Promise<void> {
    const waitingBooks = this.books().filter((book) => book.status === 'waiting');
    this.waitingUpdatesRunning.set(true);
    this.waitingUpdateProgress.set({ processed: 0, total: waitingBooks.length, updated: 0, skipped: 0, errors: 0 });
    this.waitingUpdateSummary.set(null);
    this.waitingUpdateError.set(null);

    const result = await this.bookService.runWaitingShelfLatestUpdates(waitingBooks, {
      onProgress: (progress) => {
        this.waitingUpdateProgress.set(progress);
      },
    });

    this.waitingUpdatesRunning.set(false);

    if (!result.success) {
      this.waitingUpdateError.set(result.error.message);
      this.waitingUpdateSummary.set(null);
      return;
    }

    this.waitingUpdateSummary.set(result.data);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    void this.filters.updateFilter('search', target.value);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    void this.filters.updateFilter('sort', target.value);
  }

  onSortDirChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    void this.filters.updateFilter('sortDir', target.value);
  }

  toggleSortDirection(): void {
    const next = this.filters.sortDir() === 'desc' ? 'asc' : 'desc';
    void this.filters.updateFilter('sortDir', next);
  }

  onLanguageInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    void this.filters.updateFilter('language', target.value);
  }

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value === 'all' ? '' : target.value;
    void this.filters.updateFilter('language', value);
  }

  removeGenreTag(genre: string): void {
    const target = genre.trim().toLowerCase();
    void this.filters.updateFilter('genres', this.filters.genres().filter((g) => g.trim().toLowerCase() !== target));
  }

  clearGenres(): void {
    void this.filters.updateFilter('genres', []);
    this.genreFilterOpen.set(false);
  }
  
  // ISSUE-018: New Method for Genre Mode
  setGenreMode(mode: 'any' | 'all'): void {
    void this.filters.updateFilter('genreMode', mode);
  }

  readonly chapterPresets = [10, 20, 50, 100, 200];

  setChapterValue(value: number | null): void {
    if (value === null) {
      void this.filters.updateFilter('chapterValue', null);
      return;
    }

    const next = this.filters.chapterValue() === value ? null : value;
    void this.filters.updateFilter('chapterValue', next);
  }

  setChapterMode(mode: 'min' | 'max'): void {
    void this.filters.updateFilter('chapterMode', mode);
  }

  clearChapterFilter(): void {
    void this.filters.updateFilter('chapterValue', null);
    this.chapterFilterOpen.set(false);
  }

  onPageSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = Number(target.value);
    if (Number.isFinite(value)) {
      this.setPage(value);
    }
  }

  setPage(page: number): void {
    const clampedPage = Math.min(Math.max(page, 1), this.totalPages());
    void this.filters.updateFilter('page', clampedPage);
  }

  onOpenDetails(bookId: string): void {
    const view = this.document.defaultView;
    this.filters.rememberAnchor(bookId);
    this.filters.rememberScroll(view?.scrollY ?? 0);
  }

  onGenreToggled(genre: string): void {
    const current = this.filters.genres();
    const selected = genre.trim().toLowerCase();
    const isActive = current.some((item) => item.trim().toLowerCase() === selected);
    const next = isActive
      ? current.filter((item) => item.trim().toLowerCase() !== selected)
      : [...current, this.resolveGenreLabel(genre)];
    void this.filters.updateFilter('genres', next);
  }

  isGenreActive(genre: string): boolean {
    const selected = genre.trim().toLowerCase();
    return this.filters.genres().some((item) => item.trim().toLowerCase() === selected);
  }

  onShelfToggled(payload: { bookId: string; shelfId: string }): void {
    void this.shelfService.toggleBookOnShelf(payload.bookId, payload.shelfId);
  }

  private restoreViewMemory(): void {
    const selectedAnchorReader = (this.filters as Partial<BookshelfFilterService>).selectedAnchor;
    const scrollReader = (this.filters as Partial<BookshelfFilterService>).scrollY;

    const anchorId = typeof selectedAnchorReader === 'function' ? selectedAnchorReader() : null;

    if (anchorId) {
      const anchorElement = this.document.getElementById(`book-anchor-${anchorId}`);
      if (anchorElement) {
        anchorElement.scrollIntoView({ block: 'center' });
        return;
      }
    }

    const savedScroll = typeof scrollReader === 'function' ? scrollReader() : 0;
    if (savedScroll > 0) {
      this.document.defaultView?.scrollTo({ top: savedScroll, behavior: 'auto' });
    }
  }

  private compareBooks(left: Book, right: Book, sort: ReturnType<typeof this.filters.sort>): number {
    if (sort === 'relevance' && this.filters.search()) {
      const scoreLeft = this.scoreBook(left, this.filters.search());
      const scoreRight = this.scoreBook(right, this.filters.search());
      
      if (scoreLeft !== scoreRight) {
        return scoreLeft - scoreRight;
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    }

    switch (sort) {
      case 'title':
        return left.title.localeCompare(right.title);
      case 'score':
        return (left.score ?? -1) - (right.score ?? -1);
      case 'chapterCount':
        return (left.chapterCount ?? -1) - (right.chapterCount ?? -1);
      case 'status':
        return left.status.localeCompare(right.status);
      case 'createdAt':
        return left.createdAt.getTime() - right.createdAt.getTime();
      case 'updatedAt':
      default:
        return left.updatedAt.getTime() - right.updatedAt.getTime();
    }
  }

  private scoreBook(book: Book, search: string): number {
    const query = search.trim().toLowerCase();
    if (!query) {
      return 0;
    }

    const title = book.title.toLowerCase();
    const description = book.description.toLowerCase();

    if (title === query) {
      return 1000;
    }

    if (title.startsWith(query)) {
      return 500;
    }

    const boundaryRegex = new RegExp(`\\b${escapeRegex(query)}`);
    if (boundaryRegex.test(title)) {
      return 300;
    }

    if (title.includes(query)) {
      return 200;
    }

    if (description.includes(query)) {
      return 50;
    }

    return 0;
  }

  private resolveGenreLabel(value: string): string {
    const trimmed = value.trim();
    const match = this.allGenres().find((genre) => genre.toLowerCase() === trimmed.toLowerCase());
    return match ?? trimmed;
  }
}
