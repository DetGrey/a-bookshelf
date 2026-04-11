import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookSearchLinkerComponent } from '../../shared/components/book-search-linker/book-search-linker.component';
import { BookFormFieldsComponent } from '../../shared/components/book-form-fields/book-form-fields.component';
import { ShelfSelectorComponent } from '../../shared/components/shelf-selector/shelf-selector.component';
import { SourceManagerComponent } from '../../shared/components/source-manager/source-manager.component';
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
  shelves: FormControl<string[]>;
  relatedBookIds: FormControl<string[]>;
  sources: FormArray<SourceFormGroup>;
}>;

@Component({
  selector: 'app-book-details-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    BookFormFieldsComponent,
    SourceManagerComponent,
    ShelfSelectorComponent,
    BookSearchLinkerComponent,
  ],
  template: `
    <section>
      @if (!detail()) {
        <h1>Book Details</h1>
        <p>{{ resolverError() }}</p>
      } @else {
        @if (isEditMode()) {
          <h1>Edit Book</h1>

          <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
            <app-book-form-fields [form]="editForm" />
            <app-source-manager [sources]="editForm.controls.sources" />
            <app-shelf-selector [control]="editForm.controls.shelves" [availableShelves]="shelfService.shelves()" />
            <app-book-search-linker [control]="editForm.controls.relatedBookIds" />

            @if (mutationError()) {
              <p>{{ mutationError() }}</p>
            }

            <button data-testid="save-edit" type="submit">Save</button>
            <button type="button" (click)="cancelEdit()">Cancel</button>
          </form>
        } @else {
          <h1>{{ detail()!.book.title }}</h1>

          <button data-testid="enter-edit-mode" type="button" (click)="enterEditMode()">Edit</button>
          <button data-testid="delete-book" type="button" (click)="deleteCurrentBook()">Delete</button>

          @if (detail()!.sources.length > 0) {
            <button
              data-testid="fetch-latest-chapter"
              type="button"
              [disabled]="fetchingLatest()"
              (click)="fetchLatestChapter()"
            >
              Fetch latest chapter
            </button>
          }
          @if (fetchLatestResult()) {
            <p data-testid="fetch-latest-result">{{ fetchLatestResult() }}</p>
          }

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

        @if (mutationError() && !isEditMode()) {
          <p>{{ mutationError() }}</p>
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
      sources,
      shelves: this.editForm.controls.shelves.value,
      relatedBookIds: this.editForm.controls.relatedBookIds.value,
    };
  }
}
