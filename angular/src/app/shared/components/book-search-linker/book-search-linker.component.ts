// Smart exception: injects BookService to search books by title and resolve IDs to names.
// Output is still via @Input() FormControl — the parent form owns the value.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BookService } from '../../../core/book/book.service';

@Component({
  selector: 'app-book-search-linker',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Related books</legend>

      <input
        data-testid="related-book-input"
        [value]="searchQuery()"
        (input)="onSearchInput($event)"
        placeholder="Search by title"
      />

      @if (suggestions().length > 0) {
        <ul data-testid="related-book-suggestions">
          @for (book of suggestions(); track book.id) {
            <li>
              <button type="button" (click)="selectBook(book.id)">{{ book.title }}</button>
            </li>
          }
        </ul>
      }

      <ul>
        @for (relatedId of control().value; track relatedId) {
          <li>
            {{ titleForId(relatedId) }}
            <button type="button" [attr.data-testid]="'remove-related-' + relatedId" (click)="removeRelated(relatedId)">×</button>
          </li>
        }
      </ul>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSearchLinkerComponent {
  private readonly bookService = inject(BookService);

  readonly control = input.required<FormControl<string[]>>();
  readonly searchQuery = signal('');

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
