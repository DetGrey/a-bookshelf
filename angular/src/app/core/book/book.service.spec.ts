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
});