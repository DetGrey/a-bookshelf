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
      genres: 'action,fantasy',
      chapterMin: '10',
      chapterMax: '50',
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
    expect(service.genres()).toEqual(['action', 'fantasy']);
    expect(service.chapterMin()).toBe(10);
    expect(service.chapterMax()).toBe(50);
    expect(service.page()).toBe(3);
  });

  it('updateFilter navigates with merged query params and resets page except when page is updated', async () => {
    const navigate = jest.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        BookshelfFilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: createQueryParamMap({ page: '4', sort: 'title' }) },
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
      queryParamsHandling: 'merge',
    });

    await service.updateFilter('page', 2);

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: expect.objectContaining({ page: 2 }),
      queryParamsHandling: 'merge',
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
          useValue: {
            navigate: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    });

    const service = TestBed.inject(BookshelfFilterService);
    service.rememberAnchor('book-99');
    service.rememberScroll(420);

    expect(service.selectedAnchor()).toBe('book-99');
    expect(service.scrollY()).toBe(420);

    const secondService = TestBed.inject(BookshelfFilterService);

    expect(secondService.selectedAnchor()).toBe('book-99');
    expect(secondService.scrollY()).toBe(420);
  });
});