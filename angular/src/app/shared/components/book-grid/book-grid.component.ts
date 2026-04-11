import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Book } from '../../../models/book.model';
import { BookCardComponent } from '../book-card/book-card.component';
import { Shelf } from '../../../models/shelf.model';

@Component({
  selector: 'app-book-grid',
  standalone: true,
  imports: [BookCardComponent],
  template: `
    <section class="book-grid">
      @for (book of books(); track book.id) {
        <app-book-card
          [book]="book"
          [customShelves]="customShelves()"
          [activeGenres]="activeGenres()"
          [compact]="compact()"
          (opened)="opened.emit($event)"
          (genreToggled)="genreToggled.emit($event)"
          (shelfToggled)="shelfToggled.emit($event)"
        />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookGridComponent {
  readonly books = input<readonly Book[]>([]);
  readonly customShelves = input<readonly Shelf[]>([]);
  readonly activeGenres = input<string[]>([]);
  readonly compact = input(false);
  readonly opened = output<string>();
  readonly genreToggled = output<string>();
  readonly shelfToggled = output<{ bookId: string; shelfId: string }>();
}