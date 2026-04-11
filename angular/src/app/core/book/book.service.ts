import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Book, BookFormModel, BookRecord } from '../../models/book.model';
import { ErrorCode, Result } from '../../models/result.model';
import { toBook, toSupabasePayload } from '../../models/mappers/book.mapper';
import { BookRepository } from './book.repository';
import { SUPABASE_CLIENT } from '../supabase.token';

export interface WaitingUpdateProgress {
  processed: number;
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface WaitingUpdateItemOutcome {
  bookId: string;
  title: string;
  status: 'updated' | 'skipped' | 'error';
  detail: string;
}

export interface WaitingUpdateSummary {
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  outcomes: WaitingUpdateItemOutcome[];
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly repository = inject(BookRepository);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private realtimeChannel: unknown | null = null;
  private realtimeUserId: string | null = null;
  private readonly pendingOptimisticBookIds = new Set<string>();

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

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();

      if (!user) {
        this.stopRealtimeSubscription();
        this.books.set([]);
        return;
      }

      void this.loadBooks();
      this.startRealtimeSubscription(user.id);
    });
  }

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

    this.pendingOptimisticBookIds.add(bookId);

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
      this.pendingOptimisticBookIds.delete(bookId);
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
        this.pendingOptimisticBookIds.delete(bookId);
        this.rollbackBooks(previousBooks, `Could not save book. ${stepResult.error.message}`);
        return { success: false, error: stepResult.error };
      }
    }

    const mappedBook = toBook(rowResult.data);
    this.books.update((books) => books.map((book) => (book.id === bookId ? mappedBook : book)));
    this.pendingOptimisticBookIds.delete(bookId);

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
    this.pendingOptimisticBookIds.add(bookId);
    this.books.update((books) => books.filter((book) => book.id !== bookId));
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const result = await this.repository.delete(user.id, bookId);
    if (!result.success) {
      this.pendingOptimisticBookIds.delete(bookId);
      this.rollbackBooks(previousBooks, `Could not delete book. ${result.error.message}`);
      return result;
    }

    this.pendingOptimisticBookIds.delete(bookId);
    this.isLoading.set(false);
    return { success: true, data: undefined };
  }

  async runWaitingShelfLatestUpdates(
    books: readonly Book[],
    options?: { batchSize?: number; throttleMs?: number; onProgress?: (progress: WaitingUpdateProgress) => void },
  ): Promise<Result<WaitingUpdateSummary>> {
    const user = this.auth.currentUser();
    if (!user) {
      const failure: Result<WaitingUpdateSummary> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to check waiting updates.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    const supabase = this.supabase;
    if (!supabase?.functions?.invoke) {
      const failure: Result<WaitingUpdateSummary> = {
        success: false,
        error: {
          code: ErrorCode.Unknown,
          message: 'Latest-update endpoint is not configured.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    const waitingBooks = books.filter((book) => book.status === 'waiting');
    const total = waitingBooks.length;
    const batchSize = Math.max(1, options?.batchSize ?? 3);
    const throttleMs = Math.max(0, options?.throttleMs ?? 250);

    const outcomes: WaitingUpdateItemOutcome[] = [];
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const emitProgress = () => {
      options?.onProgress?.({
        processed,
        total,
        updated,
        skipped,
        errors,
      });
    };

    const processBook = async (book: Book): Promise<void> => {
      const sourceResult = await this.repository.getPrimarySourceUrl(book.id);
      if (!sourceResult.success) {
        errors += 1;
        outcomes.push({
          bookId: book.id,
          title: book.title,
          status: 'error',
          detail: sourceResult.error.message,
        });
        processed += 1;
        emitProgress();
        return;
      }

      const sourceUrl = sourceResult.data?.trim() ?? '';
      if (!sourceUrl) {
        skipped += 1;
        outcomes.push({
          bookId: book.id,
          title: book.title,
          status: 'skipped',
          detail: 'No source URL available.',
        });
        processed += 1;
        emitProgress();
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-latest', {
        body: { url: sourceUrl },
      });

      if (error) {
        errors += 1;
        outcomes.push({
          bookId: book.id,
          title: book.title,
          status: 'error',
          detail: error.message ?? 'Latest fetch failed.',
        });
        processed += 1;
        emitProgress();
        return;
      }

      const payload = this.buildLatestUpdatePayload(book, (data ?? {}) as {
        latest_chapter?: string | null;
        chapter_count?: number | null;
        last_uploaded_at?: string | null;
      });

      if (Object.keys(payload).length === 0) {
        skipped += 1;
        outcomes.push({
          bookId: book.id,
          title: book.title,
          status: 'skipped',
          detail: 'No fields changed.',
        });
        processed += 1;
        emitProgress();
        return;
      }

      const updateResult = await this.repository.update(user.id, book.id, payload);
      if (!updateResult.success) {
        errors += 1;
        outcomes.push({
          bookId: book.id,
          title: book.title,
          status: 'error',
          detail: updateResult.error.message,
        });
        processed += 1;
        emitProgress();
        return;
      }

      updated += 1;
      outcomes.push({
        bookId: book.id,
        title: book.title,
        status: 'updated',
        detail: 'Updated latest fields.',
      });

      const mapped = toBook(updateResult.data);
      this.books.update((existing) => existing.map((item) => (item.id === mapped.id ? mapped : item)));

      processed += 1;
      emitProgress();
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);
    emitProgress();

    for (let start = 0; start < waitingBooks.length; start += batchSize) {
      const batch = waitingBooks.slice(start, start + batchSize);
      await Promise.all(batch.map((book) => processBook(book)));

      if (throttleMs > 0 && start + batchSize < waitingBooks.length) {
        await this.delay(throttleMs);
      }
    }

    this.isLoading.set(false);

    return {
      success: true,
      data: {
        updatedCount: updated,
        skippedCount: skipped,
        errorCount: errors,
        outcomes,
      },
    };
  }

  private rollbackBooks(previousBooks: Book[], message: string): void {
    this.books.set(previousBooks);
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

  private buildLatestUpdatePayload(
    current: Book,
    latest: { latest_chapter?: string | null; chapter_count?: number | null; last_uploaded_at?: string | null },
  ): Partial<BookRecord> {
    const payload: Partial<BookRecord> = {};

    const nextLatestChapter = typeof latest.latest_chapter === 'string' ? latest.latest_chapter.trim() : '';
    const currentLatestChapter = current.latestChapter?.trim() ?? '';
    if (nextLatestChapter && nextLatestChapter !== currentLatestChapter) {
      payload.latest_chapter = nextLatestChapter;
    }

    if (typeof latest.chapter_count === 'number' && Number.isFinite(latest.chapter_count)) {
      if (latest.chapter_count !== current.chapterCount) {
        payload.chapter_count = latest.chapter_count;
      }
    }

    const nextUploadedAt = latest.last_uploaded_at ?? null;
    const currentUploadedAt = current.lastUploadedAt ? current.lastUploadedAt.toISOString() : null;
    if (nextUploadedAt && nextUploadedAt !== currentUploadedAt) {
      payload.last_uploaded_at = nextUploadedAt;
    }

    return payload;
  }

  private async delay(milliseconds: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), milliseconds);
    });
  }

  private startRealtimeSubscription(userId: string): void {
    if (!this.supabase?.channel || !this.supabase.removeChannel) {
      return;
    }

    if (this.realtimeUserId === userId && this.realtimeChannel) {
      return;
    }

    this.stopRealtimeSubscription();

    const channel = this.supabase.channel(`books:realtime:${userId}`);
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'books',
        filter: `user_id=eq.${userId}`,
      }, (payload: unknown) => {
        this.applyRealtimeEvent(payload);
      })
      .subscribe();

    this.realtimeChannel = channel;
    this.realtimeUserId = userId;
  }

  private stopRealtimeSubscription(): void {
    if (!this.realtimeChannel || !this.supabase?.removeChannel) {
      this.realtimeChannel = null;
      this.realtimeUserId = null;
      return;
    }

    void this.supabase.removeChannel(this.realtimeChannel as never);
    this.realtimeChannel = null;
    this.realtimeUserId = null;
  }

  private applyRealtimeEvent(payload: unknown): void {
    const event = payload as {
      eventType?: string;
      new?: Record<string, unknown> | null;
      old?: Record<string, unknown> | null;
    };

    const eventType = String(event.eventType ?? '').toUpperCase();

    if (eventType === 'DELETE') {
      const deletedId = typeof event.old?.['id'] === 'string' ? String(event.old['id']) : null;
      if (!deletedId || this.pendingOptimisticBookIds.has(deletedId)) {
        return;
      }

      this.books.update((books) => books.filter((book) => book.id !== deletedId));
      return;
    }

    const record = event.new;
    if (!record || typeof record['id'] !== 'string') {
      return;
    }

    const recordId = String(record['id']);

    if (this.pendingOptimisticBookIds.has(recordId)) {
      return;
    }

    const nextBook = toBook(record as never);
    this.books.update((books) => {
      const existingIndex = books.findIndex((book) => book.id === nextBook.id);
      if (existingIndex === -1) {
        return [nextBook, ...books.filter((book) => book.id !== nextBook.id)];
      }

      return books.map((book) => (book.id === nextBook.id ? nextBook : book));
    });
  }
}