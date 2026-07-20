export interface ParsedMetadata {
  title: string;
  description: string;
  image: string;
  genres: string[];
  language: string | null;
  original_language: string | null;
  latest_chapter: string;
  last_uploaded_at: string | null;
  chapter_count: number | null;
}

export interface ParsedLatest {
  latest_chapter: string | null;
  last_uploaded_at: string | null;
  chapter_count: number | null;
}
