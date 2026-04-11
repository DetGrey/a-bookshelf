import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BookService } from '../../core/book/book.service';
import { ShelfService } from '../../core/shelf/shelf.service';
import { BookshelfPageComponent } from './bookshelf-page.component';

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
      ],
    });

    const fixture = TestBed.createComponent(BookshelfPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Shelves: 1');
    expect(fixture.nativeElement.textContent).toContain('Book A');
  });
});