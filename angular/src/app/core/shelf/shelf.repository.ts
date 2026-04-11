import { inject, Injectable } from '@angular/core';
import { ErrorCode, Result } from '../../models/result.model';
import { ShelfRecord } from '../../models/shelf.model';
import { SUPABASE_CLIENT } from '../supabase.token';

@Injectable({ providedIn: 'root' })
export class ShelfRepository {
  private readonly supabase = inject(SUPABASE_CLIENT);

  async getByUserId(userId: string): Promise<Result<ShelfRecord[]>> {
    const { data, error } = await this.supabase
      .from('shelves')
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
      data: (data ?? []) as ShelfRecord[],
    };
  }
}