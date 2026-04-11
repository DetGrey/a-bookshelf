import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BookRepository } from '../../core/book/book.repository';
import { toBook } from '../../models/mappers/book.mapper';
import { ErrorCode, Result } from '../../models/result.model';

export interface BookDetailResolved {
  book: ReturnType<typeof toBook>;
  sources: Array<{ siteName: string; url: string }>;
  relatedBooks: Array<{ bookId: string; relation: string }>;
  shelves: Array<{ id: string; name: string }>;
}

export const bookDetailResolver: ResolveFn<Result<BookDetailResolved>> = async (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const repository = inject(BookRepository);

  const user = auth.currentUser();
  if (!user) {
    return {
      success: false,
      error: {
        code: ErrorCode.Unauthorized,
        message: 'Authentication required to view book details.',
      },
    };
  }

  const bookId = route.paramMap.get('bookId');
  if (!bookId) {
    return {
      success: false,
      error: {
        code: ErrorCode.Validation,
        message: 'Missing book id.',
      },
    };
  }

  const bookResult = await repository.getById(user.id, bookId);
  if (!bookResult.success) {
    return bookResult;
  }

  const [sourcesResult, relationsResult, shelfIdsResult] = await Promise.all([
    repository.getSources(bookId),
    repository.getRelations(bookId),
    repository.getShelfIds(bookId),
  ]);

  if (!sourcesResult.success) {
    return { success: false, error: sourcesResult.error };
  }
  if (!relationsResult.success) {
    return { success: false, error: relationsResult.error };
  }
  if (!shelfIdsResult.success) {
    return { success: false, error: shelfIdsResult.error };
  }

  const shelvesResult = await repository.getShelvesByIds(user.id, shelfIdsResult.data);
  if (!shelvesResult.success) {
    return { success: false, error: shelvesResult.error };
  }

  return {
    success: true,
    data: {
      book: toBook(bookResult.data),
      sources: sourcesResult.data.map((source) => ({
        siteName: source.site_name ?? 'Source',
        url: source.url,
      })),
      relatedBooks: relationsResult.data.map((related) => ({
        bookId: related.related_book_id,
        relation: related.relationship_type ?? 'related',
      })),
      shelves: shelvesResult.data,
    },
  };
};
