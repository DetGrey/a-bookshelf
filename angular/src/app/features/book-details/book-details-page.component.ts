import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookSearchLinkerComponent } from '../../shared/components/book-search-linker/book-search-linker.component';
import { BookFormFieldsComponent } from '../../shared/components/book-form-fields/book-form-fields.component';
import { ShelfSelectorComponent } from '../../shared/components/shelf-selector/shelf-selector.component';
import { SourceManagerComponent } from '../../shared/components/source-manager/source-manager.component';
import { MetadataFetcherComponent } from '../../shared/components/metadata-fetcher/metadata-fetcher.component';
import { CoverImageComponent } from '../../shared/components/cover-image/cover-image.component';
import { Result } from '../../models/result.model';
import { BookFormModel, BookSourceDraft } from '../../models/book.model';
import { BookDetailResolved } from './book-details.resolver';

type SourceFormGroup = FormGroup<{
  siteName: FormControl<string>;
  url: FormControl<string>;
}>;

type EditBookFormGroup = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  score: FormControl<number | null>;
  status: FormControl<'reading' | 'plan_to_read' | 'waiting' | 'completed' | 'dropped' | 'on_hold' | null>;
  genres: FormControl<string>;
  language: FormControl<string>;
  chapterCount: FormControl<number | null>;
  coverUrl: FormControl<string>;
  notes: FormControl<string>;
  timesRead: FormControl<number>;
  lastRead: FormControl<string>;
  latestChapter: FormControl<string>;
  lastUploadedAt: FormControl<string>;
  originalLanguage: FormControl<string>;
  shelves: FormControl<string[]>;
  relatedBookIds: FormControl<string[]>;
  sources: FormArray<SourceFormGroup>;
}>;

@Component({
  selector: 'app-book-details-page',
  standalone: true,
  styleUrl: './book-details-page.component.scss',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    BookFormFieldsComponent,
    SourceManagerComponent,
    ShelfSelectorComponent,
    BookSearchLinkerComponent,
    MetadataFetcherComponent,
    CoverImageComponent,
  ],
  template: `
    <section class="page book-details-page">
      @if (!detail()) {
        <div class="centered">
          <h1>Book Details</h1>
          <p class="error">{{ resolverError() }}</p>
        </div>
      } @else {
        <div class="page-head">
          <a [routerLink]="['/bookshelf']" class="ghost">← Back to Library</a>
          @if (!isEditMode()) {
            <div class="read-actions">
              <button class="ghost" data-testid="enter-edit-mode" type="button" (click)="enterEditMode()">Edit</button>
              <button class="ghost delete-action-button" data-testid="delete-book" type="button" (click)="deleteCurrentBook()">Delete</button>
            </div>
          }
        </div>

        @if (isEditMode()) {
          <div class="stack">
            <h1>Edit Book</h1>

            <form class="stack" [formGroup]="editForm" (ngSubmit)="saveEdit()">
              <app-metadata-fetcher [form]="editForm" [compact]="true" />
              <app-book-form-fields [form]="editForm" />
              <app-shelf-selector [control]="editForm.controls.shelves" [availableShelves]="shelfService.shelves()" />
              <app-source-manager [sources]="editForm.controls.sources" />
              <app-book-search-linker [control]="editForm.controls.relatedBookIds" />

              @if (mutationError()) {
                <p class="error">{{ mutationError() }}</p>
              }

              <div class="edit-actions mt-12">
                <button class="primary" data-testid="save-edit" type="submit">Save Changes</button>
                <button class="ghost" type="button" (click)="cancelEdit()">Cancel</button>
              </div>
            </form>
          </div>
        } @else {
          <div class="stack">
            <div class="book-hero">
              <app-cover-image class="cover" [src]="detail()!.book.coverUrl" [alt]="detail()!.book.title" />

              <div class="stack">
                <div>
                  <p class="eyebrow">{{ statusLabel(detail()!.book.status) }}</p>
                  <h1>{{ detail()!.book.title }}</h1>
                  <p class="muted">{{ description() }}</p>
                </div>

                <div class="pill-row">
                  @if (detail()!.book.lastRead && detail()!.book.status !== 'completed') {
                    <span data-testid="last-read" class="pill">Last read: {{ detail()!.book.lastRead }}</span>
                  }
                  @if (detail()!.book.latestChapter) {
                    <span data-testid="latest-chapter" class="pill ghost">Latest: {{ detail()!.book.latestChapter }}</span>
                  }
                </div>

                <div class="pill-row detail-meta-pills">
                  <span class="pill ghost">Status: {{ detail()!.book.status }}</span>
                  <span class="pill ghost">Score: {{ detail()!.book.score === null ? 'Unscored' : detail()!.book.score }}</span>
                  <span class="pill ghost">Language: {{ languageLabel() }}</span>
                  <span class="pill ghost">Chapter count: {{ chapterCountLabel() }}</span>
                  @if (detail()!.book.latestChapter) {
                    <span class="pill ghost" data-testid="latest-chapter">Latest chapter: {{ detail()!.book.latestChapter }}</span>
                  }
                  @if (detail()!.book.lastUploadedAt) {
                    <span class="pill ghost" data-testid="last-uploaded-at">Last uploaded: {{ detail()!.book.lastUploadedAt | date:'mediumDate' }}</span>
                  }
                  @if (detail()!.book.originalLanguage) {
                    <span class="pill ghost" data-testid="original-language">Original language: {{ detail()!.book.originalLanguage }}</span>
                  }
                </div>

                @if (detail()!.book.timesRead > 1) {
                  <p data-testid="times-read" class="muted">Read {{ detail()!.book.timesRead }} times</p>
                }

                <div class="related-section-wrapper">
                  @if (detail()!.sources.length > 0) {
                    <button
                      class="primary related-link-preview"
                      data-testid="fetch-latest-chapter"
                      type="button"
                      [disabled]="fetchingLatest()"
                      (click)="fetchLatestChapter()"
                    >
                      {{ fetchingLatest() ? 'Fetching…' : 'Fetch Latest Chapter' }}
                    </button>
                  }

                  @if (fetchLatestResult()) {
                    <p data-testid="fetch-latest-result" class="related-link-title">{{ fetchLatestResult() }}</p>
                  }
                </div>

                @if (detail()!.book.genres.length > 0) {
                  <div class="pill-row genres-section">
                    @for (genre of detail()!.book.genres; track genre) {
                      <button
                        type="button"
                        class="pill ghost genre-remove-button"
                        (click)="goToGenre(genre)"
                      >
                        {{ genre }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>

            @if (detail()!.book.notes) {
              <section class="card">
                <p class="eyebrow">Personal Notes</p>
                <p data-testid="notes" class="notes-section">{{ detail()!.book.notes }}</p>
              </section>
            }

            <section class="card">
              <p class="eyebrow">Source Links</p>
              @if (detail()!.sources.length === 0) {
                <p>No sources</p>
              } @else {
                <div class="source-grid">
                  @for (source of detail()!.sources; track source.url) {
                    <a class="source-card" [attr.href]="source.url" target="_blank" rel="noreferrer">
                      <strong>{{ source.siteName }}</strong>
                      <p class="muted text-small word-break-all">{{ source.url }}</p>
                    </a>
                  }
                </div>
              }
            </section>

            <section class="card">
              <p class="eyebrow">Shelves</p>
              @if (detail()!.shelves.length === 0) {
                <p>No shelves</p>
              } @else {
                <div class="pill-row">
                  @for (shelf of detail()!.shelves; track shelf.id) {
                    <a class="pill ghost" [routerLink]="['/bookshelf']" [queryParams]="{ shelf: shelf.id }">{{ shelf.name }}</a>
                  }
                </div>
              }
            </section>

            <section class="card">
              <p class="eyebrow">Related Books</p>
              @if (detail()!.relatedBooks.length === 0) {
                <p>No related books</p>
              } @else {
                <div class="related-books-grid">
                  @for (related of detail()!.relatedBooks; track related.bookId) {
                    <a class="related-book-link" [routerLink]="['/book', related.bookId]">
                      <app-cover-image class="related-book-cover" [src]="relatedCoverUrl(related.bookId)" [alt]="relatedTitle(related.bookId)" />
                      <div class="related-book-info">
                        <strong>{{ relatedTitle(related.bookId) }}</strong>
                        <small>{{ related.relation }}</small>
                      </div>
                    </a>
                  }
                </div>
              }
            </section>
          </div>
        }

        @if (mutationError() && !isEditMode()) {
          <p class="error">{{ mutationError() }}</p>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly shelfService = inject(ShelfService);

  readonly resolved = computed(() => this.route.snapshot.data['book'] as Result<BookDetailResolved>);
  readonly detailState = signal<BookDetailResolved | null>(null);
  readonly isEditMode = signal(false);
  readonly mutationError = signal<string | null>(null);
  readonly fetchingLatest = signal(false);
  readonly fetchLatestResult = signal<string | null>(null);

  readonly editForm: EditBookFormGroup = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    score: new FormControl<number | null>(null),
    status: new FormControl<'reading' | 'plan_to_read' | 'waiting' | 'completed' | 'dropped' | 'on_hold' | null>('plan_to_read'),
    genres: new FormControl('', { nonNullable: true }),
    language: new FormControl('', { nonNullable: true }),
    chapterCount: new FormControl<number | null>(null),
    coverUrl: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    timesRead: new FormControl<number>(1, { nonNullable: true }),
    lastRead: new FormControl('', { nonNullable: true }),
    latestChapter: new FormControl('', { nonNullable: true }),
    lastUploadedAt: new FormControl('', { nonNullable: true }),
    originalLanguage: new FormControl('', { nonNullable: true }),
    shelves: new FormControl<string[]>([], { nonNullable: true }),
    relatedBookIds: new FormControl<string[]>([], { nonNullable: true }),
    sources: new FormArray<SourceFormGroup>([]),
  });

  readonly detail = computed(() => this.detailState());
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
    const score = this.detail()!.book.score;
    if (score === null) {
      return 'Unscored';
    }

    if (score === 0) {
      return '0 — N/A';
    }

    const labels: Record<number, string> = {
      10: '10 — Masterpiece',
      9: '9 — Great',
      8: '8 — Pretty Good',
      7: '7 — Good',
      6: '6 — Fine',
      5: '5 — Average',
      4: '4 — Bad',
      3: '3 — Pretty Bad',
      2: '2 — Horrible',
      1: '1 — Appalling',
    };

    return labels[score] ?? String(score);
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

  constructor() {
    const resolved = this.resolved();
    if (resolved.success) {
      this.detailState.set(resolved.data);
    }

    void this.shelfService.loadShelves();
  }

  enterEditMode(): void {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    this.mutationError.set(null);
    this.isEditMode.set(true);

    this.editForm.patchValue({
      title: detail.book.title,
      description: detail.book.description,
      score: detail.book.score,
      status: detail.book.status,
      genres: detail.book.genres.join(', '),
      language: detail.book.language ?? '',
      chapterCount: detail.book.chapterCount,
      coverUrl: detail.book.coverUrl ?? '',
      notes: detail.book.notes ?? '',
      timesRead: detail.book.timesRead,
      lastRead: detail.book.lastRead ?? '',
      latestChapter: detail.book.latestChapter ?? '',
      lastUploadedAt: detail.book.lastUploadedAt ? detail.book.lastUploadedAt.toISOString().slice(0, 19) : '',
      originalLanguage: detail.book.originalLanguage ?? '',
      shelves: detail.shelves.map((shelf) => shelf.id),
      relatedBookIds: detail.relatedBooks.map((related) => related.bookId),
    });

    this.editForm.controls.sources.clear();
    for (const source of detail.sources) {
      this.editForm.controls.sources.push(new FormGroup({
        siteName: new FormControl(source.siteName, { nonNullable: true }),
        url: new FormControl(source.url, { nonNullable: true }),
      }));
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.mutationError.set(null);
  }

  async saveEdit(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const form = this.toFormModel();

    const result = await this.bookService.updateBook(detail.book.id, form, {
      sources: detail.sources.map((source) => ({ siteName: source.siteName, url: source.url })),
      relatedBookIds: detail.relatedBooks.map((related) => related.bookId),
      shelfIds: detail.shelves.map((shelf) => shelf.id),
    });

    if (!result.success) {
      this.mutationError.set(`Could not save book. ${result.error.message}`);
      return;
    }

    this.detailState.set({
      ...detail,
      book: result.data,
      sources: form.sources,
      relatedBooks: form.relatedBookIds.map((bookId) => ({ bookId, relation: 'related' })),
      shelves: form.shelves.map((shelfId) => ({
        id: shelfId,
        name: detail.shelves.find((shelf) => shelf.id === shelfId)?.name ?? shelfId,
      })),
    });

    this.mutationError.set(null);
    this.isEditMode.set(false);
  }

  async fetchLatestChapter(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    this.fetchingLatest.set(true);
    this.fetchLatestResult.set(null);

    const result = await this.bookService.fetchLatestChapterForBook(detail.book.id);
    this.fetchingLatest.set(false);

    if (!result.success) {
      this.fetchLatestResult.set(`Failed: ${result.error.message}`);
      return;
    }

    this.fetchLatestResult.set(
      result.data.status === 'updated'
        ? 'Updated latest chapter info.'
        : `Skipped: ${result.data.detail}`,
    );

    if (result.data.status === 'updated') {
      const updated = this.bookService.books().find((b) => b.id === detail.book.id);
      if (updated) {
        this.detailState.set({ ...detail, book: updated });
      }
    }
  }

  async deleteCurrentBook(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const confirmed = this.document.defaultView?.confirm('Delete this book?') ?? false;
    if (!confirmed) {
      return;
    }

    const result = await this.bookService.deleteBook(detail.book.id);
    if (!result.success) {
      this.mutationError.set(`Could not delete book. ${result.error.message}`);
      return;
    }

    await this.router.navigate(['/bookshelf']);
  }

  relatedTitle(bookId: string): string {
    return this.bookService.books().find((book) => book.id === bookId)?.title ?? bookId;
  }

  relatedCoverUrl(bookId: string): string | null {
    return this.bookService.books().find((book) => book.id === bookId)?.coverUrl ?? null;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      reading: 'Reading',
      plan_to_read: 'Plan to Read',
      waiting: 'Waiting',
      completed: 'Completed',
      dropped: 'Dropped',
      on_hold: 'On Hold',
    };

    return labels[status] ?? status;
  }

  goToGenre(genre: string): void {
    void this.router.navigate(['/bookshelf'], { queryParams: { genre } });
  }

  private toFormModel(): BookFormModel {
    const sources: BookSourceDraft[] = this.editForm.controls.sources.controls.map((group) => ({
      siteName: group.controls.siteName.value,
      url: group.controls.url.value,
    }));

    return {
      title: this.editForm.controls.title.value,
      description: this.editForm.controls.description.value,
      score: this.editForm.controls.score.value,
      status: this.editForm.controls.status.value,
      genres: this.editForm.controls.genres.value,
      language: this.editForm.controls.language.value,
      chapterCount: this.editForm.controls.chapterCount.value,
      coverUrl: this.editForm.controls.coverUrl.value,
      notes: this.editForm.controls.notes.value,
      timesRead: this.editForm.controls.timesRead.value,
      lastRead: this.editForm.controls.lastRead.value,
      latestChapter: this.editForm.controls.latestChapter.value,
      lastUploadedAt: this.editForm.controls.lastUploadedAt.value,
      originalLanguage: this.editForm.controls.originalLanguage.value,
      sources,
      shelves: this.editForm.controls.shelves.value,
      relatedBookIds: this.editForm.controls.relatedBookIds.value,
    };
  }
}
