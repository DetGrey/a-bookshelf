import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../core/book/book.service';
import { Book } from '../../models/book.model';
import { QualityToolsService, CoverHealthScanResult, DuplicateTitleScanResult, StaleWaitingScanResult } from '../../core/quality/quality-tools.service';
import { BackupRestoreService } from '../../core/backup/backup-restore.service';
import { BookGridComponent } from '../../shared/components/book-grid/book-grid.component';
import { fromEvent } from 'rxjs';

type ConsolidationStep = 'idle' | 'selecting' | 'working';

type SimilarGenrePair = {
  keepGenre: string;
  mergeGenre: string;
  keepCount: number;
  mergeCount: number;
  similarity: number;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [FormsModule, BookGridComponent],
  template: `
    <div class="page dashboard-page">
      <div class="page-head">
        <div>
          <p class="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p class="muted">Track reading, pull metadata, and jump back into the next chapter fast.</p>
        </div>
        <a href="/add" class="primary">Smart Add</a>
      </div>

      <section class="dashboard-stats stat-grid">
        <article class="stat">
          <p class="muted">Total saved</p>
          <strong>{{ totalSaved() }}</strong>
        </article>
        <article class="stat">
          <p class="muted">Completed</p>
          <strong>{{ completedCount() }}</strong>
        </article>
        <article class="stat">
          <p class="muted">Waiting for updates</p>
          <strong>{{ waitingCount() }}</strong>
        </article>
        <article class="stat">
          <p class="muted">Last updated</p>
          <strong>{{ lastUpdatedTitle() }}</strong>
        </article>
        <article class="stat">
          <p class="muted">Average score</p>
          <strong>{{ averageScore() }}</strong>
        </article>
        <article class="stat">
          <p class="muted">Score 10 count</p>
          <strong>{{ scoreTenCount() }}</strong>
        </article>
      </section>

      <section class="card dashboard-section">
        <div class="block-head dashboard-section-header">
          <h2>Genre breakdown</h2>
          <p class="muted">
            {{ totalBooks() ? 'Books by genre (% of your library) — books can have multiple genres' : 'No genre data yet' }}
          </p>
        </div>
        @if (totalBooks() > 0 && genreBreakdown().length > 0) {
          <div class="genre-list-container">
            @for (item of visibleGenres(); track item.name; let index = $index) {
              <div class="genre-bar-item">
                <div class="genre-bar-header">
                  <span class="genre-bar-name">{{ item.name }}</span>
                  <span class="muted genre-bar-stats">{{ percentOfLibrary(item.count) }}% ({{ item.count }})</span>
                  <span class="sr-only">{{ item.name }} ({{ item.count }})</span>
                </div>
                <div class="genre-bar-track">
                  <div
                    class="genre-bar-fill"
                    [style.width.%]="barWidthPercent(item.count)"
                    [style.background-color]="breakdownColor(index)"
                  ></div>
                </div>
              </div>
            }
            @if (hasMoreGenres()) {
              <button type="button" class="ghost genre-more-button" data-testid="toggle-genres" (click)="toggleGenres()">
                <span>{{ showAllGenres() ? '▼' : '▶' }}</span>
                <span>
                  {{ showAllGenres() ? 'Show top five' : '+ ' + (genreBreakdown().length - 5) + ' more genres' }}
                </span>
              </button>
            }
          </div>
        } @else {
          <p class="muted">Add genres to your books to see the breakdown.</p>
        }
      </section>

      <section class="card dashboard-section">
        <div class="block-head dashboard-section-header">
          <h2>Sources breakdown</h2>
          <p class="muted">
            {{ totalBooks() ? 'Books by source (% of your library) — books can have multiple sources' : 'No source data yet' }}
          </p>
        </div>
        @if (totalBooks() > 0 && sourceBreakdown().length > 0) {
          <div class="genre-list-container">
            @for (item of visibleSources(); track item.name; let index = $index) {
              <div class="genre-bar-item">
                <div class="genre-bar-header">
                  <span class="genre-bar-name">{{ item.name }}</span>
                  <span class="muted genre-bar-stats">{{ percentOfLibrary(item.count) }}% ({{ item.count }})</span>
                  <span class="sr-only">{{ item.name }} ({{ item.count }})</span>
                </div>
                <div class="genre-bar-track">
                  <div
                    class="genre-bar-fill"
                    [style.width.%]="barWidthPercent(item.count)"
                    [style.background-color]="breakdownColor(index)"
                  ></div>
                </div>
              </div>
            }
            @if (hasMoreSources()) {
              <button type="button" class="ghost genre-more-button" data-testid="toggle-sources" (click)="toggleSources()">
                <span>{{ showAllSources() ? '▼' : '▶' }}</span>
                <span>
                  {{ showAllSources() ? 'Show top five' : '+ ' + (sourceBreakdown().length - 5) + ' more sources' }}
                </span>
              </button>
            }
          </div>
        } @else {
          <p class="muted">Add sources to your books to see the breakdown.</p>
        }
      </section>

      @for (section of statusSections(); track section.key) {
        @if (section.books.length > 0) {
          <section class="block" [attr.data-testid]="'status-section-' + section.key">
            <div class="block-head">
              <h2 class="section-heading">{{ statusSectionHeading(section.key, section.label) }}</h2>
            </div>
            <app-book-grid [books]="section.books" [compact]="true" (opened)="onOpenDetails($event)" />
          </section>
        }
      }

      <section class="card tools-shell">
        <div class="block-head quality-check-header">
          <div>
            <h2 class="m-0">Quality checks & tools</h2>
            <p class="muted m-0">Audit and improve your library</p>
          </div>
        </div>

        <div class="tools-sections">
          <section class="card tools-column">
            <div class="block-head quality-check-header">
              <h2 class="m-0 tools-column-title">Quality checks</h2>
            </div>

            <section class="quality-check-section">
              <div class="block-head quality-check-header">
                <div>
                  <h3 class="m-0">Find possible duplicate titles</h3>
                </div>
                <button type="button" class="ghost quality-check-button" data-testid="duplicate-title-scanner" (click)="runDuplicateScan()">
                  Scan for duplicates
                </button>
              </div>

              @if (duplicateMessage()) {
                <p class="muted m-0">{{ duplicateMessage() }}</p>
              }

              @if (duplicateScanResult()?.groups?.length) {
                <div class="quality-result-list" data-testid="duplicate-results-panel">
                  @for (group of duplicateScanResult()!.groups; track group.normalizedTitle) {
                    <div class="quality-result-card">
                      <div class="duplicate-comparison">
                        <div class="duplicate-titles-wrapper">
                          <strong>{{ group.title }}</strong>
                          <p class="muted m-0">{{ group.count }} entries</p>
                        </div>
                        <span class="pill ghost similarity-percentage">Duplicates: {{ group.count }}</span>
                      </div>
                      <div class="quality-result-links">
                        @for (bookId of group.books; track bookId) {
                          <a class="ghost quality-inline-link" [attr.href]="'/book/' + bookId">{{ titleById(bookId) }}</a>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </section>

            <section class="quality-check-section">
              <div class="block-head quality-check-header">
                <div>
                  <h3 class="m-0">Stale waiting books</h3>
                  <p class="muted m-0">Books in waiting that haven't updated recently</p>
                </div>
                <button type="button" class="ghost quality-check-button" data-testid="stale-waiting-scanner" (click)="runStaleWaitingScan()">
                  Check for stale books
                </button>
              </div>

              @if (staleMessage()) {
                <p class="muted m-0">{{ staleMessage() }}</p>
              }

              @if (staleWaitingResult()?.groups?.length) {
                <div class="quality-result-list" data-testid="stale-results-panel">
                  @for (group of staleWaitingResult()!.groups; track group.label) {
                    @for (bookId of group.books; track bookId) {
                      <div class="quality-result-card">
                        <div class="duplicate-comparison">
                          <div class="duplicate-titles-wrapper">
                            <a class="quality-title-link" [attr.href]="'/book/' + bookId"><strong>{{ titleById(bookId) }}</strong></a>
                            <p class="muted m-0">Stale in {{ group.label }}</p>
                          </div>
                          <span class="pill ghost">{{ group.oldestDays }} days</span>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </section>

            <section class="quality-check-section">
              <div class="block-head quality-check-header">
                <div>
                  <h3 class="m-0">Cover image issues</h3>
                  <p class="muted m-0">Find missing/external covers and repair what can be proxied</p>
                </div>
                <button type="button" class="ghost quality-check-button" data-testid="cover-checker" (click)="runCoverCheck()">
                  Check covers
                </button>
              </div>

              @if (coverMessage()) {
                <p class="muted m-0">{{ coverMessage() }}</p>
              }

              @if (coverScanResult(); as coverScan) {
                <div class="quality-result-list" data-testid="cover-results-panel">
                  @if (coverScan.externalCount > 0) {
                    <div class="quality-result-card">
                      <div class="duplicate-comparison">
                        <strong>Uploadable to Cloudflare ({{ coverScan.externalCount }})</strong>
                        <button
                          type="button"
                          class="primary quality-check-button"
                          data-testid="cover-repair"
                          [disabled]="coverRepairRunning()"
                          (click)="repairCovers()"
                        >
                          {{ coverRepairRunning() ? 'Repairing…' : 'Repair ' + coverScan.externalCount + ' external ' + (coverScan.externalCount === 1 ? 'cover' : 'covers') }}
                        </button>
                      </div>
                    </div>
                  }

                  @if (coverScan.missingCount > 0) {
                    <div class="quality-result-card">
                      <strong>Missing covers: {{ coverScan.missingCount }}</strong>
                    </div>
                  }

                  @if (coverIssuesPreview().length > 0) {
                    @for (issue of coverIssuesPreview(); track issue.bookId) {
                      <div class="quality-result-card">
                        <div class="duplicate-comparison">
                          <a class="quality-title-link" [attr.href]="'/book/' + issue.bookId"><strong>{{ issue.title }}</strong></a>
                          <span class="pill ghost">{{ issue.status }}</span>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </section>
          </section>

          <section class="card tools-column">
            <div class="block-head quality-check-header">
              <h2 class="m-0 tools-column-title">Tools</h2>
            </div>

            <section class="quality-check-section">
              <div class="block-head quality-check-header">
                <div>
                  <h3 class="m-0">Consolidate similar genres</h3>
                  <p class="muted m-0">Find and merge genres that are variations of each other</p>
                </div>
                @if (consolidationStep() === 'idle') {
                  <button type="button" class="ghost quality-check-button" data-testid="genre-consolidation" (click)="findSimilarGenres()">Find similar genres</button>
                }
              </div>

              @if (genreMessage()) {
                <p class="muted m-0">{{ genreMessage() }}</p>
              }

              @if (consolidationStep() === 'selecting') {
                <div class="genre-consolidation-panel" data-testid="genre-consolidation-panel">
                  @if (similarGenrePairs().length > 0) {
                    <div class="stack duplicate-results mt-4">
                      @for (pair of similarGenrePairs(); track pair.mergeGenre + '→' + pair.keepGenre; let index = $index) {
                        <label class="card duplicate-item-card genre-pair-checkbox">
                          <div class="genre-pair-item">
                            <input
                              type="checkbox"
                              [checked]="selectedGenrePairs().includes(index)"
                              (change)="toggleGenrePair(index)"
                            />
                            <div class="duplicate-comparison genre-pair-content">
                              <div class="duplicate-titles-wrapper">
                                <div class="duplicate-titles-list">
                                  <div class="genre-pair-names">
                                    <span class="genre-name">{{ pair.mergeGenre }}</span>
                                    <span class="genre-arrow">→</span>
                                    <span class="genre-name">{{ pair.keepGenre }}</span>
                                  </div>
                                  <p class="muted text-small-muted">Merge {{ pair.mergeGenre }} ({{ pair.mergeCount }}) into {{ pair.keepGenre }} ({{ pair.keepCount }})</p>
                                </div>
                              </div>
                              <span class="pill ghost">{{ (pair.similarity * 100).toFixed(0) }}% match</span>
                            </div>
                          </div>
                        </label>
                      }
                    </div>

                    <div class="genre-merge-buttons">
                      @if (selectedGenrePairs().length > 0) {
                        <button
                          type="button"
                          class="primary quality-check-button"
                          data-testid="consolidation-confirm"
                          [disabled]="genreMerging()"
                          (click)="mergeSelectedGenrePairs()"
                        >
                          {{ genreMerging() ? 'Merging…' : 'Merge ' + selectedGenrePairs().length + ' pair' + (selectedGenrePairs().length > 1 ? 's' : '') }}
                        </button>
                      }
                      <button
                        type="button"
                        class="ghost quality-check-button"
                        data-testid="consolidation-cancel"
                        [disabled]="genreMerging()"
                        (click)="cancelGenreConsolidation()"
                      >
                        {{ selectedGenrePairs().length > 0 ? 'Clear selection' : 'Cancel' }}
                      </button>
                    </div>
                  } @else {
                    <p class="muted">No similar genres found.</p>
                  }

                  <div class="genre-divider">
                    <h3 class="genre-divider-title">Or replace manually</h3>
                    <div class="genre-custom-form">
                      <div class="field">
                        <label>Replace this genre:</label>
                        <input
                          type="text"
                          data-testid="consolidation-custom-from"
                          [(ngModel)]="customFrom"
                          name="customFrom"
                          autoCapitalize="words"
                          placeholder="e.g. SciFi"
                          [disabled]="customMerging()"
                        />
                      </div>
                      <div class="field">
                        <label>With this genre:</label>
                        <input
                          type="text"
                          data-testid="consolidation-custom-to"
                          [(ngModel)]="customTo"
                          name="customTo"
                          autoCapitalize="words"
                          placeholder="e.g. Science Fiction"
                          [disabled]="customMerging()"
                        />
                      </div>
                      <button
                        class="primary genre-custom-button"
                        type="button"
                        data-testid="consolidation-custom-replace"
                        (click)="replaceGenreManually()"
                        [disabled]="customMerging() || !customFrom.trim() || !customTo.trim()"
                      >
                        {{ customMerging() ? 'Merging…' : 'Replace' }}
                      </button>
                    </div>
                  </div>
                </div>
              } @else if (consolidationStep() === 'working') {
                <p class="muted">Consolidating genres…</p>
              }
            </section>
          </section>
        </div>
      </section>

      <section class="card data-portability-section">
        <div class="data-portability-content">
          <p class="eyebrow m-0">Data portability</p>
          <p class="muted m-0">Download or upload all your data as JSON (books, shelves, links).</p>
          @if (portabilityMessage()) {
            <p class="muted m-0 mt-8">{{ portabilityMessage() }}</p>
          }
        </div>
        <div class="data-portability-buttons">
          <button type="button" class="ghost quality-check-button" data-testid="backup-restore" (click)="restoreInput.click()">
            Upload JSON
          </button>
          <button type="button" class="ghost quality-check-button" data-testid="backup-download" (click)="downloadBackup()">
            Download Backup
          </button>
          <input
            #restoreInput
            class="hidden-file-input"
            data-testid="backup-restore-input"
            type="file"
            accept="application/json"
            (change)="onBackupFileSelected($event)"
          />
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly bookService = inject(BookService);
  private readonly qualityTools = inject(QualityToolsService);
  private readonly backupRestore = inject(BackupRestoreService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly books = this.bookService.books;
  readonly totalSaved = computed(() => this.books().length);
  readonly totalBooks = computed(() => this.books().length);
  readonly averageScore = computed(() => this.bookService.averageScore());
  readonly waitingCount = computed(() => this.books().filter((book) => book.status === 'waiting').length);
  readonly scoreTenCount = computed(() => this.books().filter((book) => book.score === 10).length);
  readonly completedCount = computed(() => this.books().filter((book) => book.status === 'completed').length);
  readonly lastUpdatedTitle = computed(() => {
    const sorted = [...this.books()].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
    return sorted[0]?.title ?? '—';
  });

  readonly showAllGenres = signal(false);
  readonly showAllSources = signal(false);
  readonly booksPerStatus = signal(4);
  readonly duplicateMessage = signal('');
  readonly staleMessage = signal('');
  readonly coverMessage = signal('');
  readonly genreMessage = signal('');
  readonly portabilityMessage = signal('');
  readonly duplicateScanResult = signal<DuplicateTitleScanResult | null>(null);
  readonly staleWaitingResult = signal<StaleWaitingScanResult | null>(null);
  readonly coverScanResult = signal<CoverHealthScanResult | null>(null);
  readonly coverRepairRunning = signal(false);
  readonly consolidationStep = signal<ConsolidationStep>('idle');
  readonly similarGenrePairs = signal<SimilarGenrePair[]>([]);
  readonly selectedGenrePairs = signal<number[]>([]);
  readonly genreMerging = signal(false);
  readonly customMerging = signal(false);
  readonly breakdownPalette = ['#7c83ff', '#ff8ba7', '#22c55e', '#f6aa1c', '#4cc9f0', '#a855f7', '#ef4444', '#0ea5e9'];

  readonly sectionStatuses = [
    { key: 'reading', label: 'Reading' },
    { key: 'plan_to_read', label: 'Plan to Read' },
    { key: 'waiting', label: 'Waiting' },
    { key: 'completed', label: 'Completed' },
  ] as const;

  customFrom = '';
  customTo = '';

  readonly genreBreakdown = computed(() => this.buildTopBreakdown(this.collectGenres(this.books())));
  readonly sourceBreakdown = computed(() => this.buildTopBreakdown(this.collectSources(this.books())));

  readonly visibleGenres = computed(() => this.sliceBreakdown(this.genreBreakdown(), this.showAllGenres()));
  readonly visibleSources = computed(() => this.sliceBreakdown(this.sourceBreakdown(), this.showAllSources()));

  readonly hasMoreGenres = computed(() => this.genreBreakdown().length > 5);
  readonly hasMoreSources = computed(() => this.sourceBreakdown().length > 5);
  readonly statusSections = computed(() => this.sectionStatuses.map((section) => ({
    ...section,
    books: [...this.books()]
      .filter((book) => book.status === section.key)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, this.booksPerStatus()),
  })));
  readonly coverIssuesPreview = computed(() => this.coverScanResult()?.issues.slice(0, 8) ?? []);

  constructor() {
    afterNextRender(() => {
      this.updateBooksPerStatus();

      const windowRef = this.document.defaultView;
      if (!windowRef) {
        return;
      }

      fromEvent(windowRef, 'resize')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateBooksPerStatus());
    });
  }

  toggleGenres(): void {
    this.showAllGenres.update((value) => !value);
  }

  onOpenDetails(_bookId: string): void {
    return;
  }

  toggleSources(): void {
    this.showAllSources.update((value) => !value);
  }

  statusSectionHeading(key: string, fallback: string): string {
    if (key === 'reading') {
      return 'Currently reading';
    }

    return fallback;
  }

  percentOfLibrary(count: number): string {
    const total = this.totalBooks();
    if (!total) {
      return '0.0';
    }

    return ((count / total) * 100).toFixed(1);
  }

  barWidthPercent(count: number): number {
    const total = this.totalBooks();
    if (!total) {
      return 0;
    }

    return Math.min((count / total) * 100, 100);
  }

  breakdownColor(index: number): string {
    return this.breakdownPalette[index % this.breakdownPalette.length] ?? '#7c83ff';
  }

  runDuplicateScan(): void {
    const result = this.qualityTools.scanDuplicateTitles();
    this.duplicateScanResult.set(result);
    this.duplicateMessage.set(result.duplicateCount ? `Duplicate groups: ${result.duplicateCount}` : 'No likely duplicates found.');
  }

  runStaleWaitingScan(): void {
    const result = this.qualityTools.scanStaleWaiting();
    this.staleWaitingResult.set(result);
    this.staleMessage.set(result.staleCount ? `Stale waiting books: ${result.staleCount}` : 'All waiting books appear active');
  }

  runCoverCheck(): void {
    const result = this.qualityTools.scanCoverHealth();
    this.coverScanResult.set(result);
    this.coverMessage.set(
      `Missing: ${result.missingCount}, External: ${result.externalCount}, Proxied: ${result.proxiedCount}`,
    );
  }

  titleById(bookId: string): string {
    const book = this.books().find((entry) => entry.id === bookId);
    return book?.title ?? bookId;
  }

  async repairCovers(): Promise<void> {
    this.coverRepairRunning.set(true);
    const result = await this.qualityTools.repairExternalCovers(true);
    this.coverRepairRunning.set(false);
    this.coverScanResult.set(null);

    if (!result.success) {
      this.coverMessage.set(`Cover repair failed: ${result.error.message}`);
      return;
    }

    this.coverMessage.set(
      `Cover repair complete. Repaired: ${result.data.repairedCount}, Skipped: ${result.data.skippedCount}`,
    );
  }

  async findSimilarGenres(): Promise<void> {
    this.genreMessage.set('');
    this.selectedGenrePairs.set([]);
    this.customFrom = '';
    this.customTo = '';

    const genreCounts = new Map<string, number>();
    this.books().forEach((book) => {
      const uniqueGenres = new Set((book.genres ?? []).map((genre) => genre.trim()).filter(Boolean));
      uniqueGenres.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      });
    });

    const genresSet = new Map<string, string>();
    this.books().forEach((book) => {
      (book.genres ?? []).forEach((genre) => {
        const key = genre.trim();
        if (!key) return;
        const normalized = this.normalizeGenre(key);
        if (!genresSet.has(normalized)) {
          genresSet.set(normalized, key);
        }
      });
    });

    const genres = [...genresSet.values()];
    const pairs: SimilarGenrePair[] = [];

    for (let i = 0; i < genres.length; i += 1) {
      for (let j = i + 1; j < genres.length; j += 1) {
        const similarity = this.stringSimilarity(genres[i]!, genres[j]!);
        if (similarity < 0.75) {
          continue;
        }

        const genre1 = genres[i]!;
        const genre2 = genres[j]!;
        const count1 = genreCounts.get(genre1) ?? 0;
        const count2 = genreCounts.get(genre2) ?? 0;
        const keepGenre = count1 >= count2 ? genre1 : genre2;
        const mergeGenre = keepGenre === genre1 ? genre2 : genre1;

        pairs.push({
          keepGenre,
          mergeGenre,
          keepCount: keepGenre === genre1 ? count1 : count2,
          mergeCount: mergeGenre === genre1 ? count1 : count2,
          similarity,
        });
      }
    }

    pairs.sort((left, right) => right.similarity - left.similarity);
    this.similarGenrePairs.set(pairs);
    this.genreMessage.set(
      pairs.length ? `Found ${pairs.length} potentially similar genre pair${pairs.length === 1 ? '' : 's'}` : 'No similar genres found.',
    );
    this.consolidationStep.set('selecting');
  }

  toggleGenrePair(index: number): void {
    const current = this.selectedGenrePairs();
    if (current.includes(index)) {
      this.selectedGenrePairs.set(current.filter((value) => value !== index));
    } else {
      this.selectedGenrePairs.set([...current, index]);
    }
  }

  clearSelectedGenrePairs(): void {
    this.selectedGenrePairs.set([]);
  }

  cancelGenreConsolidation(): void {
    this.selectedGenrePairs.set([]);
    this.similarGenrePairs.set([]);
    this.customFrom = '';
    this.customTo = '';
    this.genreMessage.set('');
    this.consolidationStep.set('idle');
  }

  async mergeSelectedGenrePairs(): Promise<void> {
    const selectedIndices = this.selectedGenrePairs();
    const selectedPairs = selectedIndices.map((index) => this.similarGenrePairs()[index]).filter((pair): pair is SimilarGenrePair => pair !== undefined);

    if (selectedPairs.length === 0) {
      return;
    }

    this.genreMerging.set(true);
    this.consolidationStep.set('working');
    let updatedCount = 0;

    try {
      for (const pair of selectedPairs) {
        const result = await this.qualityTools.consolidateGenres([pair.mergeGenre], pair.keepGenre, true, 'replace');
        if (!result.success) {
          throw new Error(result.error.message);
        }

        updatedCount += result.data.updatedCount;
      }

      this.genreMessage.set(
        `Genre consolidation complete. Updated ${updatedCount} book(s). ${selectedPairs.map((pair) => `"${pair.mergeGenre}" → "${pair.keepGenre}"`).join(', ')}`,
      );
      this.similarGenrePairs.set([]);
      this.selectedGenrePairs.set([]);
      this.consolidationStep.set('idle');
    } catch (error) {
      this.genreMessage.set(`Genre consolidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.consolidationStep.set('selecting');
    } finally {
      this.genreMerging.set(false);
    }
  }

  async replaceGenreManually(): Promise<void> {
    const fromTrimmed = this.customFrom.trim();
    const toTrimmed = this.customTo.trim();

    if (!fromTrimmed || !toTrimmed || fromTrimmed === toTrimmed) {
      return;
    }

    this.customMerging.set(true);
    this.consolidationStep.set('working');

    try {
      const result = await this.qualityTools.consolidateGenres([fromTrimmed], toTrimmed, true, 'replace');
      if (!result.success) {
        throw new Error(result.error.message);
      }

      this.genreMessage.set(
        `Successfully merged "${fromTrimmed}" → "${toTrimmed}" (${result.data.updatedCount} book${result.data.updatedCount === 1 ? '' : 's'} updated).`,
      );
      this.customFrom = '';
      this.customTo = '';
      this.similarGenrePairs.set([]);
      this.selectedGenrePairs.set([]);
      this.consolidationStep.set('idle');
    } catch (error) {
      this.genreMessage.set(`Genre consolidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.consolidationStep.set('selecting');
    } finally {
      this.customMerging.set(false);
    }
  }

  async downloadBackup(): Promise<void> {
    const result = await this.backupRestore.exportLibrary();
    if (!result.success) {
      this.portabilityMessage.set(`Backup export failed: ${result.error.message}`);
      return;
    }

    const payload = JSON.stringify(result.data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = `a-bookshelf-backup-${new Date().toISOString()}.json`;
    anchor.click();
    const revokeObjectUrl = (URL as typeof URL & { revokeObjectURL?: (value: string) => void }).revokeObjectURL;
    revokeObjectUrl?.(url);
    this.portabilityMessage.set('Backup exported.');
  }

  async onBackupFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    try {
      const payload = JSON.parse(await file.text()) as Parameters<typeof this.backupRestore.restoreLibrary>[0];
      const result = await this.backupRestore.restoreLibrary(payload, { chunkSize: 50 });

      if (!result.success) {
        this.portabilityMessage.set(`Restore failed: ${result.error.message}`);
        return;
      }

      this.portabilityMessage.set(`Restore complete. Books: ${result.data.booksUpserted}, shelves: ${result.data.shelvesUpserted}`);
    } catch (error) {
      this.portabilityMessage.set('Restore failed: invalid JSON backup file.');
    }
  }

  private collectGenres(books: readonly Book[]): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    const ignoredGenres = new Set(['manhwa', 'manhua', 'webtoon', 'manga', 'full color']);

    books.forEach((book) => {
      const uniqueGenres = new Set(book.genres);
      uniqueGenres.forEach((genre) => {
        const key = genre.trim();
        if (!key) return;
        if (ignoredGenres.has(key.toLowerCase())) return;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }

  private collectSources(books: readonly Book[]): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();

    books.forEach((book) => {
      const sourceUrls = [
        ...(book.sources ?? []).map((source) => source.url),
        ...(((book as Book & { sourceUrls?: string[] }).sourceUrls) ?? []),
      ];

      sourceUrls.forEach((url) => {
        try {
          const host = new URL(url).hostname.replace(/^www\./, '');
          if (!host) {
            return;
          }

          counts.set(host, (counts.get(host) ?? 0) + 1);
        } catch {
          return;
        }
      });
    });

    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }

  private buildTopBreakdown(items: Array<{ name: string; count: number }>, sortDescending = true): Array<{ name: string; count: number }> {
    const sorted = [...items].sort((left, right) => {
      if (right.count !== left.count) {
        return sortDescending ? right.count - left.count : left.count - right.count;
      }

      return left.name.localeCompare(right.name);
    });

    return sorted;
  }

  private sliceBreakdown(items: Array<{ name: string; count: number }>, expanded: boolean): Array<{ name: string; count: number }> {
    return expanded ? items : items.slice(0, 5);
  }

  private normalizeGenre(genre: string): string {
    return genre.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  }

  private stringSimilarity(a: string, b: string): number {
    const normalizedA = this.normalizeGenre(a);
    const normalizedB = this.normalizeGenre(b);

    if (normalizedA === normalizedB) {
      return 1;
    }

    const len = Math.max(normalizedA.length, normalizedB.length);
    if (len === 0) {
      return 1;
    }

    const matrix: number[][] = Array.from({ length: normalizedB.length + 1 }, () => Array(normalizedA.length + 1).fill(0));

    for (let i = 0; i <= normalizedA.length; i += 1) matrix[0]![i] = i;
    for (let j = 0; j <= normalizedB.length; j += 1) matrix[j]![0] = j;

    for (let j = 1; j <= normalizedB.length; j += 1) {
      for (let i = 1; i <= normalizedA.length; i += 1) {
        const indicator = normalizedA[i - 1] === normalizedB[j - 1] ? 0 : 1;
        const left = matrix[j]?.[i - 1] ?? 0;
        const up = matrix[j - 1]?.[i] ?? 0;
        const diagonal = matrix[j - 1]?.[i - 1] ?? 0;
        matrix[j]![i] = Math.min(left + 1, up + 1, diagonal + indicator);
      }
    }

    return 1 - ((matrix[normalizedB.length]?.[normalizedA.length] ?? 0) / len);
  }

  private updateBooksPerStatus(): void {
    const width = this.document.defaultView?.innerWidth ?? 1024;
    this.booksPerStatus.set(width < 768 ? 3 : 4);
  }
}
