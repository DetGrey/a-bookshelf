import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BookRepository } from '../book/book.repository';
import { BookService } from '../book/book.service';
import { QualityToolsService } from './quality-tools.service';

describe('QualityToolsService', () => {
  it('groups duplicate titles and reuses cached scan results for the same book snapshot', () => {
    const repository = {
      update: jest.fn(),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        QualityToolsService,
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Solo Leveling',
                description: '',
                score: 8,
                status: 'reading',
                genres: ['action'],
                language: 'en',
                chapterCount: 10,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Solo Leveling',
                description: '',
                score: 9,
                status: 'completed',
                genres: ['fantasy'],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-03T00:00:00.000Z'),
              },
              {
                id: 'book-3',
                userId: 'user-1',
                title: 'Different',
                description: '',
                score: null,
                status: 'waiting',
                genres: [],
                language: 'en',
                chapterCount: 5,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-03T00:00:00.000Z'),
              },
            ]),
          },
        },
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const service = TestBed.inject(QualityToolsService);

    const first = service.scanDuplicateTitles();
    const second = service.scanDuplicateTitles();

    expect(first).toBe(second);
    expect(first.groups).toEqual([
      {
        title: 'Solo Leveling',
        normalizedTitle: 'solo leveling',
        books: ['book-1', 'book-2'],
        count: 2,
      },
    ]);
    expect(first.duplicateCount).toBe(1);
  });

  it('groups stale waiting books by age bucket and caches the scan result', () => {
    TestBed.configureTestingModule({
      providers: [
        QualityToolsService,
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Fresh',
                description: '',
                score: null,
                status: 'waiting',
                genres: [],
                language: 'en',
                chapterCount: 10,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-04-01T00:00:00.000Z'),
                lastFetchedAt: new Date('2026-04-01T00:00:00.000Z'),
              },
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Stale One',
                description: '',
                score: null,
                status: 'waiting',
                genres: [],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-02-01T00:00:00.000Z'),
                lastFetchedAt: new Date('2026-02-01T00:00:00.000Z'),
              },
              {
                id: 'book-3',
                userId: 'user-1',
                title: 'Also Stale',
                description: '',
                score: null,
                status: 'waiting',
                genres: [],
                language: 'en',
                chapterCount: 30,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-02-20T00:00:00.000Z'),
                lastFetchedAt: new Date('2026-02-20T00:00:00.000Z'),
              },
            ]),
          },
        },
        { provide: BookRepository, useValue: { update: jest.fn() } },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const service = TestBed.inject(QualityToolsService);
    const referenceDate = new Date('2026-04-11T00:00:00.000Z');

    const first = service.scanStaleWaiting(30, referenceDate);
    const second = service.scanStaleWaiting(30, referenceDate);

    expect(first).toBe(second);
    expect(first.groups).toEqual([
      {
        label: 'stale waiting',
        books: ['book-2', 'book-3'],
        count: 2,
        oldestDays: 69,
      },
    ]);
    expect(first.staleCount).toBe(2);
  });

  it('detects external cover urls and repairs them through the proxy helper when confirmed', async () => {
    const update = jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'book-1',
        user_id: 'user-1',
        title: 'Cover Book',
        description: null,
        score: null,
        status: 'reading',
        genres: [],
        language: null,
        chapter_count: null,
        cover_url: '/cdn-cgi/image/format=auto,quality=85/https%3A%2F%2Fexample.com%2Fcover.jpg',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-04-11T00:00:00.000Z',
      },
    });

    TestBed.configureTestingModule({
      providers: [
        QualityToolsService,
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Cover Book',
                description: '',
                score: null,
                status: 'reading',
                genres: [],
                language: 'en',
                chapterCount: null,
                coverUrl: 'https://example.com/cover.jpg',
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
          },
        },
        { provide: BookRepository, useValue: { update } },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const service = TestBed.inject(QualityToolsService);

    const scan = service.scanCoverHealth();
    expect(scan.issues).toEqual([
      {
        bookId: 'book-1',
        title: 'Cover Book',
        status: 'external',
        currentUrl: 'https://example.com/cover.jpg',
        suggestedUrl: '/cdn-cgi/image/format=auto,quality=85/https%3A%2F%2Fexample.com%2Fcover.jpg',
      },
    ]);

    const refusal = await service.repairExternalCovers(false);
    expect(refusal.success).toBe(false);

    const result = await service.repairExternalCovers(true);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.repairedCount).toBe(1);
      expect(result.data.skippedCount).toBe(0);
    }

    expect(update).toHaveBeenCalledWith('user-1', 'book-1', {
      cover_url: '/cdn-cgi/image/format=auto,quality=85/https%3A%2F%2Fexample.com%2Fcover.jpg',
    });
  });

  it('requires confirmation before consolidating genres and replaces matches when confirmed', async () => {
    const update = jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'book-1',
        user_id: 'user-1',
        title: 'Genre Book',
        description: null,
        score: null,
        status: 'reading',
        genres: ['shonen'],
        language: null,
        chapter_count: null,
        cover_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-04-11T00:00:00.000Z',
      },
    });

    TestBed.configureTestingModule({
      providers: [
        QualityToolsService,
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Genre Book',
                description: '',
                score: null,
                status: 'reading',
                genres: ['shounen', 'action'],
                language: 'en',
                chapterCount: null,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Other Book',
                description: '',
                score: null,
                status: 'reading',
                genres: ['shounen', 'drama'],
                language: 'en',
                chapterCount: null,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
          },
        },
        { provide: BookRepository, useValue: { update } },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const service = TestBed.inject(QualityToolsService);

    const refused = await service.consolidateGenres(['shounen'], 'shonen', false, 'replace');
    expect(refused.success).toBe(false);

    const result = await service.consolidateGenres(['shounen'], 'shonen', true, 'replace');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updatedCount).toBe(2);
      expect(result.data.targetGenre).toBe('shonen');
      expect(result.data.mode).toBe('replace');
    }

    expect(update).toHaveBeenCalledWith('user-1', 'book-1', { genres: ['shonen', 'action'] });
    expect(update).toHaveBeenCalledWith('user-1', 'book-2', { genres: ['shonen', 'drama'] });
  });
});