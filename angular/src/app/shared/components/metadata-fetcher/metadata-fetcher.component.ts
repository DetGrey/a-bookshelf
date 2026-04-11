import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SUPABASE_CLIENT } from '../../../core/supabase.token';
import { CoverImageComponent } from '../cover-image/cover-image.component';
import { buildMetadataPatch, MetadataPayload } from './metadata-fetcher.mapper';

@Component({
  selector: 'app-metadata-fetcher',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CoverImageComponent],
  styleUrl: './metadata-fetcher.component.scss',
  template: `
    <fieldset class="metadata-fetcher">
      <label class="field">
        <span>Source URL</span>
        <p class="muted">Right now it only works with bato pages.</p>
        <div class="fetch-controls">
          <input
            data-testid="metadata-url-input"
            [(ngModel)]="sourceUrl"
            name="metadataSourceUrl"
            placeholder="https://example.com/volume-12"
          />

          <button
            data-testid="metadata-fetch-button"
            type="button"
            class="primary"
            [disabled]="isLoading() || !sourceUrl.trim()"
            (click)="fetchMetadata()"
          >
            @if (isLoading()) { Fetching… } @else { Fetch metadata }
          </button>
        </div>
      </label>

      @if (errorMessage(); as msg) {
        <p class="error-text" data-testid="fetch-error">{{ msg }}</p>
      }

      @if (fetchedMetadata(); as data) {
        <div data-testid="fetched-preview" class="preview-card">
          <h4>Fetched Preview</h4>
          <div class="preview-content">
            <app-cover-image [src]="data.image ?? null" [alt]="data.title ?? ''" [lazy]="false" />
            <div class="preview-details">
              <h5>{{ data.title }}</h5>
              @if (!compact()) {
                <p>{{ data.description }}</p>
              }

              @if (data.genres?.length) {
                <div class="pill-row">
                  @for (genre of data.genres; track genre) {
                    <span class="pill">{{ genre }}</span>
                  }
                </div>
              }

              <div class="pill-row">
                @if (data.latest_chapter) {
                  <span class="pill">Latest: {{ data.latest_chapter }}</span>
                }
                @if (data.chapter_count != null) {
                  <span class="pill">Chapters: {{ data.chapter_count }}</span>
                }
              </div>
            </div>
          </div>
          
          <div class="preview-actions">
            <button 
              data-testid="clear-preview-btn" 
              type="button" 
              (click)="clearPreview()"
            >
              Clear
            </button>
            <button 
              data-testid="metadata-apply-button" 
              type="button" 
              class="btn-primary"
              (click)="applyMetadata()"
            >
              Apply to fields
            </button>
          </div>
        </div>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataFetcherComponent {
  private readonly supabase = inject(SUPABASE_CLIENT);

  readonly form = input.required<FormGroup>();
  readonly compact = input(false);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fetchedMetadata = signal<MetadataPayload | null>(null);
  readonly previewTitle = computed(() => this.fetchedMetadata()?.title ?? 'Untitled');

  sourceUrl = '';

  async fetchMetadata(): Promise<void> {
    const url = this.sourceUrl.trim();
    if (!url) {
      this.errorMessage.set('Source URL is required.');
      this.fetchedMetadata.set(null);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.fetchedMetadata.set(null);

    const { data, error } = await this.supabase.functions.invoke('fetch-metadata', {
      body: { url },
    });

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message ?? 'Failed to fetch metadata.');
      return;
    }

    const wrappedError = (data as { success?: boolean; error?: string } | null)?.success === false;
    if (wrappedError) {
      const message = (data as { error?: string }).error;
      this.errorMessage.set(message ?? 'Failed to fetch metadata.');
      return;
    }

    const payload = this.extractPayload(data);
    if (!payload) {
      this.errorMessage.set('No metadata returned for this URL.');
      return;
    }

    this.fetchedMetadata.set(payload);
  }

  applyMetadata(): void {
    const metadata = this.fetchedMetadata();
    if (!metadata) {
      return;
    }

    const form = this.form();

    const titleControl = form.get('title') as FormControl<string> | null;
    const descriptionControl = form.get('description') as FormControl<string> | null;
    const coverUrlControl = form.get('coverUrl') as FormControl<string> | null;
    const genresControl = form.get('genres') as FormControl<string> | null;
    const languageControl = form.get('language') as FormControl<string> | null;
    const latestChapterControl = form.get('latestChapter') as FormControl<string> | null;
    const chapterCountControl = form.get('chapterCount') as FormControl<number | null> | null;

    if (!titleControl || !descriptionControl || !coverUrlControl || !genresControl || !languageControl || !latestChapterControl || !chapterCountControl) {
      this.errorMessage.set('Metadata apply target is missing required fields.');
      return;
    }

    const patch = buildMetadataPatch(metadata, {
      title: titleControl.value,
      description: descriptionControl.value,
      coverUrl: coverUrlControl.value,
      genres: genresControl.value,
      language: languageControl.value,
      latestChapter: latestChapterControl.value,
      chapterCount: chapterCountControl.value,
    });

    form.patchValue(patch);
    this.fetchedMetadata.set(null);
  }

  clearPreview(): void {
    this.fetchedMetadata.set(null);
  }

  private extractPayload(data: unknown): MetadataPayload | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    if ('metadata' in data && (data as { metadata?: unknown }).metadata && typeof (data as { metadata?: unknown }).metadata === 'object') {
      return (data as { metadata: MetadataPayload }).metadata;
    }

    return data as MetadataPayload;
  }
}
