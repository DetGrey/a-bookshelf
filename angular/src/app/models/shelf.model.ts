export interface ShelfRecord {
  id: string;
  user_id: string;
  name: string;
  book_count: number | null;
  created_at: string;
}

export interface Shelf {
  id: string;
  userId: string;
  name: string;
  bookCount: number;
  createdAt: Date;
}