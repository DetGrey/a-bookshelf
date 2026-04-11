import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Book, BookFormModel } from '../../models/book.model';
import { ErrorCode, Result } from '../../models/result.model';
import { toBook, toSupabasePayload } from '../../models/mappers/book.mapper';
import { BookRepository } from './book.repository';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly repository = inject(BookRepository);
  private readonly auth = inject(AuthService);

  readonly books = signal<Book[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly bookCount = computed(() => this.books().length);
  readonly averageScore = computed(() => {
    const scoredBooks = this.books().filter((book) => typeof book.score === 'number' && book.score > 0);

    if (scoredBooks.length === 0) {
      return 0;
    }

    const sum = scoredBooks.reduce((accumulator, book) => accumulator + (book.score ?? 0), 0);
    return Number((sum / scoredBooks.length).toFixed(2));
  });

  async loadBooks(): Promise<Result<Book[]>> {
    const user = this.auth.currentUser();

    if (!user) {
      const failure: Result<Book[]> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to load books.',
        },
      };
      this.books.set([]);
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const result = await this.repository.getByUserId(user.id);

    this.isLoading.set(false);

    if (!result.success) {
      this.books.set([]);
      this.errorMessage.set(result.error.message);
      return result;
    }

    const mappedBooks = result.data.map(toBook);
    this.books.set(mappedBooks);

    return { success: true, data: mappedBooks };
  }

  async createBook(form: BookFormModel): Promise<Result<Book>> {
    const user = this.auth.currentUser();

    if (!user) {
      const failure: Result<Book> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to create a book.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const createResult = await this.repository.create(user.id, toSupabasePayload(form));
    if (!createResult.success) {
      this.isLoading.set(false);
      this.errorMessage.set(createResult.error.message);
      return createResult;
    }

    const createdRecord = createResult.data;
    const bookId = createdRecord.id;

    const sourcesResult = await this.repository.addSources(bookId, form.sources);
    if (!sourcesResult.success) {
      this.isLoading.set(false);
      this.errorMessage.set(`Could not save book. ${sourcesResult.error.message}`);
      return { success: false, error: sourcesResult.error };
    }

    const relationsResult = await this.repository.addRelations(bookId, form.relatedBookIds);
    if (!relationsResult.success) {
      this.isLoading.set(false);
      this.errorMessage.set(`Could not save book. ${relationsResult.error.message}`);
      return { success: false, error: relationsResult.error };
    }

    const shelvesResult = await this.repository.setShelfLinks(bookId, form.shelves);
    if (!shelvesResult.success) {
      this.isLoading.set(false);
      this.errorMessage.set(`Could not save book. ${shelvesResult.error.message}`);
      return { success: false, error: shelvesResult.error };
    }

    const mappedBook = toBook(createdRecord);
    this.books.update((existing) => [mappedBook, ...existing]);
    this.isLoading.set(false);

    return {
      success: true,
      data: mappedBook,
    };
  }
}