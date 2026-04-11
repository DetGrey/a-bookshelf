import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookService } from '../../core/book/book.service';
import { BookSearchLinkerComponent } from '../../shared/components/book-search-linker/book-search-linker.component';
import { BookFormFieldsComponent } from '../../shared/components/book-form-fields/book-form-fields.component';
import { CoverImageComponent } from '../../shared/components/cover-image/cover-image.component';
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
  shelves: FormControl<string[]>;
  relatedBookIds: FormControl<string[]>;
  sources: FormArray<SourceFormGroup>;
}>;

@Component({
  selector: 'app-add-book-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BookFormFieldsComponent,
    SourceManagerComponent,
    ShelfSelectorComponent,
    BookSearchLinkerComponent,
    CoverImageComponent,
  ],
  template: `
    <section>
      <h1>Add Book</h1>

      <form [formGroup]="bookForm" (ngSubmit)="onSubmit()">
        <app-book-form-fields [form]="bookForm" />

        <app-source-manager [sources]="bookForm.controls.sources" />
        <app-shelf-selector [control]="bookForm.controls.shelves" />
        <app-book-search-linker [control]="bookForm.controls.relatedBookIds" />

        <app-cover-image [src]="bookForm.controls.coverUrl.value" [alt]="bookForm.controls.title.value || 'Book cover preview'" />

        @if (localError()) {
          <p>{{ localError() }}</p>
        }

        <button data-testid="save-book-button" type="submit" [disabled]="isSubmitting()">Save book</button>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBookPageComponent {
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly localError = signal<string | null>(null);

  readonly bookForm: AddBookFormGroup = new FormGroup({
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
      sources,
      shelves: this.bookForm.controls.shelves.value,
      relatedBookIds: this.bookForm.controls.relatedBookIds.value,
    };
  }
}
