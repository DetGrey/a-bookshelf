import { inject, Injectable } from '@angular/core';
import { Book } from '../../models/book.model';
import { BookService } from '../book/book.service';
import { BookRepository } from '../book/book.repository';
import { AuthService } from '../auth/auth.service';
import { ErrorCode, Result } from '../../models/result.model';
import { buildCloudflareImageProxyUrl } from '../../shared/utils/image-proxy';

export interface DuplicateTitleGroup {
  title: string;
  normalizedTitle: string;
  books: string[];
  count: number;
}

export interface DuplicateTitleScanResult {
  groups: DuplicateTitleGroup[];
  duplicateCount: number;
}

export interface StaleWaitingGroup {
  label: string;
  books: string[];
  count: number;
  oldestDays: number;
}

export interface StaleWaitingScanResult {
  groups: StaleWaitingGroup[];
  staleCount: number;
  thresholdDays: number;
}

export interface CoverHealthIssue {
  bookId: string;
  title: string;
  status: 'missing' | 'external' | 'proxied';
  currentUrl: string | null;
  suggestedUrl: string | null;
}

export interface CoverHealthScanResult {
  issues: CoverHealthIssue[];
  missingCount: number;
  externalCount: number;
  proxiedCount: number;
}

export interface CoverRepairSummary {
  repairedCount: number;
  skippedCount: number;
  issues: CoverHealthIssue[];
}

export interface GenreConsolidationSummary {
  updatedCount: number;
  targetGenre: string;
  sourceGenres: string[];
  mode: 'merge' | 'replace';
}

@Injectable({ providedIn: 'root' })
export class QualityToolsService {
  private readonly bookService = inject(BookService);
  private readonly repository = inject(BookRepository, { optional: true });
  private readonly auth = inject(AuthService, { optional: true });
  private duplicateCacheKey: string | null = null;
  private duplicateCache: DuplicateTitleScanResult | null = null;
  private staleCacheKey: string | null = null;
  private staleCache: StaleWaitingScanResult | null = null;
  private coverCacheKey: string | null = null;
  private coverCache: CoverHealthScanResult | null = null;

  scanDuplicateTitles(): DuplicateTitleScanResult {
    const books = this.bookService.books();
    const cacheKey = this.buildCacheKey(books);

    if (this.duplicateCacheKey === cacheKey && this.duplicateCache) {
      return this.duplicateCache;
    }

    const groupsByTitle = new Map<string, DuplicateTitleGroup>();

    books.forEach((book) => {
      const normalizedTitle = this.normalizeTitle(book.title);
      if (!normalizedTitle) {
        return;
      }

      const existing = groupsByTitle.get(normalizedTitle);
      if (existing) {
        existing.books.push(book.id);
        existing.count += 1;
        return;
      }

      groupsByTitle.set(normalizedTitle, {
        title: book.title.trim(),
        normalizedTitle,
        books: [book.id],
        count: 1,
      });
    });

    const groups = [...groupsByTitle.values()]
      .filter((group) => group.count > 1)
      .sort((left, right) => left.title.localeCompare(right.title));

    const result: DuplicateTitleScanResult = {
      groups,
      duplicateCount: groups.length,
    };

    this.duplicateCacheKey = cacheKey;
    this.duplicateCache = result;

    return result;
  }

  scanStaleWaiting(thresholdDays = 30, referenceDate = new Date()): StaleWaitingScanResult {
    const books = this.bookService.books();
    const cacheKey = `${this.buildCacheKey(books)}::${thresholdDays}::${referenceDate.toISOString()}`;

    if (this.staleCacheKey === cacheKey && this.staleCache) {
      return this.staleCache;
    }

    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    const staleBooks = books.filter((book) => {
      if (book.status !== 'waiting') {
        return false;
      }

      const anchor = book.lastFetchedAt ?? book.updatedAt;
      const ageMs = referenceDate.getTime() - anchor.getTime();
      return ageMs >= thresholdMs;
    });

    if (staleBooks.length === 0) {
      const emptyResult: StaleWaitingScanResult = {
        groups: [],
        staleCount: 0,
        thresholdDays,
      };

      this.staleCacheKey = cacheKey;
      this.staleCache = emptyResult;
      return emptyResult;
    }

    const oldestDays = staleBooks.reduce((max, book) => {
      const anchor = book.lastFetchedAt ?? book.updatedAt;
      const ageDays = Math.floor((referenceDate.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000));
      return Math.max(max, ageDays);
    }, 0);

    const result: StaleWaitingScanResult = {
      groups: [
        {
          label: 'stale waiting',
          books: staleBooks.map((book) => book.id),
          count: staleBooks.length,
          oldestDays,
        },
      ],
      staleCount: staleBooks.length,
      thresholdDays,
    };

    this.staleCacheKey = cacheKey;
    this.staleCache = result;
    return result;
  }

  scanCoverHealth(): CoverHealthScanResult {
    const books = this.bookService.books();
    const cacheKey = this.buildCacheKey(books);

    if (this.coverCacheKey === cacheKey && this.coverCache) {
      return this.coverCache;
    }

    const issues: CoverHealthIssue[] = [];
    let missingCount = 0;
    let externalCount = 0;
    let proxiedCount = 0;

    books.forEach((book) => {
      const url = book.coverUrl?.trim() || null;
      if (!url) {
        missingCount += 1;
        issues.push({
          bookId: book.id,
          title: book.title,
          status: 'missing',
          currentUrl: null,
          suggestedUrl: null,
        });
        return;
      }

      if (url.startsWith('/cdn-cgi/image/')) {
        proxiedCount += 1;
        issues.push({
          bookId: book.id,
          title: book.title,
          status: 'proxied',
          currentUrl: url,
          suggestedUrl: url,
        });
        return;
      }

      externalCount += 1;
      issues.push({
        bookId: book.id,
        title: book.title,
        status: 'external',
        currentUrl: url,
        suggestedUrl: buildCloudflareImageProxyUrl(url),
      });
    });

    const result: CoverHealthScanResult = {
      issues,
      missingCount,
      externalCount,
      proxiedCount,
    };

    this.coverCacheKey = cacheKey;
    this.coverCache = result;
    return result;
  }

  async repairExternalCovers(confirm: boolean): Promise<Result<CoverRepairSummary>> {
    if (!confirm) {
      return {
        success: false,
        error: {
          code: ErrorCode.Validation,
          message: 'Cover repair must be confirmed before changes are applied.',
        },
      };
    }

    if (!this.repository || !this.auth) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unknown,
          message: 'Repair is unavailable in the current context.',
        },
      };
    }

    const user = this.auth.currentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to repair covers.',
        },
      };
    }

    const scan = this.scanCoverHealth();
    const repairTargets = scan.issues.filter((issue) => issue.status === 'external' && issue.suggestedUrl);

    let repairedCount = 0;
    let skippedCount = scan.issues.length - repairTargets.length;

    for (const issue of repairTargets) {
      const updateResult = await this.repository.update(user.id, issue.bookId, {
        cover_url: issue.suggestedUrl,
      });

      if (!updateResult.success) {
        skippedCount += 1;
        continue;
      }

      repairedCount += 1;
      this.bookService.books.update((books) => books.map((book) => (
        book.id === issue.bookId
          ? { ...book, coverUrl: issue.suggestedUrl ?? book.coverUrl }
          : book
      )));
    }

    return {
      success: true,
      data: {
        repairedCount,
        skippedCount,
        issues: scan.issues,
      },
    };
  }

  async consolidateGenres(
    sourceGenres: readonly string[],
    targetGenre: string,
    confirm: boolean,
    mode: 'merge' | 'replace',
  ): Promise<Result<GenreConsolidationSummary>> {
    if (!confirm) {
      return {
        success: false,
        error: {
          code: ErrorCode.Validation,
          message: 'Genre consolidation must be confirmed before changes are applied.',
        },
      };
    }

    if (!this.repository || !this.auth) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unknown,
          message: 'Genre consolidation is unavailable in the current context.',
        },
      };
    }

    const user = this.auth.currentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to consolidate genres.',
        },
      };
    }

    const normalizedSources = sourceGenres.map((genre) => this.normalizeGenre(genre)).filter(Boolean);
    const normalizedTarget = this.normalizeGenre(targetGenre);

    if (!normalizedTarget || normalizedSources.length === 0) {
      return {
        success: false,
        error: {
          code: ErrorCode.Validation,
          message: 'Genre consolidation requires at least one source genre and a target genre.',
        },
      };
    }

    const books = this.bookService.books();
    const affectedBooks = books.filter((book) =>
      book.genres.some((genre) => normalizedSources.includes(this.normalizeGenre(genre))),
    );

    let updatedCount = 0;

    for (const book of affectedBooks) {
      const nextGenres = this.consolidateBookGenres(book.genres, normalizedSources, normalizedTarget, mode);
      if (this.sameGenres(book.genres, nextGenres)) {
        continue;
      }

      const updateResult = await this.repository.update(user.id, book.id, { genres: nextGenres });
      if (!updateResult.success) {
        continue;
      }

      updatedCount += 1;
      this.bookService.books.update((existing) => existing.map((item) => (
        item.id === book.id ? { ...item, genres: nextGenres } : item
      )));
    }

    return {
      success: true,
      data: {
        updatedCount,
        targetGenre: normalizedTarget,
        sourceGenres: normalizedSources,
        mode,
      },
    };
  }

  private normalizeTitle(title: string): string {
    return title.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private buildCacheKey(books: readonly Book[]): string {
    return books
      .map((book) => [book.id, book.title, book.updatedAt.toISOString()].join('::'))
      .join('|');
  }

  private normalizeGenre(genre: string): string {
    return genre.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private consolidateBookGenres(
    currentGenres: readonly string[],
    sourceGenres: readonly string[],
    targetGenre: string,
    mode: 'merge' | 'replace',
  ): string[] {
    const sourceSet = new Set(sourceGenres.map((genre) => this.normalizeGenre(genre)));
    const nextGenres: string[] = [];

    currentGenres.forEach((genre) => {
      const normalized = this.normalizeGenre(genre);
      if (sourceSet.has(normalized)) {
        if (!nextGenres.includes(targetGenre)) {
          nextGenres.push(targetGenre);
        }
        return;
      }

      if (!nextGenres.includes(normalized)) {
        nextGenres.push(normalized);
      }
    });

    if (mode === 'merge' && !nextGenres.includes(targetGenre)) {
      nextGenres.push(targetGenre);
    }

    return nextGenres;
  }

  private sameGenres(left: readonly string[], right: readonly string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((genre, index) => this.normalizeGenre(genre) === this.normalizeGenre(right[index] ?? ''));
  }
}