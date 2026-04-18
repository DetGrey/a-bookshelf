import { buildMetadataPatch } from './metadata-fetcher.mapper';

describe('metadata fetcher mapper', () => {
  it('maps metadata payload to BookFormModel patch fields', () => {
    const patch = buildMetadataPatch({
      title: 'Solo Leveling',
      description: 'Hunters and gates',
      image: 'https://images.example.com/solo.jpg',
      genres: ['Action', 'Fantasy'],
      language: 'English',
      original_language: 'Korean',
      latest_chapter: 'Chapter 210',
      last_uploaded_at: '2026-03-01T12:30:00.000Z',
      chapter_count: 210,
    });

    expect(patch).toEqual({
      title: 'Solo Leveling',
      description: 'Hunters and gates',
      coverUrl: 'https://images.example.com/solo.jpg',
      genres: 'Action, Fantasy',
      language: 'English',
      originalLanguage: 'Korean',
      latestChapter: 'Chapter 210',
      lastUploadedAt: '2026-03-01T12:30:00',
      chapterCount: 210,
    });
  });

  it('overwrites values with fetched metadata', () => {
    const patch = buildMetadataPatch({
      title: 'Fetched title',
      description: 'Fetched description',
      image: 'https://images.example.com/fetched.jpg',
      genres: ['Action'],
      language: 'English',
      latest_chapter: 'Chapter 50',
      chapter_count: 50,
    });

    expect(patch).toEqual({
      title: 'Fetched title',
      description: 'Fetched description',
      coverUrl: 'https://images.example.com/fetched.jpg',
      genres: 'Action',
      language: 'English',
      latestChapter: 'Chapter 50',
      chapterCount: 50,
    });
  });

  it('skips undefined and null metadata fields', () => {
    const patch = buildMetadataPatch({
      title: undefined,
      description: null,
      image: undefined,
      genres: undefined,
      language: null,
      latest_chapter: undefined,
      chapter_count: null,
    });

    expect(patch).toEqual({});
  });
});
