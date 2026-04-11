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
  cover_url: string | null;
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
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
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
}