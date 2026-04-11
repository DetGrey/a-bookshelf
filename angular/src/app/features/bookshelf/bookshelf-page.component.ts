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
    <section class="bookshelf-layout">
      <aside>
        <h2>Shelves</h2>
        <button data-testid="shelf-all" type="button" [class.active]="isShelfSelected('all')" (click)="selectShelf('all')">
          All ({{ books().length }})
        </button>

        @for (statusShelf of statusShelves(); track statusShelf.key) {
          <button
            [attr.data-testid]="'shelf-status-' + statusShelf.value"
            type="button"
            [class.active]="isShelfSelected(statusShelf.key)"
            (click)="selectShelf(statusShelf.key)"
          >
            {{ statusShelf.label }} ({{ statusShelf.count }})
          </button>
        }

        <h3>Custom shelves</h3>
        @for (shelf of customShelves(); track shelf.id) {
          <div>
            <button
              [attr.data-testid]="'shelf-custom-' + shelf.id"
              type="button"
              [class.active]="isShelfSelected('custom:' + shelf.id)"
              (click)="selectShelf('custom:' + shelf.id)"
            >
              {{ shelf.name }} ({{ shelf.bookCount }})
            </button>
            <button [attr.data-testid]="'delete-shelf-' + shelf.id" type="button" (click)="deleteCustomShelf(shelf.id)">Delete</button>
          </div>
        }

        <form (submit)="onCreateShelfSubmit($event)">
          <input
            data-testid="create-shelf-input"
            name="newShelfName"
            [(ngModel)]="newShelfName"
            placeholder="New shelf"
          />
          <button data-testid="create-shelf-button" type="submit">Create shelf</button>
        </form>

        @if (sidebarMessage()) {
          <p>{{ sidebarMessage() }}</p>
        }
      </aside>

      <div>
        <h1>Bookshelf</h1>

        @if (isLoading()) {
          <p>Loading library...</p>
        } @else if (errorMessage()) {
          <p>{{ errorMessage() }}</p>
        } @else if (books().length === 0) {
          <p>No books yet.</p>
        } @else {
          @if (isWaitingShelfContext()) {
            <button
              data-testid="waiting-updates-button"
              type="button"
              [disabled]="waitingUpdatesRunning()"
              (click)="runWaitingUpdates()"
            >
              Check waiting updates
            </button>
          }

          @if (waitingUpdateProgress()) {
            <p>
              Progress: {{ waitingUpdateProgress()!.processed }} / {{ waitingUpdateProgress()!.total }}
            </p>
          }

          @if (waitingUpdateError()) {
            <p>{{ waitingUpdateError() }}</p>
          }

          @if (waitingUpdateSummary()) {
            <div>
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

          <div class="bookshelf-controls">
            <input
              data-testid="search-input"
              [value]="filters.search()"
              (input)="onSearchInput($event)"
              placeholder="Search books"
            />

            <select [value]="filters.sort()" (change)="onSortChange($event)">
              @if (filters.search()) {
                <option value="relevance">Relevance</option>
              }
              <option value="updatedAt">Updated</option>
              <option value="createdAt">Created</option>
              <option value="title">Title</option>
              <option value="score">Score</option>
              <option value="chapterCount">Chapter count</option>
              <option value="status">Status</option>
            </select>

            <select [value]="filters.sortDir()" (change)="onSortDirChange($event)">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>

            <input
              [value]="filters.language()"
              (input)="onLanguageInput($event)"
              placeholder="Language"
            />

            <div>
              <input
                data-testid="genre-input"
                [value]="genreInput()"
                (input)="onGenreInput($event)"
                (keydown.enter)="onGenreEnter($event)"
                placeholder="Add genre filter"
              />
              <button type="button" data-testid="add-genre-button" (click)="addGenreFromInput()">Add</button>
              
              @if (filters.genres().length > 0) {
                <div class="genre-mode-toggle">
                  <button 
                    type="button" 
                    data-testid="genre-mode-any" 
                    [class.active]="filters.genreMode() === 'any'" 
                    (click)="setGenreMode('any')"
                  >
                    Any
                  </button>
                  <button 
                    type="button" 
                    data-testid="genre-mode-all" 
                    [class.active]="filters.genreMode() === 'all'" 
                    (click)="setGenreMode('all')"
                  >
                    All
                  </button>
                </div>
              }

              @for (genre of filters.genres(); track genre) {
                <span>
                  {{ genre }}
                  <button type="button" [attr.data-testid]="'remove-genre-' + genre" (click)="removeGenreTag(genre)">×</button>
                </span>
              }
            </div>

            <div class="chapter-filters">
              <div class="chapter-presets">
                <button type="button" data-testid="chapter-preset-clear" [class.active]="filters.chapterValue() === null" (click)="setChapterValue(null)">Any</button>
                @for (preset of chapterPresets; track preset) {
                  <button 
                    type="button" 
                    [attr.data-testid]="'chapter-preset-' + preset" 
                    [class.active]="filters.chapterValue() === preset" 
                    (click)="setChapterValue(preset)"
                  >
                    {{ preset }}
                  </button>
                }
              </div>
              
              @if (filters.chapterValue() !== null) {
                <div class="chapter-mode-toggle">
                  <button type="button" data-testid="chapter-mode-max" [class.active]="filters.chapterMode() === 'max'" (click)="setChapterMode('max')">Max</button>
                  <button type="button" data-testid="chapter-mode-min" [class.active]="filters.chapterMode() === 'min'" (click)="setChapterMode('min')">Min</button>
                </div>
              }
            </div>
          </div>

          <p>Shelves: {{ shelfCount() }}</p>
          <app-book-grid
            [books]="pagedBooks()"
            [customShelves]="customShelves()"
            [activeGenres]="filters.genres()"
            (opened)="onOpenDetails($event)"
            (genreToggled)="onGenreToggled($event)"
            (shelfToggled)="onShelfToggled($event)"
          />

          <div class="pagination">
            <button type="button" [disabled]="filters.page() <= 1" (click)="setPage(filters.page() - 1)">Previous</button>
            <span>Page {{ filters.page() }} of {{ totalPages() }}</span>
            <button type="button" [disabled]="filters.page() >= totalPages()" (click)="setPage(filters.page() + 1)">Next</button>
          </div>
        }
      </div>
    </section>
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
  readonly genreInput = signal('');
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

  onLanguageInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    void this.filters.updateFilter('language', target.value);
  }

  onGenreInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.genreInput.set(target.value);
  }

  onGenreEnter(event: Event): void {
    event.preventDefault();
    this.addGenreFromInput();
  }

  addGenreFromInput(): void {
    const genre = this.genreInput().trim();
    if (!genre) {
      return;
    }

    const current = this.filters.genres();
    if (!current.includes(genre)) {
      void this.filters.updateFilter('genres', [...current, genre]);
    }

    this.genreInput.set('');
  }

  removeGenreTag(genre: string): void {
    void this.filters.updateFilter('genres', this.filters.genres().filter((g) => g !== genre));
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
    const isActive = current.includes(genre);
    const next = isActive
      ? current.filter((item) => item !== genre)
      : [...current, genre];
    void this.filters.updateFilter('genres', next);
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
}
