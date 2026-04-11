import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookGridComponent } from '../../shared/components/book-grid/book-grid.component';

@Component({
  selector: 'app-bookshelf-page',
  standalone: true,
  imports: [BookGridComponent],
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
        <p>Shelves: {{ shelfCount() }}</p>
        <app-book-grid [books]="books()" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookshelfPageComponent {
  private readonly bookService = inject(BookService);
  private readonly shelfService = inject(ShelfService);

  readonly books = this.bookService.books;
  readonly shelfCount = this.shelfService.shelfCount;
  readonly isLoading = computed(() => this.bookService.isLoading() || this.shelfService.isLoading());
  readonly errorMessage = computed(() => this.bookService.errorMessage() ?? this.shelfService.errorMessage());

  constructor() {
    void this.bookService.loadBooks();
    void this.shelfService.loadShelves();
  }
}
