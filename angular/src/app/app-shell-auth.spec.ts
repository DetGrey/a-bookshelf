import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';

@Component({ standalone: true, template: '' })
class DummyPageComponent {}

describe('AppComponent auth navigation visibility', () => {
  const createComponent = async (url: string) => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: 'login', component: DummyPageComponent },
          { path: 'dashboard', component: DummyPageComponent },
        ]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            signOut: jest.fn().mockResolvedValue({ success: true, data: undefined }),
          },
        },
      ],
    });

    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);

    return TestBed.createComponent(AppComponent).componentInstance;
  };

  it('hides shell navigation on login page', async () => {
    const component = await createComponent('/login');

    expect(component.showNavigation()).toBe(false);
  });

  it('shows shell navigation on protected pages', async () => {
    const component = await createComponent('/dashboard');

    expect(component.showNavigation()).toBe(true);
  });
});