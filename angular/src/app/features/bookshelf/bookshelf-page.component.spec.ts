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

  it('renders built-in and custom shelves with counts in sidebar', () => {
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
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Book B',
                description: '',
                score: 7,
                status: 'completed',
                genres: ['drama'],
                language: 'en',
                chapterCount: 30,
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
            shelves: signal([
              {
                id: 's1',
                userId: 'user-1',
                name: 'Favorites',
                bookCount: 1,
                bookIds: ['book-1'],
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
              },
            ]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(1),
            loadShelves: jest.fn(),
            createShelf: jest.fn(),
            deleteShelf: jest.fn(),
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
            shelf: signal('all'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reading (1)');
    expect(fixture.nativeElement.textContent).toContain('Completed (1)');
    expect(fixture.nativeElement.textContent).toContain('Favorites (1)');
  });

  it('updates shelf filter through BookshelfFilterService when selecting sidebar shelf', () => {
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
            createShelf: jest.fn(),
            deleteShelf: jest.fn(),
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
            shelf: signal('all'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    const readingButton = fixture.debugElement.query(By.css('[data-testid="shelf-status-reading"]')).nativeElement as HTMLButtonElement;
    readingButton.click();

    expect(updateFilter).toHaveBeenCalledWith('shelf', 'status:reading');
  });

  it('creates and deletes custom shelves through ShelfService actions', async () => {
    const createShelf = jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 's2',
        userId: 'user-1',
        name: 'Weekend Reads',
        bookCount: 0,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });
    const deleteShelf = jest.fn().mockResolvedValue({ success: true, data: undefined });

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
            shelves: signal([
              {
                id: 's1',
                userId: 'user-1',
                name: 'Favorites',
                bookCount: 1,
                bookIds: ['book-1'],
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
              },
            ]),
            isLoading: signal(false),
            errorMessage: signal(null),
            shelfCount: signal(1),
            loadShelves: jest.fn(),
            createShelf,
            deleteShelf,
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
            shelf: signal('all'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.newShelfName = 'Weekend Reads';
    fixture.detectChanges();

    const createButton = fixture.debugElement.query(By.css('[data-testid="create-shelf-button"]')).nativeElement as HTMLButtonElement;
    createButton.click();
    fixture.detectChanges();

    await Promise.resolve();
    expect(createShelf).toHaveBeenCalledWith('Weekend Reads');

    const deleteButton = fixture.debugElement.query(By.css('[data-testid="delete-shelf-s1"]')).nativeElement as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    await Promise.resolve();
    expect(deleteShelf).toHaveBeenCalledWith('s1');
  });

  it('applies selected status shelf before other filters', () => {
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
                title: 'Reading Title',
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
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Completed Title',
                description: '',
                score: 7,
                status: 'completed',
                genres: ['drama'],
                language: 'en',
                chapterCount: 30,
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
            createShelf: jest.fn(),
            deleteShelf: jest.fn(),
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
            shelf: signal('status:completed'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Completed Title');
    expect(fixture.nativeElement.textContent).not.toContain('Reading Title');
  });

  it('shows actionable shelf error message without hiding current bookshelf content', () => {
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
            errorMessage: signal('Could not create shelf. db unavailable'),
            shelfCount: signal(0),
            loadShelves: jest.fn(),
            createShelf: jest.fn(),
            deleteShelf: jest.fn(),
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
            shelf: signal('all'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not create shelf. db unavailable');
    expect(fixture.nativeElement.textContent).toContain('Book A');
  });

  it('shows waiting-update batch action only in waiting shelf context', () => {
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
                status: 'waiting',
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
            runWaitingShelfLatestUpdates: jest.fn(),
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
            createShelf: jest.fn(),
            deleteShelf: jest.fn(),
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
            shelf: signal('status:waiting'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="waiting-updates-button"]'))).not.toBeNull();

    const filter = TestBed.inject(BookshelfFilterService) as unknown as {
      shelf: ReturnType<typeof signal<string>>;
    };
    filter.shelf.set('status:reading');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="waiting-updates-button"]'))).toBeNull();
  });

  it('renders waiting update progress and summary with error details', async () => {
    const runWaitingShelfLatestUpdates = jest.fn().mockImplementation(async (_books, options) => {
      options.onProgress({
        processed: 1,
        total: 2,
        updated: 1,
        skipped: 0,
        errors: 0,
      });

      return {
        success: true,
        data: {
          updatedCount: 1,
          skippedCount: 0,
          errorCount: 1,
          outcomes: [
            {
              bookId: 'book-2',
              title: 'Book B',
              status: 'error',
              detail: 'Timeout while fetching latest chapter.',
            },
          ],
        },
      };
    });

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
                status: 'waiting',
                genres: ['action'],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Book B',
                description: '',
                score: 8,
                status: 'waiting',
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
            runWaitingShelfLatestUpdates,
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
            createShelf: jest.fn(),
            deleteShelf: jest.fn(),
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
            shelf: signal('status:waiting'),
            page: signal(1),
            pageSize: signal(20),
            updateFilter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('[data-testid="waiting-updates-button"]')).nativeElement as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(runWaitingShelfLatestUpdates).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Progress: 1 / 2');
    expect(fixture.nativeElement.textContent).toContain('Updated: 1');
    expect(fixture.nativeElement.textContent).toContain('Skipped: 0');
    expect(fixture.nativeElement.textContent).toContain('Errors: 1');
    expect(fixture.nativeElement.textContent).toContain('Timeout while fetching latest chapter.');
  });

  it('adds a genre tag via the Add button and calls updateFilter with the combined list', () => {
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
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
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

    const genreInput = fixture.debugElement.query(By.css('[data-testid="genre-input"]')).nativeElement as HTMLInputElement;
    genreInput.value = 'fantasy';
    genreInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const addButton = fixture.debugElement.query(By.css('[data-testid="add-genre-button"]')).nativeElement as HTMLButtonElement;
    addButton.click();

    expect(updateFilter).toHaveBeenCalledWith('genres', ['fantasy']);
  });

  it('adds a genre tag via the Enter key and calls updateFilter', () => {
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
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
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

    const genreInput = fixture.debugElement.query(By.css('[data-testid="genre-input"]')).nativeElement as HTMLInputElement;
    genreInput.value = 'drama';
    genreInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    genreInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(updateFilter).toHaveBeenCalledWith('genres', ['drama']);
  });

  it('removes a genre tag when × is clicked and calls updateFilter without that genre', () => {
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
                genres: ['action', 'drama'],
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
            genres: signal(['action', 'drama']),
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

    const removeButton = fixture.debugElement.query(By.css('[data-testid="remove-genre-action"]')).nativeElement as HTMLButtonElement;
    removeButton.click();

    expect(updateFilter).toHaveBeenCalledWith('genres', ['drama']);
  });

  it('updates the chapterMin filter when the min input changes', () => {
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
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
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

    const minInput = fixture.debugElement.query(By.css('[data-testid="chapter-min-input"]')).nativeElement as HTMLInputElement;
    minInput.value = '5';
    minInput.dispatchEvent(new Event('input'));

    expect(updateFilter).toHaveBeenCalledWith('chapterMin', 5);
  });

  it('updates the chapterMax filter when the max input changes', () => {
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
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
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

    const maxInput = fixture.debugElement.query(By.css('[data-testid="chapter-max-input"]')).nativeElement as HTMLInputElement;
    maxInput.value = '100';
    maxInput.dispatchEvent(new Event('input'));

    expect(updateFilter).toHaveBeenCalledWith('chapterMax', 100);
  });

  it('clears chapterMin filter when the min input is cleared', () => {
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
            sort: signal('updatedAt'),
            sortDir: signal('desc'),
            language: signal(''),
            genres: signal([]),
            chapterMin: signal(5),
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

    const minInput = fixture.debugElement.query(By.css('[data-testid="chapter-min-input"]')).nativeElement as HTMLInputElement;
    minInput.value = '';
    minInput.dispatchEvent(new Event('input'));

    expect(updateFilter).toHaveBeenCalledWith('chapterMin', null);
  });
});