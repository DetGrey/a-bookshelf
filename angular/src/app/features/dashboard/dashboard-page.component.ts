import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../core/book/book.service';
import { Book } from '../../models/book.model';
import { QualityToolsService, CoverHealthScanResult } from '../../core/quality/quality-tools.service';
import { BackupRestoreService } from '../../core/backup/backup-restore.service';
import { BookGridComponent } from '../../shared/components/book-grid/book-grid.component';
import { fromEvent } from 'rxjs';

type ConsolidationStep = 'idle' | 'selecting' | 'working';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [FormsModule, BookGridComponent],
  template: `
    <section class="dashboard-page">
      <h1>Dashboard</h1>

      <section class="dashboard-stats">
        <article>
          <h2>Total saved</h2>
          <p>{{ totalSaved() }}</p>
        </article>
        <article>
          <h2>Waiting</h2>
          <p>{{ waitingCount() }}</p>
        </article>
        <article>
          <h2>Average score</h2>
          <p>{{ averageScore() }}</p>
        </article>
        <article>
          <h2>Rated 10</h2>
          <p>{{ scoreTenCount() }}</p>
        </article>
        <article>
          <h2>Completed</h2>
          <p>{{ completedCount() }}</p>
        </article>
        <article>
          <h2>Last updated</h2>
          <p>{{ lastUpdatedTitle() }}</p>
        </article>
      </section>

      <section>
        <h2>Genre breakdown</h2>
        @for (item of visibleGenres(); track item.name) {
          <p>{{ item.name }} ({{ item.count }})</p>
        }
        @if (hasMoreGenres()) {
          <button type="button" data-testid="toggle-genres" (click)="toggleGenres()">
            {{ showAllGenres() ? 'Show top five' : 'Show all' }}
          </button>
        }
      </section>

      <section>
        <h2>Status breakdown</h2>
        @for (item of visibleStatuses(); track item.name) {
          <p>{{ item.name }} ({{ item.count }})</p>
        }
      </section>

      @for (section of statusSections(); track section.key) {
        @if (section.books.length > 0) {
          <section [attr.data-testid]="'status-section-' + section.key">
            <h2>{{ section.label }}</h2>
            <app-book-grid [books]="section.books" [compact]="true" (opened)="onOpenDetails($event)" />
          </section>
        }
      }

      <section>
        <h2>Source breakdown</h2>
        @for (item of visibleSources(); track item.name) {
          <p>{{ item.name }} ({{ item.count }})</p>
        }
        @if (hasMoreSources()) {
          <button type="button" data-testid="toggle-sources" (click)="toggleSources()">
            {{ showAllSources() ? 'Show top five' : 'Show all' }}
          </button>
        }
      </section>

      <section>
        <h2>Quality hub</h2>
        <button type="button" data-testid="duplicate-title-scanner" (click)="runDuplicateScan()">Duplicate title scanner</button>
        <button type="button" data-testid="stale-waiting-scanner" (click)="runStaleWaitingScan()">Stale waiting checker</button>

        <button type="button" data-testid="cover-checker" (click)="runCoverCheck()">Cover checker</button>
        @if (coverScanResult()?.externalCount) {
          <button
            type="button"
            data-testid="cover-repair"
            [disabled]="coverRepairRunning()"
            (click)="repairCovers()"
          >
            Repair {{ coverScanResult()!.externalCount }} external {{ coverScanResult()!.externalCount === 1 ? 'cover' : 'covers' }}
          </button>
        }

        <button type="button" data-testid="backup-download" (click)="downloadBackup()">Download backup</button>
        <button type="button" data-testid="backup-restore" (click)="restoreInput.click()">Restore backup</button>
        <input
          #restoreInput
          data-testid="backup-restore-input"
          type="file"
          accept="application/json"
          hidden
          (change)="onBackupFileSelected($event)"
        />

        @if (consolidationStep() === 'idle') {
          <button type="button" data-testid="genre-consolidation" (click)="startGenreConsolidation()">Genre consolidation</button>
        } @else if (consolidationStep() === 'selecting') {
          <div data-testid="genre-consolidation-panel">
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
            <button
              type="button"
              data-testid="consolidation-confirm"
              [disabled]="selectedSourceGenres().length === 0 || !consolidationTarget"
              (click)="confirmGenreConsolidation()"
            >
              Consolidate {{ selectedSourceGenres().length }} genre(s) → {{ consolidationTarget || '…' }}
            </button>
            <button type="button" data-testid="consolidation-cancel" (click)="cancelGenreConsolidation()">Cancel</button>
          </div>
        } @else if (consolidationStep() === 'working') {
          <p>Consolidating genres…</p>
        }

        @if (qualityMessage()) {
          <p>{{ qualityMessage() }}</p>
        }
      </section>
    </section>
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
  readonly qualityMessage = signal('');
  readonly coverScanResult = signal<CoverHealthScanResult | null>(null);
  readonly coverRepairRunning = signal(false);
  readonly consolidationStep = signal<ConsolidationStep>('idle');
  readonly selectedSourceGenres = signal<string[]>([]);

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
  readonly statusBreakdown = computed(() => this.buildTopBreakdown(this.collectStatuses(this.books()), false));

  readonly visibleGenres = computed(() => this.sliceBreakdown(this.genreBreakdown(), this.showAllGenres()));
  readonly visibleSources = computed(() => this.sliceBreakdown(this.sourceBreakdown(), this.showAllSources()));
  readonly visibleStatuses = computed(() => this.statusBreakdown());

  readonly hasMoreGenres = computed(() => this.genreBreakdown().length > 5);
  readonly hasMoreSources = computed(() => this.sourceBreakdown().length > 5);
  readonly statusSections = computed(() => this.sectionStatuses.map((section) => ({
    ...section,
    books: [...this.books()]
      .filter((book) => book.status === section.key)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, this.booksPerStatus()),
  })));

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

  runDuplicateScan(): void {
    const result = this.qualityTools.scanDuplicateTitles();
    this.qualityMessage.set(`Duplicate groups: ${result.duplicateCount}`);
  }

  runStaleWaitingScan(): void {
    const result = this.qualityTools.scanStaleWaiting();
    this.qualityMessage.set(`Stale waiting books: ${result.staleCount}`);
  }

  runCoverCheck(): void {
    const result = this.qualityTools.scanCoverHealth();
    this.coverScanResult.set(result);
    this.qualityMessage.set(
      `Missing: ${result.missingCount}, External: ${result.externalCount}, Proxied: ${result.proxiedCount}`,
    );
  }

  async repairCovers(): Promise<void> {
    this.coverRepairRunning.set(true);
    const result = await this.qualityTools.repairExternalCovers(true);
    this.coverRepairRunning.set(false);
    this.coverScanResult.set(null);

    if (!result.success) {
      this.qualityMessage.set(`Cover repair failed: ${result.error.message}`);
      return;
    }

    this.qualityMessage.set(
      `Cover repair complete. Repaired: ${result.data.repairedCount}, Skipped: ${result.data.skippedCount}`,
    );
  }

  startGenreConsolidation(): void {
    this.selectedSourceGenres.set([]);
    this.consolidationTarget = '';
    this.consolidationMode = 'merge';
    this.qualityMessage.set('');
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
      this.qualityMessage.set(`Genre consolidation failed: ${result.error.message}`);
      return;
    }

    this.qualityMessage.set(
      `Genre consolidation complete. Updated ${result.data.updatedCount} book(s). "${sources.join(', ')}" → "${result.data.targetGenre}"`,
    );
  }

  cancelGenreConsolidation(): void {
    this.consolidationStep.set('idle');
    this.selectedSourceGenres.set([]);
    this.qualityMessage.set('');
  }

  async downloadBackup(): Promise<void> {
    const result = await this.backupRestore.exportLibrary();
    if (!result.success) {
      this.qualityMessage.set(`Backup export failed: ${result.error.message}`);
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
    this.qualityMessage.set('Backup exported.');
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
        this.qualityMessage.set(`Restore failed: ${result.error.message}`);
        return;
      }

      this.qualityMessage.set(`Restore complete. Books: ${result.data.booksUpserted}, shelves: ${result.data.shelvesUpserted}`);
    } catch (error) {
      this.qualityMessage.set('Restore failed: invalid JSON backup file.');
    }
  }

  private collectGenres(books: readonly Book[]): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    books.forEach((book) => {
      book.genres.forEach((genre) => {
        const key = genre.trim();
        if (!key) return;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }

  private collectStatuses(books: readonly Book[]): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    books.forEach((book) => {
      counts.set(book.status, (counts.get(book.status) ?? 0) + 1);
    });
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }

  private collectSources(books: readonly Book[]): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();

    books.forEach((book) => {
      const sourceHosts = this.extractSourceHosts(book);
      sourceHosts.forEach((host) => {
        if (!host) return;
        counts.set(host, (counts.get(host) ?? 0) + 1);
      });
    });

    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }

  private extractSourceHosts(book: Book): string[] {
    const value = book as Book & { sourceHosts?: string[]; sourceUrls?: string[] };
    return value.sourceHosts ?? value.sourceUrls?.map((url) => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    }) ?? [];
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
