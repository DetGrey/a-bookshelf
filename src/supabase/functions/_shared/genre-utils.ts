/**
 * Shared utility for normalizing, mapping, and combining genres across multiple sources.
 */

const GENRE_MAP: Record<string, string[]> = {
  'high fantasy': ['Fantasy'],
  'dark fantasy': ['Fantasy'],
  'urban fantasy': ['Fantasy'],
  'romantic comedy': ['Romance', 'Comedy'],
  'rom-com': ['Romance', 'Comedy'],
  'action comedy': ['Action', 'Comedy'],
  'science fiction': ['Sci-Fi'],
  'scifi': ['Sci-Fi'],
  'sci-fi': ['Sci-Fi'],
  'slice of life': ['Slice of Life'],
  'shonen': ['Shounen'],
  'shojo': ['Shojo'],
  'seinen': ['Seinen'],
};

export function normalizeGenreToken(token: string): string[] {
  const trimmed = token.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  if (GENRE_MAP[lower]) {
    return GENRE_MAP[lower];
  }
  // Title case formatting
  const formatted = trimmed
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return [formatted];
}

/**
 * Combines multiple genre lists, maps sub-genres (e.g. High Fantasy -> Fantasy), and deduplicates tokens.
 */
export function mergeAndNormalizeGenres(...genreLists: (string[] | undefined | null)[]): string[] {
  const resultSet = new Set<string>();

  for (const list of genreLists) {
    if (!list) continue;
    for (const raw of list) {
      if (!raw) continue;
      const normalizedTokens = normalizeGenreToken(raw);
      for (const token of normalizedTokens) {
        resultSet.add(token);
      }
    }
  }

  return Array.from(resultSet);
}
