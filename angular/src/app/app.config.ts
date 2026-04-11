import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth/auth.service';
import { SUPABASE_CLIENT } from './core/supabase.token';

import { routes } from './app.routes';

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => authService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => {
        const supabaseUrl = environment.supabaseUrl || 'https://placeholder.supabase.co';
        const supabaseAnonKey = environment.supabaseAnonKey || 'placeholder-anon-key';
        return createClient(supabaseUrl, supabaseAnonKey);
      },
    },
    provideAppInitializer(() => initializeAuth(inject(AuthService))()),
  ]
};
