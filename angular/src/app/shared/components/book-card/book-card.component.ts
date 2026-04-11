import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  template: `
    <article class="book-card" [id]="'book-anchor-' + book().id">
      <h3>{{ book().title }}</h3>
      <p>Status: {{ book().status }}</p>
      <p>Score: {{ book().score ?? 'N/A' }}</p>
      <a
        data-testid="book-detail-link"
        [attr.href]="'/book/' + book().id"
        (click)="opened.emit(book().id)"
      >
        Open details
      </a>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
  readonly opened = output<string>();
}