import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SUPABASE_CLIENT } from '../supabase.token';
import { BookRepository } from './book.repository';
import { BookService } from './book.service';
import { SUPABASE_CLIENT } from '../supabase.token';

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
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
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
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
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
    await Promise.resolve();
    service.books.set([
      {
        id: 'book-1', userId: 'user-1', title: 'Original title', description: 'desc',
        score: 7, status: 'reading' as const, genres: ['action'], language: 'en',
        chapterCount: 45, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
        notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
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
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
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
    await Promise.resolve();
    service.books.set([
      {
        id: 'book-1', userId: 'user-1', title: 'Original title', description: 'desc',
        score: 7, status: 'reading' as const, genres: ['action'], language: 'en',
        chapterCount: 45, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
        notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
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
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
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
        id: 'book-1', userId: 'user-1', title: 'Original title', description: 'desc',
        score: 7, status: 'reading' as const, genres: ['action'], language: 'en',
        chapterCount: 45, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
        notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.deleteBook('book-1');

    expect(result.success).toBe(false);
    expect(service.books().length).toBe(1);
    expect(service.errorMessage()).toContain('Could not delete book');
  });

  it('starts and stops realtime subscription with auth state changes', async () => {
    const handlers: Record<string, (payload: unknown) => void> = {};
    let channel: any;
    channel = {
      on: jest.fn().mockImplementation((_type: string, _filter: unknown, handler: (payload: unknown) => void) => {
        handlers[_type] = handler;
        return channel;
      }),
      subscribe: jest.fn().mockReturnValue(channel),
    };
    const removeChannel = jest.fn().mockResolvedValue(channel);
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            channel: jest.fn().mockReturnValue(channel),
            removeChannel,
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    const auth = TestBed.inject(AuthService) as unknown as { currentUser: ReturnType<typeof signal> };

    auth.currentUser.set({ id: 'user-1' } as never);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(repository.getByUserId).toHaveBeenCalledWith('user-1');
    expect(channel.on).toHaveBeenCalled();
    expect(channel.subscribe).toHaveBeenCalled();

    auth.currentUser.set(null);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(removeChannel).toHaveBeenCalled();
  });

  it('merges realtime insert update and delete events without duplicates', async () => {
    const handlers: Record<string, (payload: unknown) => void> = {};
    let channel: any;
    channel = {
      on: jest.fn().mockImplementation((_type: string, _filter: unknown, handler: (payload: unknown) => void) => {
        handlers[_type] = handler;
        return channel;
      }),
      subscribe: jest.fn().mockReturnValue(channel),
    };
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            channel: jest.fn().mockReturnValue(channel),
            removeChannel: jest.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    await new Promise((resolve) => setTimeout(resolve, 0));
    service.books.set([
      {
        id: 'book-1', userId: 'user-1', title: 'Original', description: '',
        score: null, status: 'reading' as const, genres: [], language: null,
        chapterCount: 10, latestChapter: 'Ch 10', lastUploadedAt: null, lastFetchedAt: null,
        notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    handlers['postgres_changes']({
      eventType: 'UPDATE',
      new: {
        id: 'book-1',
        user_id: 'user-1',
        title: 'Updated',
        description: null,
        score: null,
        status: 'reading',
        genres: [],
        language: null,
        chapter_count: 11,
        latest_chapter: 'Ch 11',
        last_uploaded_at: null,
        last_fetched_at: null,
        cover_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-03T00:00:00.000Z',
      },
      old: null,
    });

    handlers['postgres_changes']({
      eventType: 'INSERT',
      new: {
        id: 'book-2',
        user_id: 'user-1',
        title: 'Inserted',
        description: null,
        score: null,
        status: 'waiting',
        genres: [],
        language: null,
        chapter_count: null,
        latest_chapter: null,
        last_uploaded_at: null,
        last_fetched_at: null,
        cover_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-03T00:00:00.000Z',
      },
      old: null,
    });

    handlers['postgres_changes']({
      eventType: 'DELETE',
      old: {
        id: 'book-1',
      },
      new: null,
    });

    expect(service.books().some((book) => book.id === 'book-1')).toBe(false);
    expect(service.books().some((book) => book.id === 'book-2')).toBe(true);
    expect(service.books().filter((book) => book.id === 'book-2')).toHaveLength(1);
  });

  it('keeps optimistic updates visible when matching realtime events arrive early', async () => {
    let resolveUpdate!: (value: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });

    const handlers: Record<string, (payload: unknown) => void> = {};
    let channel: any;
    channel = {
      on: jest.fn().mockImplementation((_type: string, _filter: unknown, handler: (payload: unknown) => void) => {
        handlers[_type] = handler;
        return channel;
      }),
      subscribe: jest.fn().mockReturnValue(channel),
    };
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      update: jest.fn().mockReturnValue(updatePromise),
      removeSources: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      addSources: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      removeRelations: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      addRelations: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      removeShelfLinks: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      setShelfLinks: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            channel: jest.fn().mockReturnValue(channel),
            removeChannel: jest.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    await new Promise((resolve) => setTimeout(resolve, 0));
    service.books.set([
      {
        id: 'book-1', userId: 'user-1', title: 'Original', description: '',
        score: null, status: 'reading' as const, genres: [], language: null,
        chapterCount: 10, latestChapter: 'Ch 10', lastUploadedAt: null, lastFetchedAt: null,
        notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const updateTask = service.updateBook('book-1', {
      title: 'Optimistic',
      description: '',
      score: null,
      status: 'reading',
      genres: '',
      language: '',
      chapterCount: 10,
      coverUrl: '',
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
      sources: [],
      shelves: [],
      relatedBookIds: [],
    }, {
      sources: [],
      relatedBookIds: [],
      shelfIds: [],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    handlers['postgres_changes']({
      eventType: 'UPDATE',
      new: {
        id: 'book-1',
        user_id: 'user-1',
        title: 'Stale realtime',
        description: null,
        score: null,
        status: 'reading',
        genres: [],
        language: null,
        chapter_count: 10,
        latest_chapter: 'Ch 10',
        last_uploaded_at: null,
        last_fetched_at: null,
        cover_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      old: null,
    });

    expect(service.books()[0]?.title).toBe('Optimistic');

    resolveUpdate({
      success: true,
      data: {
        id: 'book-1',
        user_id: 'user-1',
        title: 'Optimistic',
        description: null,
        score: null,
        status: 'reading',
        genres: [],
        language: null,
        chapter_count: 10,
        latest_chapter: 'Ch 10',
        last_uploaded_at: null,
        last_fetched_at: null,
        cover_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-03T00:00:00.000Z',
      },
    });

    await updateTask;

    expect(service.books()[0]?.title).toBe('Optimistic');
  });

  it('updates only changed latest fields and skips unchanged waiting books', async () => {
    const invoke = jest
      .fn()
      .mockResolvedValueOnce({
        data: {
          latest_chapter: 'Ch 11',
          chapter_count: 11,
          last_uploaded_at: '2026-01-03T00:00:00.000Z',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          latest_chapter: 'Ch 20',
          chapter_count: 20,
          last_uploaded_at: '2026-01-05T00:00:00.000Z',
        },
        error: null,
      });

    const repository = {
      getPrimarySourceUrl: jest
        .fn()
        .mockResolvedValueOnce({ success: true, data: 'https://source.example/book-1' })
        .mockResolvedValueOnce({ success: true, data: 'https://source.example/book-2' }),
      update: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-1',
          user_id: 'user-1',
          title: 'Book 1',
          description: null,
          score: null,
          status: 'waiting',
          genres: [],
          language: null,
          chapter_count: 11,
          latest_chapter: 'Ch 11',
          last_uploaded_at: '2026-01-03T00:00:00.000Z',
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-03T00:00:00.000Z',
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
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: {
              invoke,
            },
          },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([
      {
        id: 'book-1', userId: 'user-1', title: 'Book 1', description: '',
        score: null, status: 'waiting' as const, genres: [], language: null,
        chapterCount: 10, latestChapter: 'Ch 10', lastUploadedAt: new Date('2026-01-02T00:00:00.000Z'),
        lastFetchedAt: null, notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 'book-2', userId: 'user-1', title: 'Book 2', description: '',
        score: null, status: 'waiting' as const, genres: [], language: null,
        chapterCount: 20, latestChapter: 'Ch 20', lastUploadedAt: new Date('2026-01-05T00:00:00.000Z'),
        lastFetchedAt: null, notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
        coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.runWaitingShelfLatestUpdates(service.books(), { batchSize: 2, throttleMs: 0 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updatedCount).toBe(1);
      expect(result.data.skippedCount).toBe(1);
      expect(result.data.errorCount).toBe(0);
    }

    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith('user-1', 'book-1', {
      latest_chapter: 'Ch 11',
      chapter_count: 11,
      last_uploaded_at: '2026-01-03T00:00:00.000Z',
    });
  });
});

describe('BookService.fetchLatestChapterForBook', () => {
  const authUser = { id: 'user-1' };

  const existingBook = {
    id: 'book-1',
    userId: 'user-1',
    title: 'Book 1',
    description: '',
    score: null,
    status: 'reading' as const,
    genres: [],
    language: null,
    chapterCount: 10,
    latestChapter: 'Ch 10',
    lastUploadedAt: new Date('2026-01-02T00:00:00.000Z'),
    lastFetchedAt: null,
    notes: null,
    timesRead: 1,
    lastRead: null,
    originalLanguage: null,
    coverUrl: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('returns skipped when no source URL is available for the book', async () => {
    const repository = {
      getPrimarySourceUrl: jest.fn().mockResolvedValue({ success: true, data: '' }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        { provide: AuthService, useValue: { currentUser: signal(authUser) } },
        {
          provide: SUPABASE_CLIENT,
          useValue: { functions: { invoke: jest.fn() } },
        },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([existingBook]);

    const result = await service.fetchLatestChapterForBook('book-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('skipped');
      expect(result.data.detail).toContain('No source URL');
    }
  });

  it('returns updated when invoke returns new chapter data and updates the books signal', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        latest_chapter: 'Ch 11',
        chapter_count: 11,
        last_uploaded_at: '2026-01-03T00:00:00.000Z',
      },
      error: null,
    });

    const repository = {
      getPrimarySourceUrl: jest.fn().mockResolvedValue({ success: true, data: 'https://source.example/book-1' }),
      update: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-1',
          user_id: 'user-1',
          title: 'Book 1',
          description: null,
          score: null,
          status: 'reading',
          genres: [],
          language: null,
          chapter_count: 11,
          latest_chapter: 'Ch 11',
          last_uploaded_at: '2026-01-03T00:00:00.000Z',
          last_fetched_at: null,
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-03T00:00:00.000Z',
        },
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        { provide: AuthService, useValue: { currentUser: signal(authUser) } },
        { provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([existingBook]);

    const result = await service.fetchLatestChapterForBook('book-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('updated');
    }

    const updated = service.books().find((b) => b.id === 'book-1');
    expect(updated?.chapterCount).toBe(11);
  });

  it('returns skipped when invoke data matches existing book fields', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        latest_chapter: 'Ch 10',
        chapter_count: 10,
        last_uploaded_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });

    const repository = {
      getPrimarySourceUrl: jest.fn().mockResolvedValue({ success: true, data: 'https://source.example/book-1' }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        { provide: AuthService, useValue: { currentUser: signal(authUser) } },
        { provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([existingBook]);

    const result = await service.fetchLatestChapterForBook('book-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('skipped');
      expect(result.data.detail).toContain('No fields changed');
    }
  });

  it('returns failure when the edge function invocation fails', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'edge function timeout' },
    });

    const repository = {
      getPrimarySourceUrl: jest.fn().mockResolvedValue({ success: true, data: 'https://source.example/book-1' }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: repository },
        { provide: AuthService, useValue: { currentUser: signal(authUser) } },
        { provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } },
      ],
    });

    const service = TestBed.inject(BookService);
    service.books.set([existingBook]);

    const result = await service.fetchLatestChapterForBook('book-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('edge function timeout');
    }
  });

  it('returns failure when not authenticated', async () => {
    TestBed.configureTestingModule({
      providers: [
        BookService,
        { provide: BookRepository, useValue: {} as unknown as BookRepository },
        { provide: AuthService, useValue: { currentUser: signal(null) } },
      ],
    });

    const service = TestBed.inject(BookService);
    const result = await service.fetchLatestChapterForBook('book-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Authentication required');
    }
  });
});