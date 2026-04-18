import { Book, BookFormModel, BookRecord, BookStatus } from '../book.model';

const DEFAULT_STATUS: BookStatus = 'plan_to_read';

const isBookStatus = (value: string): value is BookStatus => {
  return ['reading', 'plan_to_read', 'waiting', 'completed', 'dropped', 'on_hold'].includes(value);
};

export function toBook(record: BookRecord): Book {
  const status = isBookStatus(record.status) ? record.status : DEFAULT_STATUS;

  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    description: record.description ?? '',
    score: record.score,
    status,
    genres: record.genres ?? [],
    language: record.language,
    chapterCount: record.chapter_count,
    latestChapter: record.latest_chapter ?? null,
    lastUploadedAt: record.last_uploaded_at ? new Date(record.last_uploaded_at) : null,
    lastFetchedAt: record.last_fetched_at ? new Date(record.last_fetched_at) : null,
    notes: record.notes ?? null,
    timesRead: Math.max(1, record.times_read ?? 1),
    lastRead: record.last_read ?? null,
    originalLanguage: record.original_language ?? null,
    coverUrl: record.cover_url,
    sources: (record.book_links ?? []).map((link) => ({
      siteName: link.site_name ?? 'Source',
      url: link.url,
    })),
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return '';
  // Format as "YYYY-MM-DDTHH:MM:SS" (no timezone) for datetime-local input
  return date.toISOString().slice(0, 19);
}

export function toFormModel(book: Book): BookFormModel {
  return {
    title: book.title,
    description: book.description,
    score: book.score,
    status: book.status,
    genres: book.genres.join(', '),
    language: book.language ?? '',
    chapterCount: book.chapterCount,
    coverUrl: book.coverUrl ?? '',
    notes: book.notes ?? '',
    timesRead: book.timesRead,
    lastRead: book.lastRead ?? '',
    latestChapter: book.latestChapter ?? '',
    lastUploadedAt: toDatetimeLocal(book.lastUploadedAt),
    lastFetchedAt: toDatetimeLocal(book.lastFetchedAt),
    originalLanguage: book.originalLanguage ?? '',
    sources: [...(book.sources ?? [])],
    shelves: [],
    relatedBookIds: [],
  };
}

export function toSupabasePayload(form: BookFormModel): Partial<BookRecord> {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    score: form.score,
    status: form.status ?? DEFAULT_STATUS,
    genres: form.genres
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean),
    language: form.language.trim() || null,
    chapter_count: form.chapterCount,
    cover_url: form.coverUrl.trim() || null,
    notes: form.notes.trim() || null,
    times_read: Math.max(1, form.timesRead || 1),
    last_read: form.lastRead.trim() || null,
    latest_chapter: form.latestChapter.trim() || null,
    last_uploaded_at: form.lastUploadedAt.trim() || null,
    last_fetched_at: form.lastFetchedAt?.trim() || null,
    original_language: form.originalLanguage.trim() || null,
  };
}