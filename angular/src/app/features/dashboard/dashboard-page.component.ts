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
                  <button type="button" class="ghost quality-check-button" data-testid="genre-consolidation" (click)="startGenreConsolidation()">Find similar genres</button>
                }
              </div>

              @if (genreMessage()) {
                <p class="muted m-0">{{ genreMessage() }}</p>
              }

              @if (consolidationStep() === 'selecting') {
                <div class="genre-consolidation-panel" data-testid="genre-consolidation-panel">
                  <h3>Select source genres</h3>
                  <ul>
                    @for (item of genreBreakdown(); track item.name) {
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            [checked]="isSourceGenreSelected(item.name)"
                            (change)="toggleSourceGenre(item.name)"
                          />
                          {{ item.name }} ({{ item.count }})
                        </label>
                      </li>
                    }
                  </ul>
                  <input
                    data-testid="consolidation-target-input"
                    [(ngModel)]="consolidationTarget"
                    name="consolidationTarget"
                    placeholder="Target genre"
                  />
                  <select data-testid="consolidation-mode-select" [(ngModel)]="consolidationMode" name="consolidationMode">
                    <option value="merge">Merge — add target, keep other genres</option>
                    <option value="replace">Replace — replace all source genres with target</option>
                  </select>
                  <div class="genre-consolidation-actions">
                    <button
                      type="button"
                      class="primary quality-check-button"
                      data-testid="consolidation-confirm"
                      [disabled]="selectedSourceGenres().length === 0 || !consolidationTarget"
                      (click)="confirmGenreConsolidation()"
                    >
                      Consolidate {{ selectedSourceGenres().length }} genre(s) → {{ consolidationTarget || '…' }}
                    </button>
                    <button type="button" class="ghost quality-check-button" data-testid="consolidation-cancel" (click)="cancelGenreConsolidation()">Cancel</button>
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
  readonly selectedSourceGenres = signal<string[]>([]);
  readonly breakdownPalette = ['#7c83ff', '#ff8ba7', '#22c55e', '#f6aa1c', '#4cc9f0', '#a855f7', '#ef4444', '#0ea5e9'];

  readonly sectionStatuses = [
    { key: 'reading', label: 'Reading' },
    { key: 'plan_to_read', label: 'Plan to Read' },
    { key: 'waiting', label: 'Waiting' },
    { key: 'completed', label: 'Completed' },
  ] as const;

  consolidationTarget = '';
  consolidationMode: 'merge' | 'replace' = 'merge';

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

  startGenreConsolidation(): void {
    this.selectedSourceGenres.set([]);
    this.consolidationTarget = '';
    this.consolidationMode = 'merge';
    this.genreMessage.set('');
    this.consolidationStep.set('selecting');
  }

  isSourceGenreSelected(genre: string): boolean {
    return this.selectedSourceGenres().includes(genre);
  }

  toggleSourceGenre(genre: string): void {
    const current = this.selectedSourceGenres();
    if (current.includes(genre)) {
      this.selectedSourceGenres.set(current.filter((g) => g !== genre));
    } else {
      this.selectedSourceGenres.set([...current, genre]);
    }
  }

  async confirmGenreConsolidation(): Promise<void> {
    const sources = this.selectedSourceGenres();
    const target = this.consolidationTarget.trim();

    if (sources.length === 0 || !target) {
      return;
    }

    this.consolidationStep.set('working');
    const result = await this.qualityTools.consolidateGenres(sources, target, true, this.consolidationMode);
    this.consolidationStep.set('idle');

    if (!result.success) {
      this.genreMessage.set(`Genre consolidation failed: ${result.error.message}`);
      return;
    }

    this.genreMessage.set(
      `Genre consolidation complete. Updated ${result.data.updatedCount} book(s). "${sources.join(', ')}" → "${result.data.targetGenre}"`,
    );
  }

  cancelGenreConsolidation(): void {
    this.consolidationStep.set('idle');
    this.selectedSourceGenres.set([]);
    this.genreMessage.set('');
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

  private updateBooksPerStatus(): void {
    const width = this.document.defaultView?.innerWidth ?? 1024;
    this.booksPerStatus.set(width < 768 ? 3 : 4);
  }
}
