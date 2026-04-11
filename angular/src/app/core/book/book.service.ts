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

  async updateBook(
    bookId: string,
    form: BookFormModel,
    current: { sources: BookFormModel['sources']; relatedBookIds: string[]; shelfIds: string[] },
  ): Promise<Result<Book>> {
    const user = this.auth.currentUser();
    if (!user) {
      const failure: Result<Book> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to update a book.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    const previousBooks = this.books();
    const optimisticUpdatedAt = new Date();
    this.books.update((books) => books.map((book) => {
      if (book.id !== bookId) {
        return book;
      }

      return {
        ...book,
        title: form.title,
        description: form.description,
        score: form.score,
        status: form.status ?? book.status,
        genres: form.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
        language: form.language.trim() || null,
        chapterCount: form.chapterCount,
        coverUrl: form.coverUrl.trim() || null,
        updatedAt: optimisticUpdatedAt,
      };
    }));

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const rowResult = await this.repository.update(user.id, bookId, toSupabasePayload(form));
    if (!rowResult.success) {
      this.rollbackBooks(previousBooks, `Could not save book. ${rowResult.error.message}`);
      return rowResult;
    }

    const currentSourceUrls = new Set(current.sources.map((source) => source.url));
    const nextSourceUrls = new Set(form.sources.map((source) => source.url));
    const removedSourceUrls = [...currentSourceUrls].filter((url) => !nextSourceUrls.has(url));
    const addedSources = form.sources.filter((source) => !currentSourceUrls.has(source.url));

    const removedRelatedIds = current.relatedBookIds.filter((id) => !form.relatedBookIds.includes(id));
    const addedRelatedIds = form.relatedBookIds.filter((id) => !current.relatedBookIds.includes(id));

    const removedShelfIds = current.shelfIds.filter((id) => !form.shelves.includes(id));
    const addedShelfIds = form.shelves.filter((id) => !current.shelfIds.includes(id));

    const steps: Array<() => Promise<Result<void>>> = [
      () => this.repository.removeSources(bookId, removedSourceUrls),
      () => this.repository.addSources(bookId, addedSources),
      () => this.repository.removeRelations(bookId, removedRelatedIds),
      () => this.repository.addRelations(bookId, addedRelatedIds),
      () => this.repository.removeShelfLinks(bookId, removedShelfIds),
      () => this.repository.setShelfLinks(bookId, addedShelfIds),
    ];

    for (const runStep of steps) {
      const stepResult = await runStep();
      if (!stepResult.success) {
        this.rollbackBooks(previousBooks, `Could not save book. ${stepResult.error.message}`);
        return { success: false, error: stepResult.error };
      }
    }

    const mappedBook = toBook(rowResult.data);
    this.books.update((books) => books.map((book) => (book.id === bookId ? mappedBook : book)));

    this.isLoading.set(false);

    return {
      success: true,
      data: mappedBook,
    };
  }

  async deleteBook(bookId: string): Promise<Result<void>> {
    const user = this.auth.currentUser();
    if (!user) {
      const failure: Result<void> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to delete a book.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    const previousBooks = this.books();
    this.books.update((books) => books.filter((book) => book.id !== bookId));
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const result = await this.repository.delete(user.id, bookId);
    if (!result.success) {
      this.rollbackBooks(previousBooks, `Could not delete book. ${result.error.message}`);
      return result;
    }

    this.isLoading.set(false);
    return { success: true, data: undefined };
  }

  private rollbackBooks(previousBooks: Book[], message: string): void {
    this.books.set(previousBooks);
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }
}