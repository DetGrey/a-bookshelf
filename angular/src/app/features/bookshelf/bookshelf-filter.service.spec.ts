import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BookshelfFilterService } from './bookshelf-filter.service';

describe('BookshelfFilterService', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const createQueryParamMap = (params: Params) => ({
    get: (key: string) => (params[key] ?? null),
  });

  it('derives typed filter and page state from query params', () => {
    const queryParams$ = new BehaviorSubject<Params>({
      q: 'solo',
      sort: 'score',
      dir: 'desc',
      lang: 'en',
      shelf: 'status:reading',
      genres: 'action,fantasy',
      genreMode: 'any',
      chapterValue: '50',
      chapterMode: 'min',
      page: '3',
    });

    TestBed.configureTestingModule({
      providers: [
        BookshelfFilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: createQueryParamMap(queryParams$.value) },
            queryParams: queryParams$.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    });

    const service = TestBed.inject(BookshelfFilterService);

    expect(service.search()).toBe('solo');
    expect(service.sort()).toBe('score');
    expect(service.sortDir()).toBe('desc');
    expect(service.language()).toBe('en');
    expect(service.shelf()).toBe('status:reading');
    expect(service.genres()).toEqual(['action', 'fantasy']);
    
    // NEW properties for ISSUE-018
    expect(service.genreMode()).toBe('any');
    expect(service.chapterValue()).toBe(50);
    expect(service.chapterMode()).toBe('min');
    expect(service.page()).toBe(3);

    // Old properties should be gone
    expect((service as any).chapterMin).toBeUndefined();
    expect((service as any).chapterMax).toBeUndefined();
  });

  it('applies default values for missing or invalid query params', () => {
    const queryParams$ = new BehaviorSubject<Params>({
      genreMode: 'invalid-mode',
      chapterMode: 'invalid-mode',
    });

    TestBed.configureTestingModule({
      providers: [
        BookshelfFilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: createQueryParamMap(queryParams$.value) },
            queryParams: queryParams$.asObservable(),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    });

    const service = TestBed.inject(BookshelfFilterService);
    
    // Invalid values should fallback to defaults
    expect(service.genreMode()).toBe('all');
    expect(service.chapterValue()).toBeNull();
    expect(service.chapterMode()).toBe('max');
    expect(service.shelf()).toBe('all');
  });

  it('updateFilter navigates with query params and resets page except when page is updated', async () => {
    const navigate = jest.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        BookshelfFilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: { page: '4', sort: 'title' } },
            queryParams: new BehaviorSubject<Params>({ page: '4', sort: 'title' }).asObservable(),
          },
        },
        {
          provide: Router,
          useValue: { navigate },
        },
      ],
    });

    const service = TestBed.inject(BookshelfFilterService);

    await service.updateFilter('search', 'new value');
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: expect.objectContaining({ q: 'new value', page: 1 }),
    });

    await service.updateFilter('genreMode', 'any');
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: expect.objectContaining({ genreMode: 'any', page: 1 }),
    });

    await service.updateFilter('chapterValue', 100);
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: expect.objectContaining({ chapterValue: 100, page: 1 }),
    });

    await service.updateFilter('page', 2);
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: expect.objectContaining({ page: 2 }),
    });
  });

  it('removes genres query param when last selected genre is cleared', async () => {
    const navigate = jest.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        BookshelfFilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: { genres: 'action', page: '3', sort: 'updatedAt' } },
            queryParams: new BehaviorSubject<Params>({ genres: 'action', page: '3', sort: 'updatedAt' }).asObservable(),
          },
        },
        {
          provide: Router,
          useValue: { navigate },
        },
      ],
    });

    const service = TestBed.inject(BookshelfFilterService);
    await service.updateFilter('genres', []);

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { page: 1, sort: 'updatedAt' },
    });
  });

  it('persists and restores scroll + selected anchor memory', () => {
    TestBed.configureTestingModule({
      providers: [
        BookshelfFilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: createQueryParamMap({}) },
            queryParams: new BehaviorSubject<Params>({}).asObservable(),
          },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn().mockResolvedValue(true) },
        },
      ],
    });

    const service = TestBed.inject(BookshelfFilterService);
    service.rememberAnchor('book-99');
    service.rememberScroll(420);

    expect(service.selectedAnchor()).toBe('book-99');
    expect(service.scrollY()).toBe(420);
  });
});