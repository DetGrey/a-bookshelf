import { inject, Injectable } from '@angular/core';
import { BookRecord, BookSourceDraft } from '../../models/book.model';
import { ErrorCode, Result } from '../../models/result.model';
import { SUPABASE_CLIENT } from '../supabase.token';

const BOOK_SELECT_COLUMNS = [
  'id',
  'user_id',
  'title',
  'description',
  'score',
  'status',
  'genres',
  'language',
  'chapter_count',
  'latest_chapter',
  'last_uploaded_at',
  'last_fetched_at',
  'notes',
  'times_read',
  'last_read',
  'original_language',
  'cover_url',
  'created_at',
  'updated_at',
].join(',');

@Injectable({ providedIn: 'root' })
export class BookRepository {
  private readonly supabase = inject(SUPABASE_CLIENT);

  async getByUserId(userId: string): Promise<Result<BookRecord[]>> {
    const { data, error } = await this.supabase
      .from('books')
      .select(BOOK_SELECT_COLUMNS)
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
      data: (data ?? []) as unknown as BookRecord[],
    };
  }

  async getById(userId: string, bookId: string): Promise<Result<BookRecord>> {
    const { data, error } = await this.supabase
      .from('books')
      .select(BOOK_SELECT_COLUMNS)
      .eq('user_id', userId)
      .eq('id', bookId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: ErrorCode.NotFound,
          message: error?.message ?? 'Book not found.',
          cause: error,
        },
      };
    }

    return {
      success: true,
      data: data as unknown as BookRecord,
    };
  }

  async getSources(bookId: string): Promise<Result<Array<{ site_name: string | null; url: string }>>> {
    const { data, error } = await this.supabase
      .from('book_links')
      .select('site_name,url')
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

    return {
      success: true,
      data: (data ?? []) as Array<{ site_name: string | null; url: string }>,
    };
  }

  async getPrimarySourceUrl(bookId: string): Promise<Result<string | null>> {
    const { data, error } = await this.supabase
      .from('book_links')
      .select('url')
      .eq('book_id', bookId)
      .limit(1);

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

    const rows = (data ?? []) as Array<{ url: string | null }>;
    const firstUrl = rows[0]?.url ?? null;
    return {
      success: true,
      data: firstUrl,
    };
  }

  async getRelations(bookId: string): Promise<Result<Array<{ related_book_id: string; relationship_type: string | null }>>> {
    const { data, error } = await this.supabase
      .from('related_books')
      .select('related_book_id,relationship_type')
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

    return {
      success: true,
      data: (data ?? []) as Array<{ related_book_id: string; relationship_type: string | null }>,
    };
  }

  async getShelfIds(bookId: string): Promise<Result<string[]>> {
    const { data, error } = await this.supabase
      .from('shelf_books')
      .select('shelf_id')
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

    const shelfIds = ((data ?? []) as Array<{ shelf_id: string }>).map((row) => row.shelf_id);

    return {
      success: true,
      data: shelfIds,
    };
  }

  async getShelvesByIds(userId: string, shelfIds: readonly string[]): Promise<Result<Array<{ id: string; name: string }>>> {
    if (shelfIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await this.supabase
      .from('shelves')
      .select('id,name')
      .eq('user_id', userId)
      .in('id', [...shelfIds]);

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
      data: (data ?? []) as Array<{ id: string; name: string }>,
    };
  }

  async create(userId: string, payload: Partial<BookRecord>): Promise<Result<BookRecord>> {
    const { data, error } = await this.supabase
      .from('books')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: ErrorCode.Network,
          message: error?.message ?? 'Failed to create book.',
          cause: error,
        },
      };
    }

    return {
      success: true,
      data: data as BookRecord,
    };
  }

  async update(userId: string, bookId: string, payload: Partial<BookRecord>): Promise<Result<BookRecord>> {
    const { data, error } = await this.supabase
      .from('books')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', bookId)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: ErrorCode.Network,
          message: error?.message ?? 'Failed to update book.',
          cause: error,
        },
      };
    }

    return {
      success: true,
      data: data as BookRecord,
    };
  }

  async delete(userId: string, bookId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('books')
      .delete()
      .eq('user_id', userId)
      .eq('id', bookId);

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

  async upsertBooks(records: readonly BookRecord[]): Promise<Result<void>> {
    if (records.length === 0) {
      return { success: true, data: undefined };
    }

    const { error } = await this.supabase.from('books').upsert(records);
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

  async upsertBookLinks(records: Array<{ bookId: string; siteName: string | null; url: string }>): Promise<Result<void>> {
    if (records.length === 0) {
      return { success: true, data: undefined };
    }

    const payload = records.map((record) => ({
      book_id: record.bookId,
      site_name: record.siteName,
      url: record.url,
    }));

    const { error } = await this.supabase.from('book_links').insert(payload);
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

  async upsertRelatedBooks(records: Array<{ bookId: string; relatedBookId: string; relationshipType: string | null }>): Promise<Result<void>> {
    if (records.length === 0) {
      return { success: true, data: undefined };
    }

    const payload = records.map((record) => ({
      book_id: record.bookId,
      related_book_id: record.relatedBookId,
      relationship_type: record.relationshipType,
    }));

    const { error } = await this.supabase.from('related_books').insert(payload);
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

  async upsertShelfBooks(records: Array<{ shelfId: string; bookId: string }>): Promise<Result<void>> {
    if (records.length === 0) {
      return { success: true, data: undefined };
    }

    const payload = records.map((record) => ({
      shelf_id: record.shelfId,
      book_id: record.bookId,
    }));

    const { error } = await this.supabase.from('shelf_books').insert(payload);
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

  async addSources(bookId: string, sources: readonly BookSourceDraft[]): Promise<Result<void>> {
    if (sources.length === 0) {
      return { success: true, data: undefined };
    }

    const payload = sources.map((source) => ({
      book_id: bookId,
      site_name: source.siteName.trim() || null,
      url: source.url.trim(),
    }));

    const { error } = await this.supabase.from('book_links').insert(payload);

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

  async removeSources(bookId: string, urls: readonly string[]): Promise<Result<void>> {
    if (urls.length === 0) {
      return { success: true, data: undefined };
    }

    const { error } = await this.supabase
      .from('book_links')
      .delete()
      .eq('book_id', bookId)
      .in('url', [...urls]);

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

  async addRelations(bookId: string, relatedBookIds: readonly string[]): Promise<Result<void>> {
    if (relatedBookIds.length === 0) {
      return { success: true, data: undefined };
    }

    const payload = relatedBookIds.map((relatedBookId) => ({
      book_id: bookId,
      related_book_id: relatedBookId,
      relationship_type: 'related',
    }));

    const { error } = await this.supabase.from('related_books').insert(payload);

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

  async removeRelations(bookId: string, relatedBookIds: readonly string[]): Promise<Result<void>> {
    if (relatedBookIds.length === 0) {
      return { success: true, data: undefined };
    }

    const { error } = await this.supabase
      .from('related_books')
      .delete()
      .eq('book_id', bookId)
      .in('related_book_id', [...relatedBookIds]);

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

  async setShelfLinks(bookId: string, shelfIds: readonly string[]): Promise<Result<void>> {
    if (shelfIds.length === 0) {
      return { success: true, data: undefined };
    }

    const payload = shelfIds.map((shelfId) => ({
      shelf_id: shelfId,
      book_id: bookId,
    }));

    const { error } = await this.supabase.from('shelf_books').insert(payload);

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

  async removeShelfLinks(bookId: string, shelfIds: readonly string[]): Promise<Result<void>> {
    if (shelfIds.length === 0) {
      return { success: true, data: undefined };
    }

    const { error } = await this.supabase
      .from('shelf_books')
      .delete()
      .eq('book_id', bookId)
      .in('shelf_id', [...shelfIds]);

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