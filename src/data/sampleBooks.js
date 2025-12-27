export const sampleBooks = [
  {
    id: '1',
    title: 'The Pragmatic Programmer',
    status: 'Reading',
    progress: 42,
    lastChapter: 'Chapter 4: Pragmatic Paranoia',
    description: 'Practical tips for modern software developers.',
    cover:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80',
    sources: [
      { label: 'Official', url: 'https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/' },
      { label: 'Notes', url: 'https://example.com/my-notes' },
    ],
    shelves: ['favorites', 'tech'], // Books can belong to multiple custom shelves
    updatedAt: '2025-01-04T08:00:00Z',
  },
  {
    id: '2',
    title: 'Murderbot Diaries',
    status: 'Plan to Read',
    progress: 0,
    lastChapter: 'Not started',
    description: 'A self-aware security unit just wants to watch serials.',
    cover:
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=400&q=80',
    sources: [{ label: 'Goodreads', url: 'https://www.goodreads.com/series/191900-the-murderbot-diaries' }],
    shelves: ['favorites'],
    updatedAt: '2024-12-18T08:00:00Z',
  },
  {
    id: '3',
    title: 'Fullmetal Alchemist',
    status: 'Completed',
    progress: 100,
    lastChapter: 'Chapter 108',
    description: 'Alchemy, brothers, and the cost of ambition.',
    cover:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
    sources: [
      { label: 'MangaDex', url: 'https://mangadex.org/title/fc25672b-179c-4d88-bd06-6382f8fd8b0f/fullmetal-alchemist' },
      { label: 'Anime', url: 'https://myanimelist.net/anime/5114/Fullmetal_Alchemist__Brotherhood' },
    ],
    shelves: ['favorites'],
    updatedAt: '2024-11-02T08:00:00Z',
  },
]

// Sample custom shelves (replace with Supabase later)
export const sampleShelves = [
  { id: 'favorites', name: 'Favorites', isCustom: true },
  { id: 'tech', name: 'Tech Books', isCustom: true },
]
