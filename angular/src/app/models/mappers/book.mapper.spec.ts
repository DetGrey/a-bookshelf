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
    });
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
      sources: [],
      shelves: [],
      relatedBookIds: [],
    };

    const result = toSupabasePayload(form);

    expect(result.cover_url).toBe('https://images.example.com/cover.jpg?size=large');
  });
});