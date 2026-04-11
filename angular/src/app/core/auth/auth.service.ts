import { inject, Injectable, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { ErrorCode, Result } from '../../models/result.model';
import { SUPABASE_CLIENT } from '../supabase.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  readonly currentUser = signal<User | null>(null);
  readonly isInitialised = signal(false);
  readonly initialized = this.isInitialised;

  async init(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    this.isInitialised.set(true);
  }

  async signIn(email: string, password: string): Promise<Result<void>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unauthorized,
          message: error.message,
          cause: error,
        },
      };
    }

    this.currentUser.set(data.user ?? null);

    return { success: true, data: undefined };
  }

  async signUp(email: string, password: string): Promise<Result<void>> {
    const { error } = await this.supabase.auth.signUp({ email, password });

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.Validation,
          message: error.message,
          cause: error,
        },
      };
    }

    return { success: true, data: undefined };
  }

  async signOut(): Promise<Result<void>> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.Unknown,
          message: error.message,
          cause: error,
        },
      };
    }

    this.currentUser.set(null);

    return { success: true, data: undefined };
  }
}
