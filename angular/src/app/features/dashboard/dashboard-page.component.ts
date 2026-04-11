import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BookService } from '../../core/book/book.service';
import { Book } from '../../models/book.model';
import { QualityToolsService } from '../../core/quality/quality-tools.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
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
        <button type="button" data-testid="backup-download">Download backup</button>
        <button type="button" data-testid="backup-restore">Restore backup</button>
        <button type="button" data-testid="genre-consolidation" (click)="showGenreConsolidationHelp()">Genre consolidation</button>
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

  readonly books = this.bookService.books;
  readonly totalSaved = computed(() => this.books().length);
  readonly averageScore = computed(() => this.bookService.averageScore());
  readonly waitingCount = computed(() => this.books().filter((book) => book.status === 'waiting').length);
  readonly scoreTenCount = computed(() => this.books().filter((book) => book.score === 10).length);

  readonly showAllGenres = signal(false);
  readonly showAllSources = signal(false);
  readonly qualityMessage = signal('');

  readonly genreBreakdown = computed(() => this.buildTopBreakdown(this.collectGenres(this.books())));
  readonly sourceBreakdown = computed(() => this.buildTopBreakdown(this.collectSources(this.books())));
  readonly statusBreakdown = computed(() => this.buildTopBreakdown(this.collectStatuses(this.books()), false));

  readonly visibleGenres = computed(() => this.sliceBreakdown(this.genreBreakdown(), this.showAllGenres()));
  readonly visibleSources = computed(() => this.sliceBreakdown(this.sourceBreakdown(), this.showAllSources()));
  readonly visibleStatuses = computed(() => this.statusBreakdown());

  readonly hasMoreGenres = computed(() => this.genreBreakdown().length > 5);
  readonly hasMoreSources = computed(() => this.sourceBreakdown().length > 5);

  toggleGenres(): void {
    this.showAllGenres.update((value) => !value);
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
    this.qualityMessage.set(`External covers: ${result.externalCount}`);
  }

  showGenreConsolidationHelp(): void {
    this.qualityMessage.set('Genre consolidation requires an explicit confirmation step in the quality tools service.');
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
}
