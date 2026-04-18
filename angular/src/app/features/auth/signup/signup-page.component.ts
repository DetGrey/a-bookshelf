import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './signup-page.component.scss',
  template: `
    <section class="auth-page">
      <article class="auth-card">
        <p class="eyebrow">Create account</p>
        <h1>Signup</h1>
        <p class="sub">Create your account to start tracking reads.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Email</span>
            <input type="email" formControlName="email" />
          </label>

          <label class="field">
            <span>Password</span>
            <input type="password" formControlName="password" />
          </label>

          <label class="field">
            <span>Confirm password</span>
            <input type="password" formControlName="confirmPassword" />
          </label>

          <button class="primary" type="submit" [disabled]="isSubmitting()">{{ isSubmitting() ? 'Signing up...' : 'Create account' }}</button>
        </form>

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        @if (successMessage()) {
          <p class="success">{{ successMessage() }}</p>
        }

        <a [routerLink]="['/login']">Back to login</a>
      </article>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.form.getRawValue();

    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords must match.');
      return;
    }

    this.isSubmitting.set(true);

    const result = await this.auth.signUp(email, password);

    this.isSubmitting.set(false);

    if (!result.success) {
      this.errorMessage.set(result.error.message);
      return;
    }

    this.successMessage.set('Account created. Redirecting to login...');
    await this.router.navigateByUrl('/login');
  }
}
