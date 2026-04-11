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
});