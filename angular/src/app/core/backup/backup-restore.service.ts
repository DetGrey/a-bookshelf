import { inject, Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';
import { BookRepository } from '../book/book.repository';
import { ErrorCode, Result } from '../../models/result.model';
import { ShelfRepository } from '../shelf/shelf.repository';
import { BookRecord } from '../../models/book.model';
import { ShelfRecord } from '../../models/shelf.model';

export interface BackupProfileRecord {
  id: string;
  email: string | null;
}

export interface BackupBookLinkRecord {
  bookId: string;
  siteName: string | null;
  url: string;
}

export interface BackupRelatedBookRecord {
  bookId: string;
  relatedBookId: string;
  relationshipType: string | null;
}

export interface BackupShelfBookRecord {
  shelfId: string;
  bookId: string;
}

export interface BackupPayload {
  profile: BackupProfileRecord;
  books: BookRecord[];
  shelves: ShelfRecord[];
  bookLinks: BackupBookLinkRecord[];
  relatedBooks: BackupRelatedBookRecord[];
  shelfBooks: BackupShelfBookRecord[];
}

export interface BackupRestoreErrorDetail {
  section: string;
  message: string;
}

export interface BackupRestoreSummary {
  booksUpserted: number;
  shelvesUpserted: number;
  bookLinksUpserted: number;
  relatedBooksUpserted: number;
  shelfBooksUpserted: number;
  errorCount: number;
  errors: BackupRestoreErrorDetail[];
}

@Injectable({ providedIn: 'root' })
export class BackupRestoreService {
  private readonly auth = inject(AuthService);
  private readonly books = inject(BookRepository);
  private readonly shelves = inject(ShelfRepository);

  async exportLibrary(): Promise<Result<BackupPayload>> {
    const user = this.auth.currentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to export a backup.',
        },
      };
    }

    const booksResult = await this.books.getByUserId(user.id);
    if (!booksResult.success) {
      return {
        success: false,
        error: booksResult.error,
      };
    }

    const shelvesResult = await this.shelves.getByUserId(user.id);
    if (!shelvesResult.success) {
      return {
        success: false,
        error: shelvesResult.error,
      };
    }

    const bookLinks: BackupBookLinkRecord[] = [];
    const relatedBooks: BackupRelatedBookRecord[] = [];
    const shelfBooks: BackupShelfBookRecord[] = [];

    for (const book of booksResult.data) {
      const [sourcesResult, relationsResult, bookShelfIdsResult] = await Promise.all([
        this.books.getSources(book.id),
        this.books.getRelations(book.id),
        this.books.getShelfIds(book.id),
      ]);

      if (!sourcesResult.success) return { success: false, error: sourcesResult.error };
      if (!relationsResult.success) return { success: false, error: relationsResult.error };
      if (!bookShelfIdsResult.success) return { success: false, error: bookShelfIdsResult.error };

      sourcesResult.data.forEach((source) => {
        bookLinks.push({
          bookId: book.id,
          siteName: source.site_name,
          url: source.url,
        });
      });

      relationsResult.data.forEach((relation) => {
        relatedBooks.push({
          bookId: book.id,
          relatedBookId: relation.related_book_id,
          relationshipType: relation.relationship_type,
        });
      });

      bookShelfIdsResult.data.forEach((shelfId) => {
        shelfBooks.push({
          shelfId,
          bookId: book.id,
        });
      });
    }

    return {
      success: true,
      data: {
        profile: {
          id: user.id,
          email: user.email ?? null,
        },
        books: booksResult.data,
        shelves: shelvesResult.data,
        bookLinks,
        relatedBooks,
        shelfBooks,
      },
    };
  }

  async restoreLibrary(payload: BackupPayload, options?: { chunkSize?: number }): Promise<Result<BackupRestoreSummary>> {
    const user = this.auth.currentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to restore a backup.',
        },
      };
    }

    const chunkSize = Math.max(1, options?.chunkSize ?? 25);
    const errors: BackupRestoreErrorDetail[] = [];
    let booksUpserted = 0;
    let shelvesUpserted = 0;
    let bookLinksUpserted = 0;
    let relatedBooksUpserted = 0;
    let shelfBooksUpserted = 0;

    const restoreChunks = async <T>(
      section: string,
      items: readonly T[],
      runner: (chunk: T[]) => Promise<Result<void>>,
      onSuccess: (count: number) => void,
    ): Promise<void> => {
      for (let index = 0; index < items.length; index += chunkSize) {
        const chunk = items.slice(index, index + chunkSize);
        const result = await runner([...chunk]);
        if (!result.success) {
          errors.push({ section, message: result.error.message });
          continue;
        }
        onSuccess(chunk.length);
      }
    };

    await restoreChunks('books', payload.books, (chunk) => this.books.upsertBooks(chunk), (count) => {
      booksUpserted += count;
    });

    await restoreChunks('shelves', payload.shelves, (chunk) => this.shelves.upsertShelves(chunk), (count) => {
      shelvesUpserted += count;
    });

    await restoreChunks('bookLinks', payload.bookLinks, (chunk) => this.books.upsertBookLinks(chunk), (count) => {
      bookLinksUpserted += count;
    });

    await restoreChunks('relatedBooks', payload.relatedBooks, (chunk) => this.books.upsertRelatedBooks(chunk), (count) => {
      relatedBooksUpserted += count;
    });

    await restoreChunks('shelfBooks', payload.shelfBooks, (chunk) => this.books.upsertShelfBooks(chunk), (count) => {
      shelfBooksUpserted += count;
    });

    return {
      success: true,
      data: {
        booksUpserted,
        shelvesUpserted,
        bookLinksUpserted,
        relatedBooksUpserted,
        shelfBooksUpserted,
        errorCount: errors.length,
        errors,
      },
    };
  }
}