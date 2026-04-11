import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  showNavigation(): boolean {
    const path = this.router.url.split('?')[0];
    return path !== '/login' && path !== '/signup';
  }

  async logout(): Promise<void> {
    const result = await this.auth.signOut();

    if (result.success) {
      await this.router.navigateByUrl('/login');
    }
  }
}
