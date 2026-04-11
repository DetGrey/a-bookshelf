export type BookStatus = 'reading' | 'plan_to_read' | 'waiting' | 'completed' | 'dropped' | 'on_hold';

export interface BookRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  score: number | null;
  status: string;
  genres: string[] | null;
  language: string | null;
  chapter_count: number | null;
  latest_chapter?: string | null;
  last_uploaded_at?: string | null;
  last_fetched_at?: string | null;
  notes?: string | null;
  times_read?: number | null;
  last_read?: string | null;
  original_language?: string | null;
  cover_url: string | null;
  book_links?: Array<{ site_name: string | null; url: string }>;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  description: string;
  score: number | null;
  status: BookStatus;
  genres: readonly string[];
  language: string | null;
  chapterCount: number | null;
  latestChapter: string | null;
  lastUploadedAt: Date | null;
  lastFetchedAt: Date | null;
  notes: string | null;
  timesRead: number;
  lastRead: string | null;
  originalLanguage: string | null;
  coverUrl: string | null;
  sources?: readonly BookSourceDraft[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BookSourceDraft {
  siteName: string;
  url: string;
}

export interface BookFormModel {
  title: string;
  description: string;
  score: number | null;
  status: BookStatus | null;
  genres: string;
  language: string;
  chapterCount: number | null;
  coverUrl: string;
  notes: string;
  timesRead: number;
  lastRead: string;
  latestChapter: string;
  lastUploadedAt: string;
  originalLanguage: string;
  sources: BookSourceDraft[];
  shelves: string[];
  relatedBookIds: string[];
}