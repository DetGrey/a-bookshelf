import { TestBed } from '@angular/core/testing';
import { ErrorCode } from '../../models/result.model';
import { SUPABASE_CLIENT } from '../supabase.token';
import { BookRepository } from './book.repository';

describe('BookRepository read contract', () => {
  it('returns success Result with records for authenticated user', async () => {
    const records = [{ id: 'book-1' }];
    const eq = jest.fn().mockResolvedValue({ data: records, error: null });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
      providers: [
        BookRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(BookRepository);
    const result = await repository.getByUserId('user-1');

    expect(result).toEqual({ success: true, data: records });
    expect(from).toHaveBeenCalledWith('books');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('returns failure Result when Supabase returns an error', async () => {
    const eq = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
      providers: [
        BookRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(BookRepository);
    const result = await repository.getByUserId('user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.Network);
      expect(result.error.message).toContain('boom');
    }
  });

  it('creates a book record and returns success Result', async () => {
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'book-1',
            user_id: 'user-1',
            title: 'Solo Leveling',
            description: null,
            score: null,
            status: 'plan_to_read',
            genres: ['action'],
            language: null,
            chapter_count: null,
            cover_url: 'https://cdn.example.com/cover.jpg',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          error: null,
        }),
      }),
    });
    const from = jest.fn().mockReturnValue({ insert });

    TestBed.configureTestingModule({
      providers: [
        BookRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(BookRepository);
    const result = await repository.create('user-1', {
      title: 'Solo Leveling',
      description: null,
      score: null,
      status: 'plan_to_read',
      genres: ['action'],
      language: null,
      chapter_count: null,
      cover_url: 'https://cdn.example.com/cover.jpg',
    });

    expect(result.success).toBe(true);
    expect(from).toHaveBeenCalledWith('books');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      title: 'Solo Leveling',
      cover_url: 'https://cdn.example.com/cover.jpg',
    }));
  });

  it('adds source links, related links, and shelf links after create', async () => {
    const from = jest.fn((table: string) => ({
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      table,
    }));

    TestBed.configureTestingModule({
      providers: [
        BookRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(BookRepository);

    const sourceResult = await repository.addSources('book-1', [{ siteName: 'Example', url: 'https://example.com/book' }]);
    const relatedResult = await repository.addRelations('book-1', ['book-2']);
    const shelfResult = await repository.setShelfLinks('book-1', ['shelf-1']);

    expect(sourceResult.success).toBe(true);
    expect(relatedResult.success).toBe(true);
    expect(shelfResult.success).toBe(true);
    expect(from).toHaveBeenCalledWith('book_links');
    expect(from).toHaveBeenCalledWith('related_books');
    expect(from).toHaveBeenCalledWith('shelf_books');
  });

  it('returns first source URL for waiting latest-update checks', async () => {
    const limit = jest.fn().mockResolvedValue({
      data: [{ url: 'https://source.example/series-1' }],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
      providers: [
        BookRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(BookRepository);
    const result = await repository.getPrimarySourceUrl('book-1');

    expect(result).toEqual({ success: true, data: 'https://source.example/series-1' });
    expect(from).toHaveBeenCalledWith('book_links');
    expect(select).toHaveBeenCalledWith('url');
    expect(eq).toHaveBeenCalledWith('book_id', 'book-1');
    expect(limit).toHaveBeenCalledWith(1);
  });
});