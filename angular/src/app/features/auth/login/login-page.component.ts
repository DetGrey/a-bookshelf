import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './login-page.component.scss',
  template: `
    <section class="auth-page">
      <article class="auth-card">
        <p class="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <p class="sub">Sign in to continue to your bookshelf.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Email</span>
            <input type="email" formControlName="email" />
          </label>

          <label class="field">
            <span>Password</span>
            <input type="password" formControlName="password" />
          </label>

          <button class="primary" type="submit" [disabled]="isSubmitting()">{{ isSubmitting() ? 'Signing in...' : 'Sign in' }}</button>
        </form>

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <a [routerLink]="['/signup']">Create account</a>
      </article>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { email, password } = this.form.getRawValue();
    const result = await this.auth.signIn(email, password);

    this.isSubmitting.set(false);

    if (!result.success) {
      this.errorMessage.set(result.error.message);
      return;
    }

    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/dashboard';
    await this.router.navigateByUrl(redirectTo);
  }
}
