import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { ErrorCode } from '../../models/result.model';
import { BookService } from '../../core/book/book.service';
import { SUPABASE_CLIENT } from '../../core/supabase.token';
import { BookDetailsPageComponent } from './book-details-page.component';

describe('BookDetailsPageComponent', () => {
  it('renders read mode sections from resolver data', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action', 'Fantasy'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: 'https://images.example.com/solo.jpg',
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [{ bookId: 'book-2', relation: 'related' }],
                    shelves: [{ id: 'shelf-1', name: 'Favorites' }],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Solo Leveling');
    expect(fixture.nativeElement.textContent).toContain('Hunters and gates');
    expect(fixture.nativeElement.textContent).toContain('Favorites');
    expect(fixture.nativeElement.textContent).toContain('https://example.com/solo');
    expect(fixture.nativeElement.textContent).toContain('book-2');
  });

  it('shows fallback values for missing metadata and relations', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Untitled',
                      description: '',
                      score: null,
                      status: 'plan_to_read',
                      genres: [],
                      language: null,
                      chapterCount: null,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No description available');
    expect(fixture.nativeElement.textContent).toContain('Unscored');
    expect(fixture.nativeElement.textContent).toContain('Unknown');
    expect(fixture.nativeElement.textContent).toContain('No sources');
    expect(fixture.nativeElement.textContent).toContain('No shelves');
    expect(fixture.nativeElement.textContent).toContain('No related books');
  });

  it('renders resolver failure message', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: false,
                  error: {
                    code: ErrorCode.NotFound,
                    message: 'Book not found',
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Book not found');
  });

  it('toggles edit mode and preloads current values into typed controls', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action', 'Fantasy'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: 'https://images.example.com/solo.jpg',
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [{ bookId: 'book-2', relation: 'related' }],
                    shelves: [{ id: 'shelf-1', name: 'Favorites' }],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('[data-testid="enter-edit-mode"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const titleInput = fixture.nativeElement.querySelector('[data-testid="title-input"]') as HTMLInputElement;
    expect(titleInput.value).toBe('Solo Leveling');
  });

  it('surfaces clear error when save fails', async () => {
    const updateBook = jest.fn().mockResolvedValue({
      success: false,
      error: { code: ErrorCode.Network, message: 'update failed' },
    });

    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook,
            deleteBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('[data-testid="enter-edit-mode"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('[data-testid="save-edit"]') as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not save book');
  });

  it('requires delete confirmation before removing book', async () => {
    const deleteBook = jest.fn().mockResolvedValue({ success: true, data: undefined });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook,
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('[data-testid="delete-book"]') as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    await Promise.resolve();

    expect(deleteBook).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('shows fetch-latest-chapter button only when the book has at least one source', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            fetchLatestChapterForBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="fetch-latest-chapter"]')).not.toBeNull();
  });

  it('hides fetch-latest-chapter button when the book has no sources', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: '',
                      score: null,
                      status: 'reading',
                      genres: [],
                      language: null,
                      chapterCount: null,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            fetchLatestChapterForBook: jest.fn(),
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="fetch-latest-chapter"]')).toBeNull();
  });

  it('shows updated message after successful fetch-latest-chapter', async () => {
    const fetchLatestChapterForBook = jest.fn().mockResolvedValue({
      success: true,
      data: { status: 'updated', detail: 'Updated latest chapter info.' },
    });
    const updatedBook = {
      id: 'book-1',
      userId: 'user-1',
      title: 'Solo Leveling',
      description: '',
      score: null,
      status: 'reading' as const,
      genres: [],
      language: null,
      chapterCount: 211,
      coverUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    };

    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: '',
                      score: null,
                      status: 'reading',
                      genres: [],
                      language: null,
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            fetchLatestChapterForBook,
            books: signal([updatedBook]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="fetch-latest-chapter"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    expect(fetchLatestChapterForBook).toHaveBeenCalledWith('book-1');
    expect(fixture.nativeElement.querySelector('[data-testid="fetch-latest-result"]')?.textContent).toContain('Updated');
  });

  it('shows skip message when fetch-latest-chapter returns skipped', async () => {
    const fetchLatestChapterForBook = jest.fn().mockResolvedValue({
      success: true,
      data: { status: 'skipped', detail: 'No fields changed.' },
    });

    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: '',
                      score: null,
                      status: 'reading',
                      genres: [],
                      language: null,
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            fetchLatestChapterForBook,
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="fetch-latest-chapter"]').click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    const result = fixture.nativeElement.querySelector('[data-testid="fetch-latest-result"]');
    expect(result?.textContent).toContain('Skipped');
    expect(result?.textContent).toContain('No fields changed');
  });

  it('shows failure message when fetch-latest-chapter errors', async () => {
    const fetchLatestChapterForBook = jest.fn().mockResolvedValue({
      success: false,
      error: { code: 'unknown', message: 'edge function timeout' },
    });

    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: '',
                      score: null,
                      status: 'reading',
                      genres: [],
                      language: null,
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook: jest.fn(),
            fetchLatestChapterForBook,
            books: signal([]),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="fetch-latest-chapter"]').click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    const result = fixture.nativeElement.querySelector('[data-testid="fetch-latest-result"]');
    expect(result?.textContent).toContain('Failed');
    expect(result?.textContent).toContain('edge function timeout');
  });

  it('navigates to bookshelf after confirmed successful delete', async () => {
    const deleteBook = jest.fn().mockResolvedValue({ success: true, data: undefined });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const navigate = jest.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
        {
          provide: BookService,
          useValue: {
            updateBook: jest.fn(),
            deleteBook,
            books: signal([]),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('[data-testid="delete-book"]') as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    await Promise.resolve();

    expect(deleteBook).toHaveBeenCalledWith('book-1');
    expect(navigate).toHaveBeenCalledWith(['/bookshelf']);
    confirmSpy.mockRestore();
  });
});
