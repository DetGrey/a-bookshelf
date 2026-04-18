import { Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


export type SortOption = 'title' | 'score' | 'lastRead' | 'lastUploadedAt' | 'chapterCount' | 'status' | 'createdAt' | 'updatedAt' | 'relevance';
export type SortDirection = 'asc' | 'desc';
export type GenreMode = 'any' | 'all';
export type ChapterMode = 'min' | 'max';

@Injectable({ providedIn: 'root' })
export class BookshelfFilterService {
  readonly search = signal<string>('');
  readonly sort = signal<SortOption>('lastRead');
  readonly sortDir = signal<SortDirection>('desc');
  readonly language = signal<string | null>(null);
  readonly shelf = signal<string | null>('all');
  readonly genres = signal<string[]>([]);
  
  // Issue 018: New advanced filter properties
  readonly genreMode = signal<GenreMode>('all');
  readonly chapterValue = signal<number | null>(null);
  readonly chapterMode = signal<ChapterMode>('max');
  
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(20);
  
  readonly selectedAnchor = signal<string | null>(null);
  readonly scrollY = signal<number>(0);

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.search.set(params['q'] || '');
      
      const sortVal = params['sort'] as SortOption;
      this.sort.set(['title', 'score', 'lastRead', 'lastUploadedAt', 'chapterCount', 'status', 'createdAt', 'updatedAt', 'relevance'].includes(sortVal) ? sortVal : 'updatedAt');

      this.sortDir.set(params['dir'] === 'asc' ? 'asc' : 'desc');
      this.language.set(params['lang'] || null);
      this.shelf.set(params['shelf'] || 'all');
      this.genres.set(params['genres'] ? params['genres'].split(',') : []);
      
      // Issue 018: Read new query params
      this.genreMode.set(params['genreMode'] === 'any' ? 'any' : 'all');
      
      const cv = parseInt(params['chapterValue'], 10);
      this.chapterValue.set(isNaN(cv) ? null : cv);
      
      this.chapterMode.set(params['chapterMode'] === 'min' ? 'min' : 'max');
      
      const pageVal = parseInt(params['page'], 10);
      this.page.set(isNaN(pageVal) || pageVal < 1 ? 1 : pageVal);
    });
  }

  async updateFilter(key: string, value: any): Promise<boolean> {
    const currentParams = { ...this.route.snapshot.queryParams };
    
    let queryKey = key;
    if (key === 'search') queryKey = 'q';
    if (key === 'sortDir') queryKey = 'dir';
    if (key === 'language') queryKey = 'lang';
    if (key === 'genres') {
        value = value && value.length ? value.join(',') : null;
    }

    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete currentParams[queryKey];
    } else {
      currentParams[queryKey] = value;
    }

    // Reset page to 1 on any filter change EXCEPT when explicitly changing the page
    if (key !== 'page') {
      currentParams['page'] = 1;
    }

    return this.router.navigate([], {
      queryParams: currentParams,
      queryParamsHandling: 'merge'
    });
  }

  rememberAnchor(id: string) {
    this.selectedAnchor.set(id);
  }

  rememberScroll(y: number) {
    this.scrollY.set(y);
  }
}