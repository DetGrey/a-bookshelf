import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly initialized = signal(false);

  async init(): Promise<void> {
    this.initialized.set(true);
  }
}
