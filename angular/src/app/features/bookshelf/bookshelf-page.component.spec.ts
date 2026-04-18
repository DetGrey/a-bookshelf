import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookshelfPageComponent } from './bookshelf-page.component';
import { BookshelfFilterService } from './bookshelf-filter.service';

describe('BookshelfPageComponent', () => {
  // Helper to ensure ALL signals exist in every test mock, avoiding TypeErrors
  const createMockFilter = (overrides: any = {}) => {
    const base = {
      search: signal(''),
      sort: signal('updatedAt'),
      sortDir: signal('desc'),
      language: signal(''),
      genres: signal([]),
      genreMode: signal('all'), // Added for Issue 018
      chapterMin: signal(null),
      chapterMax: signal(null),
      chapterValue: signal(null), // Added for Issue 018
      chapterMode: signal('max'), // Added for Issue 018
      shelf: signal('all'),
      page: signal(1),
      pageSize: signal(20),
      selectedAnchor: signal(null),
      scrollY: signal(0),
      updateFilter: jest.fn().mockResolvedValue(undefined),
      rememberAnchor: jest.fn(),
      rememberScroll: jest.fn(),
    };
    return { ...base, ...overrides };
  };

  it('renders loading state while library is loading', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([]), isLoading: signal(true), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
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
        { provide: BookService, useValue: { books: signal([]), isLoading: signal(false), errorMessage: signal('Cannot load books'), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
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
        { provide: BookService, useValue: { books: signal([]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
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
        { provide: BookService, useValue: { books: signal([{ id: 'book-1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([{ id: 's1' }]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(1), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
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
        { provide: BookService, useValue: { books: signal([{ id: 'book-1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ sort: signal('title'), sortDir: signal('asc'), updateFilter }) },
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
      id: `book-${index + 1}`, userId: 'u1', title: index === 0 ? 'Solo Epic' : `Book ${index + 1}`, description: index === 0 ? 'has keyword' : '', score: index, status: index % 2 === 0 ? 'reading' : 'completed', genres: index % 2 === 0 ? ['action'] : ['drama'], language: index % 2 === 0 ? 'en' : 'jp', chapterCount: index + 1, coverUrl: null, createdAt: new Date(), updatedAt: new Date(),
    }));

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal(books), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ search: signal('solo'), sort: signal('score'), language: signal('en'), genres: signal(['action']), chapterValue: signal(100), chapterMode: signal('max') }) },
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
        { provide: BookService, useValue: { books: signal([{ id: 'book-1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ rememberAnchor, rememberScroll }) },
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
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }, { id: 'b2', userId: 'u1', title: 'Book B', description: '', score: 7, status: 'completed', genres: ['drama'], language: 'en', chapterCount: 30, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([{ id: 's1', userId: 'u1', name: 'Favorites', bookCount: 1, bookIds: ['b1'], createdAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(1), loadShelves: jest.fn(), createShelf: jest.fn(), deleteShelf: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
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
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn(), createShelf: jest.fn(), deleteShelf: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ updateFilter }) },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();
    const readingButton = fixture.debugElement.query(By.css('[data-testid="shelf-status-reading"]')).nativeElement as HTMLButtonElement;
    readingButton.click();
    expect(updateFilter).toHaveBeenCalledWith('shelf', 'status:reading');
  });

  it('creates and deletes custom shelves through ShelfService actions', async () => {
    const createShelf = jest.fn().mockResolvedValue({ success: true, data: { id: 's2', userId: 'u1', name: 'Weekend Reads', bookCount: 0, createdAt: new Date() } });
    const deleteShelf = jest.fn().mockResolvedValue({ success: true, data: undefined });

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([{ id: 's1', userId: 'u1', name: 'Favorites', bookCount: 1, bookIds: ['b1'], createdAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(1), loadShelves: jest.fn(), createShelf, deleteShelf } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.shelf-header-button')).nativeElement.click();
    fixture.detectChanges();

    fixture.componentInstance.newShelfName = 'Weekend Reads';
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="create-shelf-button"]')).nativeElement.click();
    await Promise.resolve();
    expect(createShelf).toHaveBeenCalledWith('Weekend Reads');

    fixture.debugElement.query(By.css('[data-testid="delete-shelf-s1"]')).nativeElement.click();
    await Promise.resolve();
    expect(deleteShelf).toHaveBeenCalledWith('s1');
  });

  it('applies selected status shelf before other filters', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Reading Title', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }, { id: 'b2', userId: 'u1', title: 'Completed Title', description: '', score: 7, status: 'completed', genres: ['drama'], language: 'en', chapterCount: 30, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn(), createShelf: jest.fn(), deleteShelf: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ shelf: signal('status:completed') }) },
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
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal('Could not create shelf. db unavailable'), shelfCount: signal(0), loadShelves: jest.fn(), createShelf: jest.fn(), deleteShelf: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not create shelf. db unavailable');
    expect(fixture.nativeElement.textContent).toContain('Book A');
  });

  it('shows waiting-update batch action only in waiting shelf context', () => {
    const mockFilter = createMockFilter({ shelf: signal('status:waiting') });
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'waiting', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn(), runWaitingShelfLatestUpdates: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn(), createShelf: jest.fn(), deleteShelf: jest.fn() } },
        { provide: BookshelfFilterService, useValue: mockFilter },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-testid="waiting-updates-button"]'))).not.toBeNull();

    mockFilter.shelf.set('status:reading');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-testid="waiting-updates-button"]'))).toBeNull();
  });

  it('renders waiting update progress and summary with error details', async () => {
    const runWaitingShelfLatestUpdates = jest.fn().mockImplementation(async (_books, options) => {
      options.onProgress({ processed: 1, total: 2, updated: 1, skipped: 0, errors: 0 });
      return { success: true, data: { updatedCount: 1, skippedCount: 0, errorCount: 1, outcomes: [{ bookId: 'b2', title: 'Book B', status: 'error', detail: 'Timeout while fetching latest chapter.' }] } };
    });

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'waiting', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }, { id: 'b2', userId: 'u1', title: 'Book B', description: '', score: 8, status: 'waiting', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn(), runWaitingShelfLatestUpdates } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn(), createShelf: jest.fn(), deleteShelf: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ shelf: signal('status:waiting') }) },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="waiting-updates-button"]')).nativeElement.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(runWaitingShelfLatestUpdates).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Progress: 1 / 2');
    expect(fixture.nativeElement.textContent).toContain('Updated: 1');
    expect(fixture.nativeElement.textContent).toContain('Errors: 1');
    expect(fixture.nativeElement.textContent).toContain('Timeout while fetching latest chapter.');
  });

  it('does not render legacy-mismatched genre add input controls', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter() },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="genre-input"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="add-genre-button"]'))).toBeNull();
  });

  it('removes a genre tag when × is clicked and calls updateFilter without that genre', () => {
    const updateFilter = jest.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        { provide: BookService, useValue: { books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action', 'drama'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action', 'drama']), updateFilter }) },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="genre-filter-toggle"]')).nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="remove-genre-action"]')).nativeElement.click();
    expect(updateFilter).toHaveBeenCalledWith('genres', ['drama']);
  });

  it('unselects the only selected genre when clicking its chip (case-insensitive match)', () => {
    const updateFilter = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['Action'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action']), updateFilter }) },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="genre-filter-toggle"]')).nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="genre-chip-Action"]')).nativeElement.click();
    expect(updateFilter).toHaveBeenCalledWith('genres', []);
  });

  it('renders selected and unselected genre chips with the base pill class for consistent sizing', () => {
    TestBed.configureTestingModule({
      imports: [BookshelfPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([{ id: 'b1', userId: 'u1', title: 'Book A', description: '', score: 8, status: 'reading', genres: ['action', 'drama'], language: 'en', chapterCount: 20, coverUrl: null, createdAt: new Date(), updatedAt: new Date() }]),
            isLoading: signal(false),
            errorMessage: signal(null),
            loadBooks: jest.fn(),
          },
        },
        { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
        { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action']) }) },
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="genre-filter-toggle"]')).nativeElement.click();
    fixture.detectChanges();

    const selected = fixture.debugElement.query(By.css('[data-testid="genre-chip-action"]')).nativeElement as HTMLButtonElement;
    const unselected = fixture.debugElement.query(By.css('[data-testid="genre-chip-drama"]')).nativeElement as HTMLButtonElement;

    expect(selected.classList.contains('pill')).toBe(true);
    expect(unselected.classList.contains('pill')).toBe(true);
    expect(unselected.classList.contains('ghost')).toBe(true);
  });

  describe('Chapter Count Presets', () => {
    const mockBooks = [
      { id: 'b1', title: 'Short Book', chapterCount: 15, status: 'reading', genres: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b2', title: 'Medium Book', chapterCount: 60, status: 'reading', genres: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b3', title: 'Long Book', chapterCount: 150, status: 'reading', genres: [], createdAt: new Date(), updatedAt: new Date() },
    ] as any[];

    it('calls updateFilter with chapterValue when a preset is clicked', () => {
      const updateFilter = jest.fn().mockResolvedValue(undefined);
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          // FIX: Pass mockBooks instead of [] so the UI actually renders
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ updateFilter }) },
        ],
      });
      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      fixture.debugElement.query(By.css('[data-testid="chapter-filter-toggle"]')).nativeElement.click();
      fixture.detectChanges();

      const preset50 = fixture.debugElement.query(By.css('[data-testid="chapter-preset-50"]')).nativeElement;
      preset50.click();
      expect(updateFilter).toHaveBeenCalledWith('chapterValue', 50);

      const clearBtn = fixture.debugElement.query(By.css('[data-testid="chapter-preset-clear"]')).nativeElement;
      clearBtn.click();
      expect(updateFilter).toHaveBeenCalledWith('chapterValue', null);
    });

    it('calls updateFilter with chapterMode when Min/Max toggle is clicked', () => {
      const updateFilter = jest.fn().mockResolvedValue(undefined);
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          // FIX: Pass mockBooks instead of []
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ updateFilter, chapterValue: signal(50) }) },
        ],
      });
      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      const modeMin = fixture.debugElement.query(By.css('[data-testid="chapter-mode-min"]')).nativeElement;
      modeMin.click();
      expect(updateFilter).toHaveBeenCalledWith('chapterMode', 'min');
    });

    it('filters books by chapter count using max mode', () => {
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ chapterValue: signal(100), chapterMode: signal('max') }) },
        ],
      });
      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Short Book');
      expect(fixture.nativeElement.textContent).toContain('Medium Book');
      expect(fixture.nativeElement.textContent).not.toContain('Long Book');
    });

    it('filters books by chapter count using min mode', () => {
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ chapterValue: signal(50), chapterMode: signal('min') }) },
        ],
      });
      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('Short Book');
      expect(fixture.nativeElement.textContent).toContain('Medium Book');
      expect(fixture.nativeElement.textContent).toContain('Long Book');
    });
  });

  // --- ISSUE 018: GENRE FILTER MODE TESTS ---
  describe('Genre Filter Mode (Any/All)', () => {
    const mockBooks = [
      { id: 'b1', title: 'Book 1', description: '', status: 'completed', genres: ['action', 'fantasy'], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b2', title: 'Book 2', description: '', status: 'completed', genres: ['action', 'sci-fi'], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b3', title: 'Book 3', description: '', status: 'completed', genres: ['drama'], createdAt: new Date(), updatedAt: new Date() },
    ] as any[];

    it('hides Any/All toggle buttons when no genres are selected', () => {
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          { provide: BookService, useValue: { books: signal([]), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal([]) }) }, // No genres
        ],
      });

      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('.genre-mode-toggle'))).toBeFalsy();
    });

    it('shows Any/All toggle buttons when at least one genre is selected', () => {
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          // FIX: Pass mockBooks instead of [] so the UI actually renders
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action']) }) },
        ],
      });

      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('.genre-mode-toggle'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="genre-mode-any"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="genre-mode-all"]'))).toBeTruthy();
    });

    it('calls updateFilter with genreMode when toggle buttons are clicked', () => {
      const updateFilter = jest.fn().mockResolvedValue(undefined);
      
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          // FIX: Pass mockBooks instead of []
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action']), updateFilter }) },
        ],
      });

      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();
      
      const anyBtn = fixture.debugElement.query(By.css('[data-testid="genre-mode-any"]')).nativeElement;
      anyBtn.click();
      expect(updateFilter).toHaveBeenCalledWith('genreMode', 'any');

      const allBtn = fixture.debugElement.query(By.css('[data-testid="genre-mode-all"]')).nativeElement;
      allBtn.click();
      expect(updateFilter).toHaveBeenCalledWith('genreMode', 'all');
    });

    it('filters books matching ALL selected genres when genreMode is "all"', () => {
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action', 'fantasy']), genreMode: signal('all') }) },
        ],
      });

      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      // Only Book 1 has BOTH action and fantasy
      expect(fixture.nativeElement.textContent).toContain('Book 1');
      expect(fixture.nativeElement.textContent).not.toContain('Book 2');
      expect(fixture.nativeElement.textContent).not.toContain('Book 3');
    });

    it('filters books matching ANY selected genre when genreMode is "any"', () => {
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: createMockFilter({ genres: signal(['action', 'fantasy']), genreMode: signal('any') }) },
        ],
      });

      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      // Book 1 has both, Book 2 has action. Both should show. Book 3 has neither.
      expect(fixture.nativeElement.textContent).toContain('Book 1');
      expect(fixture.nativeElement.textContent).toContain('Book 2');
      expect(fixture.nativeElement.textContent).not.toContain('Book 3');
    });
  });

  describe('Relevance-Ranked Search', () => {
    const mockBooks = [
      { id: 'b1', title: 'Sword', description: '', status: 'completed', genres: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b2', title: 'Longsword', description: '', status: 'completed', genres: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b3', title: 'Magic Tome', description: 'Contains a sword.', status: 'completed', genres: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'b4', title: 'Unrelated', description: 'Nothing.', status: 'completed', genres: [], createdAt: new Date(), updatedAt: new Date() },
    ] as any[];

    it('shows Relevance sort option only when search query is active', () => {
      const mockFilter = createMockFilter({ search: signal('') });
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          // FIX: Pass mockBooks instead of [] so the UI actually renders
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: mockFilter },
        ],
      });
      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      // Empty search -> no relevance option
      expect(fixture.debugElement.query(By.css('option[value="relevance"]'))).toBeFalsy();

      // Active search -> shows relevance option
      mockFilter.search.set('sword');
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('option[value="relevance"]'))).toBeTruthy();
    });

    it('sorts books by relevance score when sort is relevance and search is active', () => {
      const mockFilter = createMockFilter({ search: signal('sword'), sort: signal('relevance'), sortDir: signal('desc') });
      TestBed.configureTestingModule({
        imports: [BookshelfPageComponent],
        providers: [
          { provide: BookService, useValue: { books: signal(mockBooks), isLoading: signal(false), errorMessage: signal(null), loadBooks: jest.fn() } },
          { provide: ShelfService, useValue: { shelves: signal([]), isLoading: signal(false), errorMessage: signal(null), shelfCount: signal(0), loadShelves: jest.fn() } },
          { provide: BookshelfFilterService, useValue: mockFilter },
        ],
      });
      const fixture = TestBed.createComponent(BookshelfPageComponent);
      fixture.detectChanges();

      const pagedBooks = fixture.componentInstance.pagedBooks();
      
      expect(pagedBooks.length).toBe(3); // 'Unrelated' is filtered out by the search
      expect(pagedBooks[0].id).toBe('b1'); // Exact title match (Highest score)
      expect(pagedBooks[1].id).toBe('b2'); // Partial title match (Medium score)
      expect(pagedBooks[2].id).toBe('b3'); // Description match (Lowest score)
    });
  });
});