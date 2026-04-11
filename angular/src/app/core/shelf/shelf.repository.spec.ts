import { TestBed } from '@angular/core/testing';
import { ErrorCode } from '../../models/result.model';
import { SUPABASE_CLIENT } from '../supabase.token';
import { ShelfRepository } from './shelf.repository';

describe('ShelfRepository read contract', () => {
  it('returns success Result with shelf records', async () => {
    const records = [{ id: 'shelf-1', name: 'Favorites' }];
    const eq = jest.fn().mockResolvedValue({ data: records, error: null });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
      providers: [
        ShelfRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(ShelfRepository);
    const result = await repository.getByUserId('user-1');

    expect(result).toEqual({ success: true, data: records });
    expect(from).toHaveBeenCalledWith('shelves');
    expect(select).toHaveBeenCalledWith('id,user_id,name,created_at,shelf_books(book_id)');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('returns failure Result when Supabase returns an error', async () => {
    const eq = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
      providers: [
        ShelfRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(ShelfRepository);
    const result = await repository.getByUserId('user-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.Network);
      expect(result.error.message).toContain('boom');
    }
  });

  it('creates a custom shelf and returns success Result', async () => {
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'shelf-2',
            user_id: 'user-1',
            name: 'Weekend Reads',
            book_count: 0,
            created_at: '2026-01-05T00:00:00.000Z',
          },
          error: null,
        }),
      }),
    });
    const from = jest.fn().mockReturnValue({ insert });

    TestBed.configureTestingModule({
      providers: [
        ShelfRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(ShelfRepository);
    const result = await repository.create('user-1', 'Weekend Reads');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Weekend Reads');
    }
    expect(from).toHaveBeenCalledWith('shelves');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-1', name: 'Weekend Reads' });
  });

  it('returns failure Result when create shelf fails', async () => {
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      }),
    });
    const from = jest.fn().mockReturnValue({ insert });

    TestBed.configureTestingModule({
      providers: [
        ShelfRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(ShelfRepository);
    const result = await repository.create('user-1', 'Weekend Reads');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.Network);
      expect(result.error.message).toContain('insert failed');
    }
  });

  it('deletes a custom shelf and returns success Result', async () => {
    const eqUser = jest.fn().mockResolvedValue({ error: null });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const deleteFn = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ delete: deleteFn });

    TestBed.configureTestingModule({
      providers: [
        ShelfRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(ShelfRepository);
    const result = await repository.delete('user-1', 'shelf-2');

    expect(result).toEqual({ success: true, data: undefined });
    expect(from).toHaveBeenCalledWith('shelves');
    expect(eqId).toHaveBeenCalledWith('id', 'shelf-2');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('returns failure Result when delete shelf fails', async () => {
    const eqUser = jest.fn().mockResolvedValue({ error: { message: 'delete failed' } });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const deleteFn = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ delete: deleteFn });

    TestBed.configureTestingModule({
      providers: [
        ShelfRepository,
        { provide: SUPABASE_CLIENT, useValue: { from } },
      ],
    });

    const repository = TestBed.inject(ShelfRepository);
    const result = await repository.delete('user-1', 'shelf-2');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.Network);
      expect(result.error.message).toContain('delete failed');
    }
  });
});