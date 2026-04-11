import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ErrorCode, Result } from '../../models/result.model';
import { Shelf, ShelfRecord } from '../../models/shelf.model';
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

    const mappedShelves: Shelf[] = result.data.map((record) => this.mapRecord(record));

    this.shelves.set(mappedShelves);

    return {
      success: true,
      data: mappedShelves,
    };
  }

  async createShelf(name: string): Promise<Result<Shelf>> {
    const user = this.auth.currentUser();
    if (!user) {
      const failure: Result<Shelf> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to create shelf.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      const failure: Result<Shelf> = {
        success: false,
        error: {
          code: ErrorCode.Validation,
          message: 'Shelf name cannot be empty.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    this.errorMessage.set(null);
    const result = await this.repository.create(user.id, normalizedName);

    if (!result.success) {
      this.errorMessage.set(`Could not create shelf. ${result.error.message}`);
      return {
        success: false,
        error: result.error,
      };
    }

    const shelf = this.mapRecord(result.data);
    this.shelves.update((existing) => [...existing, shelf]);

    return {
      success: true,
      data: shelf,
    };
  }

  async deleteShelf(shelfId: string): Promise<Result<void>> {
    const user = this.auth.currentUser();
    if (!user) {
      const failure: Result<void> = {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: 'Authentication required to delete shelf.',
        },
      };
      this.errorMessage.set(failure.error.message);
      return failure;
    }

    this.errorMessage.set(null);
    const result = await this.repository.delete(user.id, shelfId);

    if (!result.success) {
      this.errorMessage.set(`Could not delete shelf. ${result.error.message}`);
      return result;
    }

    this.shelves.update((existing) => existing.filter((shelf) => shelf.id !== shelfId));

    return {
      success: true,
      data: undefined,
    };
  }

  private mapRecord(record: ShelfRecord): Shelf {
    const bookIds = (record.shelf_books ?? []).map((entry) => entry.book_id);
    return {
      id: record.id,
      userId: record.user_id,
      name: record.name,
      bookCount: record.book_count ?? bookIds.length,
      bookIds,
      createdAt: new Date(record.created_at),
    };
  }
}