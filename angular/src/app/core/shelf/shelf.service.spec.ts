import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ShelfRepository } from './shelf.repository';
import { ShelfService } from './shelf.service';

describe('ShelfService read state', () => {
  it('loads shelves and exposes shelfCount', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'shelf-1',
            user_id: 'user-1',
            name: 'Favorites',
            book_count: 2,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    } as unknown as ShelfRepository;

    TestBed.configureTestingModule({
      providers: [
        ShelfService,
        { provide: ShelfRepository, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1' }),
          },
        },
      ],
    });

    const service = TestBed.inject(ShelfService);
    const result = await service.loadShelves();

    expect(result.success).toBe(true);
    expect(service.shelves().length).toBe(1);
    expect(service.shelfCount()).toBe(1);
    expect(service.errorMessage()).toBeNull();
  });
});