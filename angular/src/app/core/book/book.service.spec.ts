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
});