import { toBook, toFormModel, toSupabasePayload } from './book.mapper';
import { Book, BookFormModel, BookRecord } from '../book.model';

describe('book mapper tracer bullet', () => {
  it('maps a BookRecord into Book domain shape', () => {
    const record: BookRecord = {
      id: 'book-1',
      user_id: 'user-1',
      title: 'Solo Leveling',
      description: null,
      score: 9,
      status: 'reading',
      genres: ['action', 'fantasy'],
      language: 'en',
      chapter_count: 200,
      cover_url: 'https://example.com/cover.jpg',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    };

    const result = toBook(record);

    expect(result.id).toBe('book-1');
    expect(result.title).toBe('Solo Leveling');
    expect(result.description).toBe('');
    expect(result.chapterCount).toBe(200);
    expect(result.coverUrl).toBe('https://example.com/cover.jpg');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('maps null and empty record values safely in toBook', () => {
    const record: BookRecord = {
      id: 'book-2',
      user_id: 'user-2',
      title: 'No Details Book',
      description: null,
      score: null,
      status: 'unknown-status',
      genres: null,
      language: null,
      chapter_count: null,
      cover_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    };

    const result = toBook(record);

    expect(result.description).toBe('');
    expect(result.status).toBe('plan_to_read');
    expect(result.genres).toEqual([]);
    expect(result.coverUrl).toBeNull();
  });

  it('maps domain book to form model via toFormModel', () => {
    const book: Book = {
      id: 'book-3',
      userId: 'user-3',
      title: 'Mapped to Form',
      description: 'desc',
      score: 8,
      status: 'waiting',
      genres: ['action', 'drama'],
      language: null,
      chapterCount: 50,
      latestChapter: null,
      lastUploadedAt: null,
      lastFetchedAt: null,
      notes: null,
      timesRead: 1,
      lastRead: null,
      originalLanguage: null,
      coverUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    const result = toFormModel(book);

    expect(result).toEqual({
      title: 'Mapped to Form',
      description: 'desc',
      score: 8,
      status: 'waiting',
      genres: 'action, drama',
      language: '',
      chapterCount: 50,
      coverUrl: '',
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
      sources: [],
      shelves: [],
      relatedBookIds: [],
    });
  });

  it('maps form model to Supabase payload via toSupabasePayload', () => {
    const form: BookFormModel = {
      title: '  Solo Max-Level Newbie  ',
      description: '   ',
      score: null,
      status: null,
      genres: ' action, fantasy , , ',
      language: '  ',
      chapterCount: null,
      coverUrl: '',
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
      sources: [],
      shelves: [],
      relatedBookIds: [],
    };

    const result = toSupabasePayload(form);

    expect(result).toEqual({
      title: 'Solo Max-Level Newbie',
      description: null,
      score: null,
      status: 'plan_to_read',
      genres: ['action', 'fantasy'],
      language: null,
      chapter_count: null,
      cover_url: null,
      notes: null,
      times_read: 1,
      last_read: null,
      latest_chapter: null,
      last_uploaded_at: null,
      original_language: null,
    });
  });

  // ── ISSUE-016: new fields ──────────────────────────────────────────────

  it('maps notes from record to book domain model', () => {
    const record: BookRecord = {
      id: 'x', user_id: 'u', title: 'T', description: null, score: null,
      status: 'reading', genres: null, language: null, chapter_count: null,
      cover_url: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
      notes: 'personal note',
    };
    expect(toBook(record).notes).toBe('personal note');
  });

  it('maps null notes to null', () => {
    const record: BookRecord = {
      id: 'x', user_id: 'u', title: 'T', description: null, score: null,
      status: 'reading', genres: null, language: null, chapter_count: null,
      cover_url: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
    };
    expect(toBook(record).notes).toBeNull();
  });

  it('normalizes times_read to minimum 1: null → 1, 0 → 1, 3 → 3', () => {
    const base: BookRecord = {
      id: 'x', user_id: 'u', title: 'T', description: null, score: null,
      status: 'reading', genres: null, language: null, chapter_count: null,
      cover_url: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
    };
    expect(toBook({ ...base, times_read: null }).timesRead).toBe(1);
    expect(toBook({ ...base, times_read: 0 }).timesRead).toBe(1);
    expect(toBook({ ...base, times_read: 3 }).timesRead).toBe(3);
  });

  it('maps lastRead and originalLanguage from record', () => {
    const record: BookRecord = {
      id: 'x', user_id: 'u', title: 'T', description: null, score: null,
      status: 'reading', genres: null, language: null, chapter_count: null,
      cover_url: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
      last_read: 'Ch 50',
      original_language: 'Japanese',
    };
    const result = toBook(record);
    expect(result.lastRead).toBe('Ch 50');
    expect(result.originalLanguage).toBe('Japanese');
  });

  it('maps new fields through toFormModel', () => {
    const book: Book = {
      id: 'b', userId: 'u', title: 'T', description: 'desc', score: 8,
      status: 'reading', genres: [], language: null,
      chapterCount: 50, latestChapter: 'Ch 50', lastUploadedAt: new Date('2026-03-01T10:00:00.000Z'),
      lastFetchedAt: null, notes: 'my note', timesRead: 2, lastRead: 'Ch 40',
      originalLanguage: 'Japanese', coverUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    const result = toFormModel(book);
    expect(result.notes).toBe('my note');
    expect(result.timesRead).toBe(2);
    expect(result.lastRead).toBe('Ch 40');
    expect(result.latestChapter).toBe('Ch 50');
    expect(result.lastUploadedAt).toBe('2026-03-01T10:00:00');
    expect(result.originalLanguage).toBe('Japanese');
  });

  it('maps null lastUploadedAt to empty string in form model', () => {
    const book: Book = {
      id: 'b', userId: 'u', title: 'T', description: '', score: null,
      status: 'plan_to_read', genres: [], language: null,
      chapterCount: null, latestChapter: null, lastUploadedAt: null,
      lastFetchedAt: null, notes: null, timesRead: 1, lastRead: null,
      originalLanguage: null, coverUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    const result = toFormModel(book);
    expect(result.lastUploadedAt).toBe('');
    expect(result.notes).toBe('');
    expect(result.lastRead).toBe('');
    expect(result.originalLanguage).toBe('');
  });

  it('maps new fields back through toSupabasePayload', () => {
    const form: BookFormModel = {
      title: 'T', description: '', score: null, status: 'reading',
      genres: '', language: '', chapterCount: null, coverUrl: '',
      notes: 'my note', timesRead: 2, lastRead: 'Ch 40',
      latestChapter: 'Ch 50', lastUploadedAt: '2026-03-01T10:00:00',
      originalLanguage: 'Japanese',
      sources: [], shelves: [], relatedBookIds: [],
    };
    const result = toSupabasePayload(form);
    expect(result.notes).toBe('my note');
    expect(result.times_read).toBe(2);
    expect(result.last_read).toBe('Ch 40');
    expect(result.latest_chapter).toBe('Ch 50');
    expect(result.last_uploaded_at).toBe('2026-03-01T10:00:00');
    expect(result.original_language).toBe('Japanese');
  });

  it('treats empty strings as null in toSupabasePayload for new fields', () => {
    const form: BookFormModel = {
      title: 'T', description: '', score: null, status: null,
      genres: '', language: '', chapterCount: null, coverUrl: '',
      notes: '', timesRead: 0, lastRead: '',
      latestChapter: '', lastUploadedAt: '', originalLanguage: '',
      sources: [], shelves: [], relatedBookIds: [],
    };
    const result = toSupabasePayload(form);
    expect(result.notes).toBeNull();
    expect(result.times_read).toBe(1);
    expect(result.last_read).toBeNull();
    expect(result.latest_chapter).toBeNull();
    expect(result.last_uploaded_at).toBeNull();
    expect(result.original_language).toBeNull();
  });

  it('stores raw cover URL in payload without proxy transformation', () => {
    const form: BookFormModel = {
      title: 'Book',
      description: '',
      score: null,
      status: 'plan_to_read',
      genres: '',
      language: '',
      chapterCount: null,
      coverUrl: 'https://images.example.com/cover.jpg?size=large',
      notes: '',
      timesRead: 1,
      lastRead: '',
      latestChapter: '',
      lastUploadedAt: '',
      originalLanguage: '',
      sources: [],
      shelves: [],
      relatedBookIds: [],
    };

    const result = toSupabasePayload(form);

    expect(result.cover_url).toBe('https://images.example.com/cover.jpg?size=large');
  });
});