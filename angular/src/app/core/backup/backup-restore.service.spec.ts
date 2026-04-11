import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { BookRepository } from '../book/book.repository';
import { ShelfRepository } from '../shelf/shelf.repository';
import { BackupRestoreService } from './backup-restore.service';

describe('BackupRestoreService', () => {
  it('exports profile, books, shelves, joins, and links into a complete payload', async () => {
    const getByUserId = jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'book-1',
          user_id: 'user-1',
          title: 'Solo Leveling',
          description: 'Hunters and gates',
          score: 9,
          status: 'reading',
          genres: ['action'],
          language: 'en',
          chapter_count: 200,
          latest_chapter: 'Ch 200',
          last_uploaded_at: '2026-01-01T00:00:00.000Z',
          last_fetched_at: '2026-01-02T00:00:00.000Z',
          cover_url: 'https://example.com/cover.jpg',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    const getSources = jest.fn().mockResolvedValue({
      success: true,
      data: [{ site_name: 'Example', url: 'https://example.com/solo' }],
    });
    const getRelations = jest.fn().mockResolvedValue({
      success: true,
      data: [{ related_book_id: 'book-2', relationship_type: 'related' }],
    });
    const getShelfIds = jest.fn().mockResolvedValue({
      success: true,
      data: ['shelf-1'],
    });
    const shelfGetByUserId = jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'shelf-1',
          user_id: 'user-1',
          name: 'Favorites',
          book_count: 1,
          shelf_books: [{ book_id: 'book-1' }],
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    TestBed.configureTestingModule({
      providers: [
        BackupRestoreService,
        { provide: BookRepository, useValue: { getByUserId, getSources, getRelations, getShelfIds } },
        { provide: ShelfRepository, useValue: { getByUserId: shelfGetByUserId } },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1', email: 'reader@example.com' } as never),
          },
        },
      ],
    });

    const service = TestBed.inject(BackupRestoreService);
    const result = await service.exportLibrary();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile).toEqual({ id: 'user-1', email: 'reader@example.com' });
      expect(result.data.books).toHaveLength(1);
      expect(result.data.shelves).toHaveLength(1);
      expect(result.data.bookLinks).toEqual([
        { bookId: 'book-1', siteName: 'Example', url: 'https://example.com/solo' },
      ]);
      expect(result.data.relatedBooks).toEqual([
        { bookId: 'book-1', relatedBookId: 'book-2', relationshipType: 'related' },
      ]);
      expect(result.data.shelfBooks).toEqual([
        { shelfId: 'shelf-1', bookId: 'book-1' },
      ]);
    }
  });

  it('restores books and shelves in chunks while reporting partial failures', async () => {
    const upsertBooks = jest
      .fn()
      .mockResolvedValueOnce({ success: true, data: undefined })
      .mockResolvedValueOnce({ success: false, error: { code: 'network', message: 'books chunk failed' } });
    const upsertShelves = jest.fn().mockResolvedValue({ success: true, data: undefined });
    const upsertBookLinks = jest.fn().mockResolvedValue({ success: true, data: undefined });
    const upsertRelatedBooks = jest.fn().mockResolvedValue({ success: true, data: undefined });
    const upsertShelfBooks = jest.fn().mockResolvedValue({ success: true, data: undefined });

    TestBed.configureTestingModule({
      providers: [
        BackupRestoreService,
        {
          provide: BookRepository,
          useValue: {
            upsertBooks,
            upsertBookLinks,
            upsertRelatedBooks,
            upsertShelfBooks,
          },
        },
        {
          provide: ShelfRepository,
          useValue: {
            upsertShelves,
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1', email: 'reader@example.com' } as never),
          },
        },
      ],
    });

    const service = TestBed.inject(BackupRestoreService);
    const result = await service.restoreLibrary({
      profile: { id: 'user-1', email: 'reader@example.com' },
      books: [
        {
          id: 'book-1',
          user_id: 'user-1',
          title: 'A',
          description: null,
          score: null,
          status: 'reading',
          genres: [],
          language: null,
          chapter_count: null,
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'book-2',
          user_id: 'user-1',
          title: 'B',
          description: null,
          score: null,
          status: 'waiting',
          genres: [],
          language: null,
          chapter_count: null,
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'book-3',
          user_id: 'user-1',
          title: 'C',
          description: null,
          score: null,
          status: 'completed',
          genres: [],
          language: null,
          chapter_count: null,
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      shelves: [
        {
          id: 'shelf-1',
          user_id: 'user-1',
          name: 'Favorites',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      bookLinks: [],
      relatedBooks: [],
      shelfBooks: [],
    }, { chunkSize: 2 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.booksUpserted).toBe(2);
      expect(result.data.shelvesUpserted).toBe(1);
      expect(result.data.errorCount).toBe(1);
      expect(result.data.errors[0]?.message).toContain('books chunk failed');
    }

    expect(upsertBooks).toHaveBeenCalledTimes(2);
    expect(upsertBooks).toHaveBeenNthCalledWith(1, [expect.objectContaining({ id: 'book-1' }), expect.objectContaining({ id: 'book-2' })]);
    expect(upsertBooks).toHaveBeenNthCalledWith(2, [expect.objectContaining({ id: 'book-3' })]);
    expect(upsertShelves).toHaveBeenCalledWith([expect.objectContaining({ id: 'shelf-1' })]);
  });
});