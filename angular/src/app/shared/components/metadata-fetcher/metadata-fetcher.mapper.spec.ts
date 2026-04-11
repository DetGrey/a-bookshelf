import { buildMetadataPatch } from './metadata-fetcher.mapper';

describe('metadata fetcher mapper', () => {
  it('maps metadata payload to BookFormModel patch fields', () => {
    const patch = buildMetadataPatch(
      {
        title: 'Solo Leveling',
        description: 'Hunters and gates',
        image: 'https://images.example.com/solo.jpg',
        genres: ['Action', 'Fantasy'],
        language: 'English',
        chapter_count: 210,
      },
      {
        title: '',
        description: '',
        coverUrl: '',
        genres: '',
        language: '',
        chapterCount: null,
      },
    );

    expect(patch).toEqual({
      title: 'Solo Leveling',
      description: 'Hunters and gates',
      coverUrl: 'https://images.example.com/solo.jpg',
      genres: 'Action, Fantasy',
      language: 'English',
      chapterCount: 210,
    });
  });

  it('does not overwrite existing non-empty form values', () => {
    const patch = buildMetadataPatch(
      {
        title: 'Fetched title',
        description: 'Fetched description',
        image: 'https://images.example.com/fetched.jpg',
        genres: ['Action'],
        language: 'English',
        chapter_count: 50,
      },
      {
        title: 'My custom title',
        description: 'My custom description',
        coverUrl: 'https://images.example.com/custom.jpg',
        genres: 'Drama',
        language: 'Japanese',
        chapterCount: 99,
      },
    );

    expect(patch).toEqual({});
  });

  it('ignores empty metadata fields to avoid corrupting form', () => {
    const patch = buildMetadataPatch(
      {
        title: '  ',
        description: '',
        image: '',
        genres: [],
        language: '',
        chapter_count: null,
      },
      {
        title: '',
        description: '',
        coverUrl: '',
        genres: '',
        language: '',
        chapterCount: null,
      },
    );

    expect(patch).toEqual({});
  });
});
