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

  it('creates a custom shelf and increments shelfCount', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      create: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'shelf-2',
          user_id: 'user-1',
          name: 'Weekend Reads',
          book_count: 0,
          created_at: '2026-01-05T00:00:00.000Z',
        },
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
    const result = await service.createShelf('Weekend Reads');

    expect(result.success).toBe(true);
    expect(service.shelfCount()).toBe(1);
    expect(service.shelves()[0]?.name).toBe('Weekend Reads');
  });

  it('keeps previous shelves and exposes actionable error when create fails', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      create: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'network', message: 'db unavailable' },
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
    service.shelves.set([
      {
        id: 'shelf-1',
        userId: 'user-1',
        name: 'Existing',
        bookCount: 3,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.createShelf('Weekend Reads');

    expect(result.success).toBe(false);
    expect(service.shelfCount()).toBe(1);
    expect(service.errorMessage()).toContain('Could not create shelf');
  });

  it('deletes a custom shelf and decrements shelfCount', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      delete: jest.fn().mockResolvedValue({ success: true, data: undefined }),
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
    service.shelves.set([
      {
        id: 'shelf-1',
        userId: 'user-1',
        name: 'Existing',
        bookCount: 3,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.deleteShelf('shelf-1');

    expect(result.success).toBe(true);
    expect(service.shelfCount()).toBe(0);
  });

  it('keeps shelves and exposes actionable error when delete fails', async () => {
    const repository = {
      getByUserId: jest.fn().mockResolvedValue({ success: true, data: [] }),
      delete: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'network', message: 'cannot delete' },
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
    service.shelves.set([
      {
        id: 'shelf-1',
        userId: 'user-1',
        name: 'Existing',
        bookCount: 3,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.deleteShelf('shelf-1');

    expect(result.success).toBe(false);
    expect(service.shelfCount()).toBe(1);
    expect(service.errorMessage()).toContain('Could not delete shelf');
  });
});