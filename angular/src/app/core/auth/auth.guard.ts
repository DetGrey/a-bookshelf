import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export function evaluateAuthGuard(auth: Pick<AuthService, 'currentUser'>, router: Pick<Router, 'createUrlTree'>, targetUrl: string): true | UrlTree {
  if (auth.currentUser()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirectTo: targetUrl },
  });
}

export const authGuard: CanActivateFn = (_route, state) => evaluateAuthGuard(
  inject(AuthService),
  inject(Router),
  state.url,
);