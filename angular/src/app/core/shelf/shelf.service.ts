import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ErrorCode, Result } from '../../models/result.model';
import { Shelf } from '../../models/shelf.model';
import { ShelfRepository } from './shelf.repository';

@Injectable({ providedIn: 'root' })
export class ShelfService {
  private readonly repository = inject(ShelfRepository);
  private readonly auth = inject(AuthService);

  readonly shelves = signal<Shelf[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly shelfCount = computed(() => this.shelves().length);

  async loadShelves(): Promise<Result<Shelf[]>> {
    const user = this.auth.currentUser();

    if (!user) {
      const failure: Result<Shelf[]> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to load shelves.',
        },
      };
      this.shelves.set([]);
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const result = await this.repository.getByUserId(user.id);

    this.isLoading.set(false);

    if (!result.success) {
      this.shelves.set([]);
      this.errorMessage.set(result.error.message);
      return result;
    }

    const mappedShelves: Shelf[] = result.data.map((record) => ({
      id: record.id,
      userId: record.user_id,
      name: record.name,
      bookCount: record.book_count ?? 0,
      createdAt: new Date(record.created_at),
    }));

    this.shelves.set(mappedShelves);

    return {
      success: true,
      data: mappedShelves,
    };
  }
}