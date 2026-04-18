import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
      <p class="eyebrow">Fetch Metadata</p>

      <label class="field">
        <span>Source URL</span>
        <div class="fetch-controls">
          <input
            data-testid="metadata-url-input"
            [value]="sourceUrl || prefillSourceUrl()"
            name="metadataSourceUrl"
            placeholder="https://example.com/volume-12"
            (input)="onSourceUrlInput($event)"
          />

          <button
            data-testid="metadata-fetch-button"
            type="button"
            [class]="compact() ? 'ghost' : 'primary'"
            [disabled]="isLoading() || !resolvedSourceUrl().trim()"
            (click)="fetchMetadata()"
          >
            @if (isLoading()) { Fetching… } @else { Fetch }
          </button>
        </div>
      </label>

      @if (errorMessage(); as msg) {
        <p class="error-text" data-testid="fetch-error">{{ msg }}</p>
      }

      @if (successMessage(); as msg) {
        <p class="success" data-testid="fetch-success">{{ msg }}</p>
      }

      @if (showFetchedPreview() && fetchedMetadata(); as data) {
        <div data-testid="fetched-preview" class="preview-card">
          <h4>Fetched Preview</h4>
          <div class="preview-content">
            <div class="preview-thumb">
              <app-cover-image [src]="data.image ?? null" [alt]="data.title ?? ''" [lazy]="false" />
            </div>
            <div class="preview-details">
              <h5>{{ data.title }}</h5>
              @if (!compact()) {
                <p>{{ data.description }}</p>
              }

              @if (data.genres?.length) {
                <div class="pill-row preview-pills genres-row">
                  @for (genre of data.genres; track genre) {
                    <span class="pill ghost">{{ genre }}</span>
                  }
                </div>
              }

              <div class="pill-row preview-pills meta-row">
                @if (data.latest_chapter) {
                  <span class="pill ghost">Latest: {{ data.latest_chapter }}</span>
                }
                @if (data.chapter_count != null) {
                  <span class="pill ghost">Chapters: {{ data.chapter_count }}</span>
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
  readonly prefillSourceUrl = input('');
  readonly autoApplyOnFetch = input(false);
  readonly autoAddSource = input(false);
  readonly showFetchedPreview = input(true);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly fetchedMetadata = signal<MetadataPayload | null>(null);
  readonly previewTitle = computed(() => this.fetchedMetadata()?.title ?? 'Untitled');

  sourceUrl = '';

  onSourceUrlInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.sourceUrl = target.value ?? '';
  }

  async fetchMetadata(): Promise<void> {
    const url = this.resolvedSourceUrl().trim();
    if (!url) {
      this.errorMessage.set('Source URL is required.');
      this.successMessage.set(null);
      this.fetchedMetadata.set(null);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
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

    if (this.autoApplyOnFetch()) {
      const applied = this.applyMetadataPayload(payload);
      if (applied) {
        this.successMessage.set('Metadata fetched. Review or edit fields below, then save.');
        if (!this.showFetchedPreview()) {
          this.fetchedMetadata.set(null);
        }
      }
    }
  }

  applyMetadata(): void {
    const metadata = this.fetchedMetadata();
    if (!metadata) {
      return;
    }

    this.applyMetadataPayload(metadata);
  }

  private applyMetadataPayload(metadata: MetadataPayload): boolean {
    this.errorMessage.set(null);

    const form = this.form();

    const titleControl = form.get('title') as FormControl<string> | null;
    const descriptionControl = form.get('description') as FormControl<string> | null;
    const coverUrlControl = form.get('coverUrl') as FormControl<string> | null;
    const genresControl = form.get('genres') as FormControl<string> | null;
    const languageControl = form.get('language') as FormControl<string> | null;
    const originalLanguageControl = form.get('originalLanguage') as FormControl<string> | null;
    const latestChapterControl = form.get('latestChapter') as FormControl<string> | null;
    const lastUploadedAtControl = form.get('lastUploadedAt') as FormControl<string> | null;
    const lastFetchedAtControl = form.get('lastFetchedAt') as FormControl<string> | null;
    const chapterCountControl = form.get('chapterCount') as FormControl<number | null> | null;

    if (!titleControl || !descriptionControl || !coverUrlControl || !genresControl || !languageControl || !latestChapterControl || !chapterCountControl) {
      this.errorMessage.set('Metadata apply target is missing required fields.');
      this.successMessage.set(null);
      return false;
    }

    const patch = buildMetadataPatch(metadata);

    const now = new Date().toISOString().slice(0, 19);
    const patchWithFetchedAt = lastFetchedAtControl
      ? { ...patch, lastFetchedAt: now }
      : patch;

    form.patchValue(patchWithFetchedAt);
    if (this.autoAddSource()) {
      this.syncPrimarySource(form, this.resolvedSourceUrl());
    }
    this.fetchedMetadata.set(null);
    this.successMessage.set('Metadata applied to fields.');
    return true;
  }

  private syncPrimarySource(form: FormGroup, url: string): void {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }

    const sourcesControl = form.get('sources');
    if (!(sourcesControl instanceof FormArray)) {
      return;
    }

    const existing = sourcesControl.controls.some((group) => {
      const existingUrl = group.get('url')?.value;
      return typeof existingUrl === 'string' && existingUrl.trim() === trimmedUrl;
    });

    if (existing) {
      return;
    }

    let siteName = 'Source';
    try {
      siteName = new URL(trimmedUrl).hostname.replace(/^www\./, '') || 'Source';
    } catch {
      // Keep the default label when the URL cannot be parsed.
    }

    sourcesControl.push(
      new FormGroup({
        siteName: new FormControl(siteName, { nonNullable: true }),
        url: new FormControl(trimmedUrl, { nonNullable: true }),
      }),
    );
  }

  clearPreview(): void {
    this.fetchedMetadata.set(null);
    this.successMessage.set(null);
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

  resolvedSourceUrl(): string {
    return this.sourceUrl.trim() || this.prefillSourceUrl().trim();
  }
}
