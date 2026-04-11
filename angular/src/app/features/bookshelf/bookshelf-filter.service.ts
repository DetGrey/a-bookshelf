import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

type SortKey = 'title' | 'updatedAt' | 'createdAt' | 'score' | 'chapterCount' | 'status';
type SortDir = 'asc' | 'desc';
type FilterKey = 'search' | 'sort' | 'sortDir' | 'language' | 'genres' | 'chapterMin' | 'chapterMax' | 'page';

@Injectable({ providedIn: 'root' })
export class BookshelfFilterService {
  private static readonly SCROLL_KEY = 'bookshelf.scrollY';
  private static readonly ANCHOR_KEY = 'bookshelf.anchorId';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly search = signal('');
  readonly sort = signal<SortKey>('updatedAt');
  readonly sortDir = signal<SortDir>('desc');
  readonly language = signal('');
  readonly genres = signal<string[]>([]);
  readonly chapterMin = signal<number | null>(null);
  readonly chapterMax = signal<number | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly scrollY = signal(0);
  readonly selectedAnchor = signal<string | null>(null);

  constructor() {
    this.applyParams(this.route.snapshot.queryParams ?? {});
    this.restoreMemory();

    this.route.queryParams.subscribe((params) => {
      this.applyParams(params);
    });
  }

  async updateFilter(key: FilterKey, value: string | string[] | number | null): Promise<void> {
    const queryParams: Params = {};

    switch (key) {
      case 'search':
        queryParams['q'] = value || null;
        queryParams['page'] = 1;
        break;
      case 'sort':
        queryParams['sort'] = value || null;
        queryParams['page'] = 1;
        break;
      case 'sortDir':
        queryParams['dir'] = value || null;
        queryParams['page'] = 1;
        break;
      case 'language':
        queryParams['lang'] = value || null;
        queryParams['page'] = 1;
        break;
      case 'genres':
        queryParams['genres'] = Array.isArray(value) ? value.join(',') : null;
        queryParams['page'] = 1;
        break;
      case 'chapterMin':
        queryParams['chapterMin'] = value ?? null;
        queryParams['page'] = 1;
        break;
      case 'chapterMax':
        queryParams['chapterMax'] = value ?? null;
        queryParams['page'] = 1;
        break;
      case 'page':
        queryParams['page'] = value ?? 1;
        break;
    }

    await this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  rememberScroll(position: number): void {
    const normalized = Number.isFinite(position) ? Math.max(0, Math.floor(position)) : 0;
    this.scrollY.set(normalized);
    sessionStorage.setItem(BookshelfFilterService.SCROLL_KEY, String(normalized));
  }

  rememberAnchor(anchorId: string | null): void {
    this.selectedAnchor.set(anchorId);

    if (anchorId) {
      sessionStorage.setItem(BookshelfFilterService.ANCHOR_KEY, anchorId);
      return;
    }

    sessionStorage.removeItem(BookshelfFilterService.ANCHOR_KEY);
  }

  private applyParams(params: Params): void {
    this.search.set((params['q'] as string | undefined) ?? '');
    this.sort.set(this.asSort((params['sort'] as string | undefined) ?? 'updatedAt'));
    this.sortDir.set(this.asSortDir((params['dir'] as string | undefined) ?? 'desc'));
    this.language.set((params['lang'] as string | undefined) ?? '');
    this.genres.set(this.parseList((params['genres'] as string | undefined) ?? ''));
    this.chapterMin.set(this.parseNumber(params['chapterMin']));
    this.chapterMax.set(this.parseNumber(params['chapterMax']));
    this.page.set(this.parsePage(params['page']));
  }

  private restoreMemory(): void {
    const savedScroll = this.parseNumber(sessionStorage.getItem(BookshelfFilterService.SCROLL_KEY));
    this.scrollY.set(savedScroll ?? 0);

    const savedAnchor = sessionStorage.getItem(BookshelfFilterService.ANCHOR_KEY);
    this.selectedAnchor.set(savedAnchor || null);
  }

  private parseList(value: string): string[] {
    if (!value) {
      return [];
    }

    return value.split(',').map((part) => part.trim()).filter(Boolean);
  }

  private parseNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parsePage(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }

  private asSort(value: string): SortKey {
    if (['title', 'updatedAt', 'createdAt', 'score', 'chapterCount', 'status'].includes(value)) {
      return value as SortKey;
    }

    return 'updatedAt';
  }

  private asSortDir(value: string): SortDir {
    return value === 'asc' ? 'asc' : 'desc';
  }
}