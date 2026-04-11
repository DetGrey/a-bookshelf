import { 
  ChangeDetectionStrategy, 
  Component, 
  computed, 
  input, 
  signal, 
  viewChild, 
  afterNextRender, 
  ElementRef, 
  OnDestroy,
  effect,
  untracked
} from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-cover-image',
  standalone: true,
  imports: [NgStyle],
  styleUrl: './cover-image.component.scss',
  template: `
    <span #holder class="cover-holder">
      @if (showImage()) {
        <img
          [src]="src()"
          [alt]="alt()"
          [class.cover-loading]="!imageLoaded()"
          (load)="imageLoaded.set(true)"
          (error)="errored.set(true)"
        />
      }
      
      @if (!showImage() || !imageLoaded()) {
        <div class="cover-fallback" [ngStyle]="fallbackStyle()">
          <span>{{ alt() || 'No cover' }}</span>
        </div>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverImageComponent implements OnDestroy {
  readonly src = input<string | null | undefined>(null);
  readonly alt = input<string>('');
  readonly lazy = input<boolean>(true);

  readonly holder = viewChild.required<ElementRef<HTMLElement>>('holder');

  readonly shouldLoad = signal(false);
  readonly errored = signal(false);
  readonly imageLoaded = signal(false);

  readonly showImage = computed(() =>
    this.shouldLoad() && !!this.src() && !this.errored()
  );

  private observer: IntersectionObserver | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Reset state whenever src changes
    effect(() => {
      this.src(); // Track input change
      untracked(() => {
        this.errored.set(false);
        this.imageLoaded.set(false);
        this.clearTimeout();
        if (this.shouldLoad()) this.startTimeout();
      });
    });

    // Start timeout when shouldLoad flips to true
    effect(() => {
      if (this.shouldLoad()) {
        untracked(() => this.startTimeout());
      }
    });

    afterNextRender(() => {
      if (!this.lazy() || typeof IntersectionObserver === 'undefined') {
        this.shouldLoad.set(true);
        return;
      }

      this.observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          this.shouldLoad.set(true);
          this.disconnectObserver();
        }
      }, { rootMargin: '120px' });

      this.observer.observe(this.holder().nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
    this.clearTimeout();
  }

  private startTimeout(): void {
    this.clearTimeout();
    if (!this.src()) return;
    
    this.timeoutId = setTimeout(() => {
      if (!this.imageLoaded()) {
        this.errored.set(true);
      }
    }, 3000);

    if (typeof this.timeoutId === 'object' && this.timeoutId !== null && 'unref' in this.timeoutId && typeof this.timeoutId.unref === 'function') {
      this.timeoutId.unref();
    }
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private hashHue(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  }

  readonly fallbackStyle = computed(() => {
    const text = this.alt() || 'cover';
    const hue = this.hashHue(text);
    return {
      background: `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${(hue + 30) % 360} 60% 45%))`,
    };
  });
}