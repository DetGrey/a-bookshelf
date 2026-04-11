import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Book } from '../../../models/book.model';
import { Shelf } from '../../../models/shelf.model';
import { truncateText } from '../../utils/string.util';
import { CoverImageComponent } from '../cover-image/cover-image.component';

const SCORE_OPTIONS: Record<number, string> = {
  10: 'Masterpiece',
  9: 'Great',
  8: 'Pretty Good',
  7: 'Good',
  6: 'Fine',
  5: 'Average',
  4: 'Pretty Bad',
  3: 'Bad',
  2: 'Horrible',
  1: 'Appalling',
};

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CoverImageComponent],
  styleUrl: './book-card.component.scss',
  template: `
    <article class="card book-card" [class.compact]="compact()" [id]="'book-anchor-' + book().id">
      <div class="card-head">
        <a class="cover-link" [attr.href]="'/book/' + book().id" (click)="opened.emit(book().id)">
          <app-cover-image class="thumb" [src]="book().coverUrl" [alt]="book().title" />
        </a>

        <div class="title-container">
          <h3 class="title-text">{{ book().title }}</h3>
          <p class="muted text-break">{{ truncateDescription(book().description) }}</p>

          <div class="pill-row">
            <span class="pill">{{ statusLabel(book().status) }}</span>

            @if (book().score; as score) {
              <span
                data-testid="score-pill"
                class="pill ghost"
                [style.color]="scoreColor(score)"
                [style.borderColor]="scoreColor(score)"
              >
                {{ scoreLabel(score) }}
              </span>
            }

            @if (!compact() && book().language; as lang) {
              <span data-testid="language-pill" class="pill ghost language-pill" title="Reading Language">
                {{ formatLanguage(lang) }}
              </span>
            }

            @if (book().originalLanguage; as originalLanguage) {
              <span data-testid="original-language-pill" class="pill ghost original-language-pill" title="Original Language">
                {{ formatLanguage(originalLanguage) }}
              </span>
            }

            @if (book().timesRead > 1) {
              <span data-testid="times-read-pill" class="pill ghost">Reads: {{ book().timesRead }}</span>
            }

            @if (book().chapterCount !== null) {
              <span data-testid="chapter-count-pill" class="pill ghost">Chapters: {{ book().chapterCount }}</span>
            }

            @if (!compact()) {
              @for (shelf of activeCustomShelves(); track shelf.id) {
                <span class="pill shelf-indicator">📚 {{ shelf.name }}</span>
              }
            }
          </div>

          @if (!compact()) {
            @if (book().notes; as notes) {
              <p data-testid="book-notes" class="muted notes-text">
                📝 {{ truncateText(notes) }}
              </p>
            }
          }

          @if (book().genres && book().genres.length > 0 && !compact()) {
            <div data-testid="genre-row" class="pill-row genre-row">
              @for (genre of book().genres; track genre) {
                <button
                  data-testid="genre-pill"
                  class="genre-pill"
                  [class.active]="activeGenres().includes(genre)"
                  (click)="genreToggled.emit(genre)"
                >
                  {{ genre }}
                </button>
              }
            </div>
          }
        </div>
      </div>

      <footer class="card-footer">
        <div>
          @if (book().lastRead && book().status !== 'completed') {
            <p class="muted">Last read</p>
            <p>{{ book().lastRead }}</p>
          }

          <p class="muted" [class.mt-8]="book().lastRead && book().status !== 'completed'">Latest chapter</p>
          <p data-testid="latest-chapter-value">{{ book().latestChapter || '—' }}</p>

          @if (!compact() && book().lastUploadedAt) {
            <p data-testid="last-uploaded" class="muted upload-date">{{ formatDate(book().lastUploadedAt) }}</p>
          }
        </div>

        <div class="card-links">
          @for (source of visibleSources(); track source.url) {
            <a data-testid="source-link" [attr.href]="source.url" target="_blank" rel="noreferrer" class="ghost">
              {{ source.siteName || 'Source' }}
            </a>
          }

          @if (customShelves().length > 0 && !compact()) {
            <div class="shelf-menu-container">
              <div class="shelf-button-wrapper">
              <button
                class="ghost shelf-button"
                data-testid="add-shelf-btn"
                type="button"
                (click)="showShelfMenu.set(!showShelfMenu())"
              >
                + Shelf
              </button>
              </div>

              @if (showShelfMenu()) {
                <ul data-testid="shelf-dropdown" class="shelf-dropdown">
                  @for (shelf of customShelves(); track shelf.id) {
                    <li
                      data-testid="shelf-item"
                      (click)="onShelfClick(shelf.id)"
                    >
                      <button class="shelf-dropdown-item" type="button" (click)="$event.stopPropagation(); onShelfClick(shelf.id)">
                        <span>{{ isBookOnShelf(shelf) ? '✓' : '○' }}</span>
                        <span>{{ shelf.name }}</span>
                      </button>
                    </li>
                  }
                </ul>
              }
            </div>
          }

          <a
            data-testid="book-detail-link"
            class="primary"
            [attr.href]="'/book/' + book().id"
            (click)="opened.emit(book().id)"
          >
            Details
          </a>
        </div>
      </footer>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
  readonly activeGenres = input<string[]>([]);
  readonly customShelves = input<readonly Shelf[]>([]);
  readonly compact = input<boolean>(false);
  
  readonly opened = output<string>();
  readonly genreToggled = output<string>();
  readonly shelfToggled = output<{ bookId: string; shelfId: string }>();

  readonly showShelfMenu = signal(false);

  readonly activeCustomShelves = () => this.customShelves().filter((shelf) => this.isBookOnShelf(shelf));
  readonly visibleSources = () => {
    const sources = this.book().sources ?? [];
    return sources.slice(0, this.compact() ? 2 : 1);
  };

  statusLabel(status: Book['status']): string {
    const labels: Record<Book['status'], string> = {
      plan_to_read: 'Plan to read',
      reading: 'Reading',
      waiting: 'Waiting',
      completed: 'Completed',
      dropped: 'Dropped',
      on_hold: 'On hold',
    };

    return labels[status] ?? status;
  }

  scoreColor(score: number): string {
    if (score >= 9) return '#b34ad3';
    if (score >= 7) return '#0ba360';
    if (score >= 5) return '#c6a700';
    if (score >= 3) return '#d97706';
    return '#d14343';
  }

  scoreLabel(score: number): string {
    return SCORE_OPTIONS[score] ?? `Score: ${score}`;
  }

  formatLanguage(language: string): string {
    const lower = language.toLowerCase();
    let flag: string | null = null;

    if (lower.startsWith('eng') || lower === 'en' || lower === 'english') {
      flag = '🇬🇧';
    } else if (lower.startsWith('jap') || lower === 'jp' || lower === 'ja' || lower === 'jpn') {
      flag = '🇯🇵';
    } else if (lower.startsWith('kor') || lower === 'kr' || lower === 'ko') {
      flag = '🇰🇷';
    } else if (lower.startsWith('chi') || lower === 'cn' || lower === 'zh' || lower.includes('mandarin')) {
      flag = '🇨🇳';
    } else if (lower.startsWith('spa') || lower === 'es') {
      flag = '🇪🇸';
    }

    return flag ? `${flag} ${language}` : language;
  }

  truncateText(text: string): string {
    return truncateText(text);
  }

  truncateDescription(text: string): string {
    return truncateText(text, 15);
  }

  isBookOnShelf(shelf: Shelf): boolean {
    return shelf.bookIds?.includes(this.book().id) ?? false;
  }

  onShelfClick(shelfId: string): void {
    this.shelfToggled.emit({ bookId: this.book().id, shelfId });
    this.showShelfMenu.set(false);
  }

  formatDate(value: Date | null): string {
    if (!value) {
      return '—';
    }

    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}