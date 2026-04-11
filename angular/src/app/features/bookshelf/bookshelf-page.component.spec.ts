import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookshelfPageComponent } from './bookshelf-page.component';
import { BookshelfFilterService } from './bookshelf-filter.service';

describe('BookshelfPageComponent', () => {
  it('renders loading state while library is loading', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([]),
            isLoading: signal(true),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal(''),
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(null),
            chapterMax: signal(null),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading library');
  });

  it('renders error message when read pipeline fails', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([]),
            isLoading: signal(false),
            errorMessage: signal('Cannot load books'),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal(''),
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(null),
            chapterMax: signal(null),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cannot load books');
  });

  it('renders empty state when no books exist', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal(''),
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(null),
            chapterMax: signal(null),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No books yet');
  });

  it('renders bookshelf content with shelf count and book titles', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Book A',
                description: '',
                score: 8,
                status: 'reading',
                genres: ['action'],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([{ id: 's1' }]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(1),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal(''),
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(null),
            chapterMax: signal(null),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Shelves: 1');
    expect(fixture.nativeElement.textContent).toContain('Book A');
  });

  it('renders filter controls and updates through BookshelfFilterService only', async () => {
    const updateFilter = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Book A',
                description: '',
                score: 8,
                status: 'reading',
                genres: ['action'],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal(''),
            sort: signal('title'),
            sortDir: signal('asc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(null),
            chapterMax: signal(null),
            page: signal(1),
            pageSize: signal(20),
            updateFilter,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    const searchInput = fixture.debugElement.query(By.css('[data-testid="search-input"]')).nativeElement as HTMLInputElement;
    searchInput.value = 'Solo';
    searchInput.dispatchEvent(new Event('input'));

    expect(updateFilter).toHaveBeenCalledWith('search', 'Solo');
  });

  it('applies filter + sort semantics and paginates 20 per page', () => {
    const books = Array.from({ length: 25 }, (_, index) => ({
      id: `book-${index + 1}`,
      userId: 'user-1',
      title: index === 0 ? 'Solo Epic' : `Book ${index + 1}`,
      description: index === 0 ? 'has keyword' : '',
      score: index,
      status: index % 2 === 0 ? 'reading' : 'completed',
      genres: index % 2 === 0 ? ['action'] : ['drama'],
      language: index % 2 === 0 ? 'en' : 'jp',
      chapterCount: index + 1,
      coverUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date(`2026-01-${String((index % 9) + 1).padStart(2, '0')}T00:00:00.000Z`),
    }));

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal(books),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal('solo'),
            sort: signal('score'),
            sortDir: signal('desc'),
            language: signal('en'),
            genres: signal(['action']),
            chapterMin: signal(1),
            chapterMax: signal(100),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Solo Epic');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 1');
  });

  it('stores selected anchor and scroll memory when opening details from a book card', () => {
    const rememberAnchor = jest.fn();
    const rememberScroll = jest.fn();

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Book A',
                description: '',
                score: 8,
                status: 'reading',
                genres: ['action'],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        {
          provide: ShelfService,
          useValue: {
            shelves: signal([]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
          },
        },
        {
          provide: BookshelfFilterService,
          useValue: {
            search: signal(''),
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(null),
            chapterMax: signal(null),
            page: signal(1),
            pageSize: signal(20),
            selectedAnchor: signal(null),
            scrollY: signal(0),
            updateFilter: jest.fn().mockResolvedValue(undefined),
            rememberAnchor,
            rememberScroll,
          },
        },
      ],
    });

    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    const detailLink = fixture.debugElement.query(By.css('[data-testid="book-detail-link"]')).nativeElement as HTMLAnchorElement;
    detailLink.click();

    expect(rememberAnchor).toHaveBeenCalledWith('book-1');
    expect(rememberScroll).toHaveBeenCalledWith(250);
  });
});