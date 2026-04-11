import { inject, Injectable } from '@angular/core';
import { BookRecord } from '../../models/book.model';
import { ErrorCode, Result } from '../../models/result.model';
import { SUPABASE_CLIENT } from '../supabase.token';

@Injectable({ providedIn: 'root' })
export class BookRepository {
  private readonly supabase = inject(SUPABASE_CLIENT);

  async getByUserId(userId: string): Promise<Result<BookRecord[]>> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.Network,
          message: error.message,
          cause: error,
        },
      };
    }

    return {
      success: true,
      data: (data ?? []) as BookRecord[],
    };
  }
}