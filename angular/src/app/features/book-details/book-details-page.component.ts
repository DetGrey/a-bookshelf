import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Result } from '../../models/result.model';
import { BookDetailResolved } from './book-details.resolver';

@Component({
  selector: 'app-book-details-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      @if (!detail()) {
        <h1>Book Details</h1>
        <p>{{ resolverError() }}</p>
      } @else {
        <h1>{{ detail()!.book.title }}</h1>

        <p>{{ description() }}</p>

        <div>
          <p>Status: {{ detail()!.book.status }}</p>
          <p>Score: {{ scoreLabel() }}</p>
          <p>Language: {{ languageLabel() }}</p>
          <p>Chapter count: {{ chapterCountLabel() }}</p>
        </div>

        <section>
          <h2>Genres</h2>
          @if (detail()!.book.genres.length === 0) {
            <p>No genres</p>
          } @else {
            @for (genre of detail()!.book.genres; track genre) {
              <a [routerLink]="['/bookshelf']" [queryParams]="{ genres: genre }">{{ genre }}</a>
            }
          }
        </section>

        <section>
          <h2>Sources</h2>
          @if (detail()!.sources.length === 0) {
            <p>No sources</p>
          } @else {
            <ul>
              @for (source of detail()!.sources; track source.url) {
                <li><a [attr.href]="source.url">{{ source.url }}</a></li>
              }
            </ul>
          }
        </section>

        <section>
          <h2>Shelves</h2>
          @if (detail()!.shelves.length === 0) {
            <p>No shelves</p>
          } @else {
            <ul>
              @for (shelf of detail()!.shelves; track shelf.id) {
                <li>{{ shelf.name }}</li>
              }
            </ul>
          }
        </section>

        <section>
          <h2>Related books</h2>
          @if (detail()!.relatedBooks.length === 0) {
            <p>No related books</p>
          } @else {
            <ul>
              @for (related of detail()!.relatedBooks; track related.bookId) {
                <li>{{ related.bookId }}</li>
              }
            </ul>
          }
        </section>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly resolved = computed(() => this.route.snapshot.data['book'] as Result<BookDetailResolved>);
  readonly detail = computed(() => {
    const resolved = this.resolved();
    if (resolved.success) {
      return resolved.data;
    }
    return null;
  });
  readonly resolverError = computed(() => {
    const resolved = this.resolved();
    if (resolved.success) {
      return null;
    }
    return resolved.error.message;
  });
  readonly description = computed(() => {
    if (!this.detail()) {
      return '';
    }
    return this.detail()!.book.description || 'No description available';
  });
  readonly scoreLabel = computed(() => {
    if (!this.detail()) {
      return 'Unscored';
    }
    return this.detail()!.book.score === null ? 'Unscored' : String(this.detail()!.book.score);
  });
  readonly languageLabel = computed(() => {
    if (!this.detail()) {
      return 'Unknown';
    }
    return this.detail()!.book.language ?? 'Unknown';
  });
  readonly chapterCountLabel = computed(() => {
    if (!this.detail()) {
      return 'Unknown';
    }
    const count = this.detail()!.book.chapterCount;
    return count === null ? 'Unknown' : String(count);
  });
}
