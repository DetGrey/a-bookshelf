// Smart exception: injects BookService to search books by title and resolve IDs to names.
// Output is still via @Input() FormControl — the parent form owns the value.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BookService } from '../../../core/book/book.service';

@Component({
  selector: 'app-book-search-linker',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrl: './book-search-linker.component.scss',
  template: `
    <section class="card book-search-linker">
      <button
        type="button"
        class="ghost collapsible-header"
        [class.expanded]="!isCollapsed()"
        (click)="isCollapsed.set(!isCollapsed())"
      >
        <p class="eyebrow">Related Books</p>
        <span class="collapsible-arrow">{{ isCollapsed() ? '▶' : '▼' }}</span>
      </button>

      @if (!isCollapsed()) {
        <p class="muted text-small mt-8">Link language versions or related books</p>

        @if (control().value.length > 0) {
          <div class="linked-books">
            @for (relatedId of control().value; track relatedId) {
              <div class="linked-book-item">
                <div class="linked-book-info">
                  <strong>{{ titleForId(relatedId) }}</strong>
                  <button
                    type="button"
                    class="btn-icon"
                    [attr.data-testid]="'remove-related-' + relatedId"
                    (click)="removeRelated(relatedId)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <div class="book-search-container">
          <div class="book-search-fields">
            <label class="field">
              <span>Search</span>
              <input
                data-testid="related-book-input"
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                placeholder="Find a book..."
              />
            </label>
          </div>

          @if (suggestions().length > 0) {
            <ul data-testid="related-book-suggestions" class="search-results-dropdown">
              @for (book of suggestions(); track book.id) {
                <li>
                  <button type="button" class="search-result-item" (click)="selectBook(book.id)">
                    <span class="search-result-title">{{ book.title }}</span>
                    @if (book.language) {
                      <span class="search-result-subtitle">{{ book.language }}</span>
                    }
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSearchLinkerComponent {
  private readonly bookService = inject(BookService);

  readonly control = input.required<FormControl<string[]>>();
  readonly searchQuery = signal('');
  readonly isCollapsed = signal(false);

  readonly suggestions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return [];
    }

    const selectedIds = new Set(this.control().value);
    return this.bookService.books()
      .filter((book) => !selectedIds.has(book.id) && book.title.toLowerCase().includes(query))
      .slice(0, 6);
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  titleForId(bookId: string): string {
    return this.bookService.books().find((b) => b.id === bookId)?.title ?? bookId;
  }

  selectBook(bookId: string): void {
    const current = this.control().value;
    if (!current.includes(bookId)) {
      this.control().setValue([...current, bookId]);
    }

    this.searchQuery.set('');
  }

  removeRelated(relatedId: string): void {
    this.control().setValue(this.control().value.filter((id) => id !== relatedId));
  }
}
