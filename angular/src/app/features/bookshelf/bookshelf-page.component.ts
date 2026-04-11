import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookGridComponent } from '../../shared/components/book-grid/book-grid.component';
import { BookshelfFilterService } from './bookshelf-filter.service';
import { FormsModule } from '@angular/forms';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-bookshelf-page',
  standalone: true,
  imports: [BookGridComponent, FormsModule],
  template: `
    <section>
      <h1>Bookshelf</h1>

      @if (isLoading()) {
        <p>Loading library...</p>
      } @else if (errorMessage()) {
        <p>{{ errorMessage() }}</p>
      } @else if (books().length === 0) {
        <p>No books yet.</p>
      } @else {
        <div class="bookshelf-controls">
          <input
            data-testid="search-input"
            [value]="filters.search()"
            (input)="onSearchInput($event)"
            placeholder="Search books"
          />

          <select [value]="filters.sort()" (change)="onSortChange($event)">
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
        </div>

        <p>Shelves: {{ shelfCount() }}</p>
        <app-book-grid [books]="pagedBooks()" (opened)="onOpenDetails($event)" />

        <div class="pagination">
          <button type="button" [disabled]="filters.page() <= 1" (click)="setPage(filters.page() - 1)">Previous</button>
          <span>Page {{ filters.page() }} of {{ totalPages() }}</span>
          <button type="button" [disabled]="filters.page() >= totalPages()" (click)="setPage(filters.page() + 1)">Next</button>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookshelfPageComponent {
  private readonly bookService = inject(BookService);
  private readonly shelfService = inject(ShelfService);
  readonly filters = inject(BookshelfFilterService);

  readonly books = this.bookService.books;
  readonly shelfCount = this.shelfService.shelfCount;
  readonly isLoading = computed(() => this.bookService.isLoading() || this.shelfService.isLoading());
  readonly errorMessage = computed(() => this.bookService.errorMessage() ?? this.shelfService.errorMessage());
  readonly filteredSortedBooks = computed(() => {
    let collection = [...this.books()];

    const search = this.filters.search().trim().toLowerCase();
    const language = this.filters.language().trim().toLowerCase();
    const genres = this.filters.genres().map((genre) => genre.toLowerCase());
    const chapterMin = this.filters.chapterMin();
    const chapterMax = this.filters.chapterMax();

    if (search) {
      collection = collection.filter((book) =>
        book.title.toLowerCase().includes(search)
        || book.description.toLowerCase().includes(search),
      );
    }

    if (language) {
      collection = collection.filter((book) => (book.language ?? '').toLowerCase() === language);
    }

    if (genres.length > 0) {
      collection = collection.filter((book) => {
        const bookGenres = book.genres.map((genre) => genre.toLowerCase());
        return genres.every((genre) => bookGenres.includes(genre));
      });
    }

    if (chapterMin !== null) {
      collection = collection.filter((book) => (book.chapterCount ?? 0) >= chapterMin);
    }

    if (chapterMax !== null) {
      collection = collection.filter((book) => (book.chapterCount ?? Number.MAX_SAFE_INTEGER) <= chapterMax);
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

  setPage(page: number): void {
    const clampedPage = Math.min(Math.max(page, 1), this.totalPages());
    void this.filters.updateFilter('page', clampedPage);
  }

  onOpenDetails(bookId: string): void {
    this.filters.rememberAnchor(bookId);
    this.filters.rememberScroll(window.scrollY);
  }

  private restoreViewMemory(): void {
    const selectedAnchorReader = (this.filters as Partial<BookshelfFilterService>).selectedAnchor;
    const scrollReader = (this.filters as Partial<BookshelfFilterService>).scrollY;

    const anchorId = typeof selectedAnchorReader === 'function' ? selectedAnchorReader() : null;

    if (anchorId) {
      const anchorElement = document.getElementById(`book-anchor-${anchorId}`);
      if (anchorElement) {
        anchorElement.scrollIntoView({ block: 'center' });
        return;
      }
    }

    const savedScroll = typeof scrollReader === 'function' ? scrollReader() : 0;
    if (savedScroll > 0) {
      window.scrollTo({ top: savedScroll, behavior: 'auto' });
    }
  }

  private compareBooks(left: Book, right: Book, sort: ReturnType<typeof this.filters.sort>): number {
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
}
