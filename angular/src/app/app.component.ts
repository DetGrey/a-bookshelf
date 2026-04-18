import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, signal } from '@angular/core';
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
  private readonly document = inject(DOCUMENT);
  readonly auth = inject(AuthService);
  readonly navHidden = signal(false);
  private lastScrollY = 0;
  private readonly scrollRevealThreshold = 70;
  private readonly scrollDeltaThreshold = 6;
  private readonly upwardRevealDistance = 140;
  private upwardScrollProgress = 0;
  private navResizeObserver: ResizeObserver | null = null;
  private navElement: HTMLElement | null = null;

  @ViewChild('appNav')
  set appNavRef(ref: ElementRef<HTMLElement> | undefined) {
    this.stopObservingNav();
    this.navElement = ref?.nativeElement ?? null;
    this.startObservingNav();
    this.syncNavHeightVar();
  }

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

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const current = view.scrollY;

    if (view.matchMedia('(min-width: 768px)').matches) {
      this.setNavHidden(false);
      this.upwardScrollProgress = 0;
      this.lastScrollY = current;
      return;
    }

    if (current <= this.scrollRevealThreshold) {
      this.setNavHidden(false);
      this.upwardScrollProgress = 0;
      this.lastScrollY = current;
      return;
    }

    const delta = current - this.lastScrollY;
    if (delta > this.scrollDeltaThreshold) {
      this.setNavHidden(true);
      this.upwardScrollProgress = 0;
    } else if (delta < -this.scrollDeltaThreshold) {
      if (this.navHidden()) {
        this.upwardScrollProgress += Math.abs(delta);

        if (this.upwardScrollProgress >= this.upwardRevealDistance) {
          this.setNavHidden(false);
          this.upwardScrollProgress = 0;
        }
      }
    }

    this.lastScrollY = current;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncNavHeightVar();

    const view = this.document.defaultView;
    if (view?.matchMedia('(min-width: 768px)').matches) {
      this.setNavHidden(false);
    }
  }

  ngOnDestroy(): void {
    this.stopObservingNav();
  }

  private setNavHidden(hidden: boolean): void {
    this.navHidden.set(hidden);
    this.document.body.classList.toggle('nav-hidden', hidden);
  }

  private startObservingNav(): void {
    if (!this.navElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.navResizeObserver = new ResizeObserver(() => {
      this.syncNavHeightVar();
    });

    this.navResizeObserver.observe(this.navElement);
  }

  private stopObservingNav(): void {
    if (!this.navResizeObserver) {
      return;
    }

    this.navResizeObserver.disconnect();
    this.navResizeObserver = null;
  }

  private syncNavHeightVar(): void {
    const height = this.navElement?.offsetHeight ?? 0;
    this.document.documentElement.style.setProperty('--app-nav-height', `${height}px`);
  }
}
