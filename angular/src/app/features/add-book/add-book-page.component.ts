import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookSearchLinkerComponent } from '../../shared/components/book-search-linker/book-search-linker.component';
import { BookFormFieldsComponent } from '../../shared/components/book-form-fields/book-form-fields.component';
import { CoverImageComponent } from '../../shared/components/cover-image/cover-image.component';
import { MetadataFetcherComponent } from '../../shared/components/metadata-fetcher/metadata-fetcher.component';
import { ShelfSelectorComponent } from '../../shared/components/shelf-selector/shelf-selector.component';
import { SourceManagerComponent } from '../../shared/components/source-manager/source-manager.component';
import { BookFormModel, BookSourceDraft } from '../../models/book.model';

type SourceFormGroup = FormGroup<{
  siteName: FormControl<string>;
  url: FormControl<string>;
}>;

type AddBookFormGroup = FormGroup<{
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
  selector: 'app-add-book-page',
  standalone: true,
  styleUrl: './add-book-page.component.scss',
  imports: [
    ReactiveFormsModule,
    BookFormFieldsComponent,
    SourceManagerComponent,
    ShelfSelectorComponent,
    BookSearchLinkerComponent,
    CoverImageComponent,
    MetadataFetcherComponent,
  ],
  template: `
    <section class="page narrow add-book-page">
      <div class="page-head">
        <div>
          <p class="eyebrow">Smart Add</p>
          <h1>Paste a link, capture the details</h1>
          <p class="muted">Connects to the Supabase Edge Function fetch-metadata to pull Open Graph data from supported sites.</p>
        </div>
      </div>

      <section class="card add-book-fetch">
        <app-metadata-fetcher [form]="bookForm" />
      </section>

      <form class="card stack add-book-form" [formGroup]="bookForm" (ngSubmit)="onSubmit()">
        <p class="eyebrow">Book Details</p>

        <app-book-form-fields [form]="bookForm" />

        <app-source-manager [sources]="bookForm.controls.sources" />
        <app-book-search-linker [control]="bookForm.controls.relatedBookIds" />
        <app-shelf-selector [control]="bookForm.controls.shelves" [availableShelves]="shelfService.shelves()" />

        @if (localError()) {
          <p class="error">{{ localError() }}</p>
        }

        <div class="save-row">
          <button class="ghost" data-testid="save-book-button" type="submit" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Saving…' : 'Save to Library' }}
          </button>
        </div>
      </form>

      @if (showPreview()) {
        <section class="card metadata-preview-card">
          <app-cover-image class="preview-thumb" [src]="bookForm.controls.coverUrl.value" [alt]="bookForm.controls.title.value || 'Book cover preview'" />
          <div class="stack">
            <p class="eyebrow">Preview</p>
            <h2>{{ bookForm.controls.title.value || 'Untitled' }}</h2>
            <p class="muted">{{ bookForm.controls.description.value || 'No description yet.' }}</p>

            <div class="pill-row">
              <span class="pill">{{ statusLabel() }}</span>
              @if (bookForm.controls.lastRead.value) {
                <span class="pill ghost">Last: {{ bookForm.controls.lastRead.value }}</span>
              }
            </div>

            @if (previewGenres().length > 0) {
              <div class="pill-row mt-8">
                @for (genre of previewGenres(); track genre) {
                  <span class="pill ghost">{{ genre }}</span>
                }
              </div>
            }

            <p class="muted">Ready to save to your library.</p>
          </div>
        </section>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBookPageComponent {
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);
  readonly shelfService = inject(ShelfService);

  constructor() {
    void this.shelfService.loadShelves();
  }

  readonly isSubmitting = signal(false);
  readonly localError = signal<string | null>(null);

  readonly statusLabels: Record<'reading' | 'plan_to_read' | 'waiting' | 'completed' | 'dropped' | 'on_hold', string> = {
    reading: 'Reading',
    plan_to_read: 'Plan to read',
    waiting: 'Waiting',
    completed: 'Completed',
    dropped: 'Dropped',
    on_hold: 'On hold',
  };

  readonly bookForm: AddBookFormGroup = new FormGroup({
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

  async onSubmit(): Promise<void> {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      this.localError.set('Please fix validation errors before saving.');
      return;
    }

    this.localError.set(null);
    this.isSubmitting.set(true);

    const result = await this.bookService.createBook(this.toFormModel());

    this.isSubmitting.set(false);

    if (!result.success) {
      this.localError.set(result.error.message);
      return;
    }

    await this.router.navigate(['/bookshelf']);
  }

  showPreview(): boolean {
    return Boolean(
      this.bookForm.controls.title.value.trim() ||
      this.bookForm.controls.coverUrl.value.trim() ||
      this.bookForm.controls.description.value.trim() ||
      this.previewGenres().length > 0,
    );
  }

  previewGenres(): string[] {
    return this.bookForm.controls.genres.value
      .split(',')
      .map((genre) => genre.trim())
      .filter((genre) => genre.length > 0);
  }

  statusLabel(): string {
    const status = this.bookForm.controls.status.value ?? 'plan_to_read';
    return this.statusLabels[status] ?? status;
  }

  private toFormModel(): BookFormModel {
    const sources: BookSourceDraft[] = this.bookForm.controls.sources.controls.map((group) => ({
      siteName: group.controls.siteName.value,
      url: group.controls.url.value,
    }));

    return {
      title: this.bookForm.controls.title.value,
      description: this.bookForm.controls.description.value,
      score: this.bookForm.controls.score.value,
      status: this.bookForm.controls.status.value,
      genres: this.bookForm.controls.genres.value,
      language: this.bookForm.controls.language.value,
      chapterCount: this.bookForm.controls.chapterCount.value,
      coverUrl: this.bookForm.controls.coverUrl.value,
      notes: this.bookForm.controls.notes.value,
      timesRead: this.bookForm.controls.timesRead.value,
      lastRead: this.bookForm.controls.lastRead.value,
      latestChapter: this.bookForm.controls.latestChapter.value,
      lastUploadedAt: this.bookForm.controls.lastUploadedAt.value,
      originalLanguage: this.bookForm.controls.originalLanguage.value,
      sources,
      shelves: this.bookForm.controls.shelves.value,
      relatedBookIds: this.bookForm.controls.relatedBookIds.value,
    };
  }
}
