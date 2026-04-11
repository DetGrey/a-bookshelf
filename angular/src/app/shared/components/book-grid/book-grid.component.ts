import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Book } from '../../../models/book.model';
import { BookCardComponent } from '../book-card/book-card.component';

@Component({
  selector: 'app-book-grid',
  standalone: true,
  imports: [BookCardComponent],
  template: `
    <section class="book-grid">
      @for (book of books(); track book.id) {
        <app-book-card [book]="book" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookGridComponent {
  readonly books = input<readonly Book[]>([]);
}