import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SUPABASE_CLIENT } from '../../../core/supabase.token';
import { buildMetadataPatch, MetadataPayload } from './metadata-fetcher.mapper';

@Component({
  selector: 'app-metadata-fetcher',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Metadata fetcher</legend>

      <input
        data-testid="metadata-url-input"
        [(ngModel)]="sourceUrl"
        name="metadataSourceUrl"
        placeholder="Paste source URL"
      />

      <button
        data-testid="metadata-fetch-button"
        type="button"
        [disabled]="isLoading()"
        (click)="fetchMetadata()"
      >
        Fetch metadata
      </button>

      @if (isLoading()) {
        <p>Fetching metadata...</p>
      }

      @if (errorMessage()) {
        <p>{{ errorMessage() }}</p>
      }

      @if (preview()) {
        <div>
          <p>Ready to apply metadata</p>
          <p>{{ previewTitle() }}</p>

          <button data-testid="metadata-apply-button" type="button" (click)="applyMetadata()">Apply metadata</button>
        </div>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataFetcherComponent {
  private readonly supabase = inject(SUPABASE_CLIENT);

  readonly form = input.required<FormGroup>();

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly preview = signal<MetadataPayload | null>(null);
  readonly previewTitle = computed(() => this.preview()?.title ?? 'Untitled');

  sourceUrl = '';

  async fetchMetadata(): Promise<void> {
    const url = this.sourceUrl.trim();
    if (!url) {
      this.errorMessage.set('Source URL is required.');
      this.preview.set(null);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.preview.set(null);

    const { data, error } = await this.supabase.functions.invoke('fetch-metadata', {
      body: { url },
    });

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message ?? 'Failed to fetch metadata.');
      return;
    }

    const payload = (data ?? null) as MetadataPayload | null;
    if (!payload) {
      this.errorMessage.set('No metadata returned for this URL.');
      return;
    }

    this.preview.set(payload);
  }

  applyMetadata(): void {
    const metadata = this.preview();
    if (!metadata) {
      return;
    }

    const form = this.form();

    const titleControl = form.get('title') as FormControl<string> | null;
    const descriptionControl = form.get('description') as FormControl<string> | null;
    const coverUrlControl = form.get('coverUrl') as FormControl<string> | null;
    const genresControl = form.get('genres') as FormControl<string> | null;
    const languageControl = form.get('language') as FormControl<string> | null;
    const chapterCountControl = form.get('chapterCount') as FormControl<number | null> | null;

    if (!titleControl || !descriptionControl || !coverUrlControl || !genresControl || !languageControl || !chapterCountControl) {
      this.errorMessage.set('Metadata apply target is missing required fields.');
      return;
    }

    const patch = buildMetadataPatch(metadata, {
      title: titleControl.value,
      description: descriptionControl.value,
      coverUrl: coverUrlControl.value,
      genres: genresControl.value,
      language: languageControl.value,
      chapterCount: chapterCountControl.value,
    });

    form.patchValue(patch);
  }
}
