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
    coverUrl: record.cover_url,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
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
  };
}