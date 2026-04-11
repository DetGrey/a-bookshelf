import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  template: `
    <article class="book-card">
      <h3>{{ book().title }}</h3>
      <p>Status: {{ book().status }}</p>
      <p>Score: {{ book().score ?? 'N/A' }}</p>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
}