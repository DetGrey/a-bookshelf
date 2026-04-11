import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginPageComponent } from './features/auth/login/login-page.component';
import { SignupPageComponent } from './features/auth/signup/signup-page.component';
import { AuthService } from './core/auth/auth.service';

describe('auth pages behavior', () => {
  it('login redirects to redirectTo query target on successful sign-in', async () => {
    const auth = {
      signIn: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    } as unknown as AuthService;
    const router = {
      navigateByUrl: jest.fn().mockResolvedValue(true),
    } as unknown as Router;

    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'redirectTo' ? '/bookshelf' : null),
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'person@example.com',
      password: 'password-123',
    });

    await component.submit();

    expect(auth.signIn).toHaveBeenCalledWith('person@example.com', 'password-123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/bookshelf');
    expect(component.errorMessage()).toBeNull();
    expect(component.isSubmitting()).toBe(false);
  });

  it('login shows backend error on failed sign-in', async () => {
    const auth = {
      signIn: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'unauthorized', message: 'Invalid credentials' },
      }),
    } as unknown as AuthService;
    const router = {
      navigateByUrl: jest.fn().mockResolvedValue(true),
    } as unknown as Router;

    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'person@example.com',
      password: 'wrong-password',
    });

    await component.submit();

    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('signup blocks mismatched passwords and shows validation error', async () => {
    const auth = {
      signUp: jest.fn(),
    } as unknown as AuthService;

    TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: Router,
          useValue: {
            navigateByUrl: jest.fn().mockResolvedValue(true),
          } as Router,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(SignupPageComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'new@example.com',
      password: 'password-123',
      confirmPassword: 'different-password',
    });

    await component.submit();

    expect(auth.signUp).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('match');
    expect(component.successMessage()).toBeNull();
  });

  it('signup redirects to login on successful account creation', async () => {
    const auth = {
      signUp: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    } as unknown as AuthService;
    const router = {
      navigateByUrl: jest.fn().mockResolvedValue(true),
    } as unknown as Router;

    TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(SignupPageComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'new@example.com',
      password: 'password-123',
      confirmPassword: 'password-123',
    });

    await component.submit();

    expect(auth.signUp).toHaveBeenCalledWith('new@example.com', 'password-123');
    expect(component.successMessage()).toContain('Redirecting');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});