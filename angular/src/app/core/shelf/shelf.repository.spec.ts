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
    expect(select).toHaveBeenCalledWith('*');
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
});