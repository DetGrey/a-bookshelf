import { EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BookRepository } from '../../core/book/book.repository';
import { ErrorCode } from '../../models/result.model';
import { bookDetailResolver } from './book-details.resolver';

describe('bookDetailResolver', () => {
  const routeSnapshot = {
    paramMap: {
      get: (key: string) => (key === 'bookId' ? 'book-1' : null),
    },
  } as unknown as ActivatedRouteSnapshot;

  const stateSnapshot = {} as RouterStateSnapshot;

  it('returns success with resolved book details', async () => {
    const repository = {
      getById: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-1',
          user_id: 'user-1',
          title: 'Solo Leveling',
          description: 'desc',
          score: 9,
          status: 'reading',
          genres: ['action'],
          language: 'en',
          chapter_count: 200,
          cover_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      }),
      getSources: jest.fn().mockResolvedValue({ success: true, data: [{ site_name: 'Example', url: 'https://example.com/solo' }] }),
      getRelations: jest.fn().mockResolvedValue({ success: true, data: [{ related_book_id: 'book-2', relationship_type: 'related' }] }),
      getShelfIds: jest.fn().mockResolvedValue({ success: true, data: ['shelf-1'] }),
      getShelvesByIds: jest.fn().mockResolvedValue({ success: true, data: [{ id: 'shelf-1', name: 'Favorites' }] }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    const result = await runInInjectionContext(injector, () => bookDetailResolver(routeSnapshot, stateSnapshot));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.book.title).toBe('Solo Leveling');
      expect(result.data.sources).toEqual([{ siteName: 'Example', url: 'https://example.com/solo' }]);
      expect(result.data.relatedBooks[0]?.bookId).toBe('book-2');
      expect(result.data.shelves[0]?.name).toBe('Favorites');
    }
  });

  it('returns not_found failure when book is missing', async () => {
    const repository = {
      getById: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: ErrorCode.NotFound,
          message: 'Book not found',
        },
      }),
    } as unknown as BookRepository;

    TestBed.configureTestingModule({
      providers: [
        { provide: BookRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    const result = await runInInjectionContext(injector, () => bookDetailResolver(routeSnapshot, stateSnapshot));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.NotFound);
    }
  });
});
