import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../supabase.token';
import { AuthService } from './auth.service';

describe('AuthService bootstrap contract', () => {
  const setup = (authApi: Record<string, unknown>) => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: SUPABASE_CLIENT,
          useValue: { auth: authApi },
        },
      ],
    });

    return TestBed.inject(AuthService);
  };

  it('loads current user from supabase session and marks initialized', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const getSession = jest.fn().mockResolvedValue({
      data: { session: { user } },
      error: null,
    });
    const service = setup({ getSession });

    expect(service.isInitialised()).toBe(false);
    expect(service.currentUser()).toBeNull();

    await service.init();

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(service.currentUser()).toEqual(user);
    expect(service.isInitialised()).toBe(true);
  });

  it('signIn stores signed-in user and returns success', async () => {
    const user = { id: 'user-456', email: 'signedin@example.com' };
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: { user },
      error: null,
    });
    const service = setup({
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword,
    });

    const result = await service.signIn('signedin@example.com', 'password-123');

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'signedin@example.com',
      password: 'password-123',
    });
    expect(result.success).toBe(true);
    expect(service.currentUser()).toEqual(user);
  });

  it('signUp returns success when backend accepts credentials', async () => {
    const signUp = jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const service = setup({
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp,
    });

    const result = await service.signUp('new@example.com', 'password-123');

    expect(signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password-123',
    });
    expect(result.success).toBe(true);
  });

  it('signOut clears current user', async () => {
    const user = { id: 'user-789', email: 'beforelogout@example.com' };
    const signOut = jest.fn().mockResolvedValue({ error: null });
    const service = setup({
      getSession: jest.fn().mockResolvedValue({ data: { session: { user } }, error: null }),
      signOut,
    });

    await service.init();
    const result = await service.signOut();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(service.currentUser()).toBeNull();
  });
});