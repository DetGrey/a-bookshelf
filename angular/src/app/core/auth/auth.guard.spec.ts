import { signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { evaluateAuthGuard } from './auth.guard';

describe('authGuard', () => {
  it('allows navigation when currentUser exists', () => {
    const auth = {
      currentUser: signal({ id: 'user-1' } as any),
    } as AuthService;
    const router = {
      createUrlTree: jest.fn(),
    } as unknown as Router;

    const result = evaluateAuthGuard(auth, router, '/bookshelf');

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login with redirect target', () => {
    const auth = {
      currentUser: signal(null),
    } as AuthService;
    const tree = {} as UrlTree;
    const router = {
      createUrlTree: jest.fn().mockReturnValue(tree),
    } as unknown as Router;

    const result = evaluateAuthGuard(auth, router, '/add');

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirectTo: '/add' },
    });
    expect(result).toBe(tree);
  });
});