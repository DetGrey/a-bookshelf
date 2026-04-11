import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BookRepository } from './book.repository';
import { BookService } from './book.service';

describe('BookService read state', () => {
  const authUser = { id: 'user-1' };

  it('loads books and exposes derived values', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'book-1',
            user_id: 'user-1',
            title: 'A',
            description: null,
            score: 8,
            status: 'reading',
            genres: ['action'],
            language: 'en',
            chapter_count: 10,
            cover_url: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          {
            id: 'book-2',
            user_id: 'user-1',
            title: 'B',
            description: null,
            score: 0,
            status: 'completed',
            genres: [],
            language: null,
            chapter_count: null,
            cover_url: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
        ],
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    const result = await service.loadBooks();

    expect(result.success).toBe(true);
    expect(service.books().length).toBe(2);
    expect(service.bookCount()).toBe(2);
    expect(service.averageScore()).toBe(8);
    expect(service.errorMessage()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('surfaces repository error message in signal state', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'network',
          message: 'Cannot load books',
        },
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    const result = await service.loadBooks();

    expect(result.success).toBe(false);
    expect(service.books()).toEqual([]);
    expect(service.errorMessage()).toBe('Cannot load books');
    expect(service.isLoading()).toBe(false);
  });

  it('creates book then sources/relations/shelf links in order', async () => {
    const order: string[] = [];
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      create: jest.fn().mockImplementation(async () => {
        order.push('create');
        return {
          success: true,
          data: {
            id: 'book-9',
            user_id: 'user-1',
            title: 'Solo',
            description: null,
            score: null,
            status: 'plan_to_read',
            genres: ['action'],
            language: null,
            chapter_count: null,
            cover_url: 'https://images.example.com/raw.jpg',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        };
      }),
      addSources: jest.fn().mockImplementation(async () => {
        order.push('sources');
        return { success: true, data: undefined };
      }),
      addRelations: jest.fn().mockImplementation(async () => {
        order.push('relations');
        return { success: true, data: undefined };
      }),
      setShelfLinks: jest.fn().mockImplementation(async () => {
        order.push('shelves');
        return { success: true, data: undefined };
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);

    const result = await service.createBook({
      title: 'Solo',
      description: '',
      score: null,
      status: 'plan_to_read',
      genres: 'action',
      language: '',
      chapterCount: null,
      coverUrl: 'https://images.example.com/raw.jpg',
      sources: [{ siteName: '', url: 'https://example.com/solo' }],
      shelves: ['shelf-1'],
      relatedBookIds: ['book-2'],
    });

    expect(result.success).toBe(true);
    expect(order).toEqual(['create', 'sources', 'relations', 'shelves']);
    expect(service.books().some((book) => book.id === 'book-9')).toBe(true);
  });

  it('keeps list stable and exposes actionable error when post-create step fails', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      create: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-9',
          user_id: 'user-1',
          title: 'Solo',
          description: null,
          score: null,
          status: 'plan_to_read',
          genres: ['action'],
          language: null,
          chapter_count: null,
          cover_url: 'https://images.example.com/raw.jpg',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      }),
      addSources: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'network', message: 'source insert failed' },
      }),
      addRelations: jest.fn(),
      setShelfLinks: jest.fn(),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    const initialLength = service.books().length;

    const result = await service.createBook({
      title: 'Solo',
      description: '',
      score: null,
      status: 'plan_to_read',
      genres: 'action',
      language: '',
      chapterCount: null,
      coverUrl: 'https://images.example.com/raw.jpg',
      sources: [{ siteName: '', url: 'https://example.com/solo' }],
      shelves: [],
      relatedBookIds: [],
    });

    expect(result.success).toBe(false);
    expect(service.books().length).toBe(initialLength);
    expect(service.errorMessage()).toContain('Could not save book');
  });

  it('applies update diff operations in deterministic order', async () => {
    const order: string[] = [];
    const repository = {
      update: jest.fn().mockImplementation(async () => {
        order.push('row');
        return {
          success: true,
          data: {
            id: 'book-1',
            user_id: 'user-1',
            title: 'Updated title',
            description: 'updated description',
            score: 9,
            status: 'reading',
            genres: ['action'],
            language: 'en',
            chapter_count: 50,
            cover_url: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-03T00:00:00.000Z',
          },
        };
      }),
      removeSources: jest.fn().mockImplementation(async () => {
        order.push('removeSources');
        return { success: true, data: undefined };
      }),
      addSources: jest.fn().mockImplementation(async () => {
        order.push('addSources');
        return { success: true, data: undefined };
      }),
      removeRelations: jest.fn().mockImplementation(async () => {
        order.push('removeRelations');
        return { success: true, data: undefined };
      }),
      addRelations: jest.fn().mockImplementation(async () => {
        order.push('addRelations');
        return { success: true, data: undefined };
      }),
      removeShelfLinks: jest.fn().mockImplementation(async () => {
        order.push('removeShelves');
        return { success: true, data: undefined };
      }),
      setShelfLinks: jest.fn().mockImplementation(async () => {
        order.push('addShelves');
        return { success: true, data: undefined };
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([
      {
        id: 'book-1',
        userId: 'user-1',
        title: 'Original title',
        description: 'desc',
        score: 7,
        status: 'reading',
        genres: ['action'],
        language: 'en',
        chapterCount: 45,
        coverUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.updateBook('book-1', {
      title: 'Updated title',
      description: 'updated description',
      score: 9,
      status: 'reading',
      genres: 'action',
      language: 'en',
      chapterCount: 50,
      coverUrl: '',
      sources: [{ siteName: 'A', url: 'https://a.example' }],
      shelves: ['shelf-1'],
      relatedBookIds: ['book-2'],
    }, {
      sources: [{ siteName: 'Old', url: 'https://old.example' }],
      relatedBookIds: ['book-3'],
      shelfIds: ['shelf-2'],
    });

    expect(result.success).toBe(true);
    expect(order).toEqual([
      'row',
      'removeSources',
      'addSources',
      'removeRelations',
      'addRelations',
      'removeShelves',
      'addShelves',
    ]);
  });

  it('rolls back optimistic update when mutation step fails', async () => {
    const repository = {
      update: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-1',
          user_id: 'user-1',
          title: 'Updated title',
          description: 'updated description',
          score: 9,
          status: 'reading',
          genres: ['action'],
          language: 'en',
          chapter_count: 50,
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-03T00:00:00.000Z',
        },
      }),
      removeSources: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      addSources: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'network', message: 'source update failed' },
      }),
      removeRelations: jest.fn(),
      addRelations: jest.fn(),
      removeShelfLinks: jest.fn(),
      setShelfLinks: jest.fn(),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([
      {
        id: 'book-1',
        userId: 'user-1',
        title: 'Original title',
        description: 'desc',
        score: 7,
        status: 'reading',
        genres: ['action'],
        language: 'en',
        chapterCount: 45,
        coverUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.updateBook('book-1', {
      title: 'Updated title',
      description: 'updated description',
      score: 9,
      status: 'reading',
      genres: 'action',
      language: 'en',
      chapterCount: 50,
      coverUrl: '',
      sources: [{ siteName: 'A', url: 'https://a.example' }],
      shelves: ['shelf-1'],
      relatedBookIds: ['book-2'],
    }, {
      sources: [{ siteName: 'Old', url: 'https://old.example' }],
      relatedBookIds: [],
      shelfIds: [],
    });

    expect(result.success).toBe(false);
    expect(service.books()[0]?.title).toBe('Original title');
    expect(service.errorMessage()).toContain('Could not save book');
  });

  it('optimistically deletes and restores on failure', async () => {
    const repository = {
      delete: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'network', message: 'delete failed' },
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(authUser),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([
      {
        id: 'book-1',
        userId: 'user-1',
        title: 'Original title',
        description: 'desc',
        score: 7,
        status: 'reading',
        genres: ['action'],
        language: 'en',
        chapterCount: 45,
        coverUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.deleteBook('book-1');

    expect(result.success).toBe(false);
    expect(service.books().length).toBe(1);
    expect(service.errorMessage()).toContain('Could not delete book');
  });
});