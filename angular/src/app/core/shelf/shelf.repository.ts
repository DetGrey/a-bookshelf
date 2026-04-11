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
      .select('id,user_id,name,created_at,shelf_books(book_id)')
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

  async create(userId: string, name: string): Promise<Result<ShelfRecord>> {
    const { data, error } = await this.supabase
      .from('shelves')
      .insert({ user_id: userId, name })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: ErrorCode.Network,
          message: error?.message ?? 'Failed to create shelf.',
          cause: error,
        },
      };
    }

    return {
      success: true,
      data: data as ShelfRecord,
    };
  }

  async delete(userId: string, shelfId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('shelves')
      .delete()
      .eq('id', shelfId)
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
      data: undefined,
    };
  }

  async upsertShelves(records: readonly ShelfRecord[]): Promise<Result<void>> {
    if (records.length === 0) {
      return { success: true, data: undefined };
    }

    const { error } = await this.supabase.from('shelves').upsert(records);
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

    return { success: true, data: undefined };
  }

  async addBookToShelf(shelfId: string, bookId: string): Promise<Result<void>> {
    const { error } = await this.supabase.from('shelf_books').insert({
      shelf_id: shelfId,
      book_id: bookId,
    });

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

    return { success: true, data: undefined };
  }

  async removeBookFromShelf(shelfId: string, bookId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('shelf_books')
      .delete()
      .eq('shelf_id', shelfId)
      .eq('book_id', bookId);

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

    return { success: true, data: undefined };
  }
}