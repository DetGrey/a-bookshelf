import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Book } from '../../../models/book.model';
import { Shelf } from '../../../models/shelf.model';
import { truncateText } from '../../utils/string.util';

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
  styleUrl: './book-card.component.scss',
  template: `
    <article class="book-card" [id]="'book-anchor-' + book().id">
      <h3>{{ book().title }}</h3>
      <p>{{ truncateDescription(book().description) }}</p>

      <div class="pill-row">
        <span class="pill">{{ book().status }}</span>

        @if (book().score; as score) {
          <span data-testid="score-pill" class="pill" [style.color]="scoreColor(score)">
            {{ scoreLabel(score) }}
          </span>
        }

        @if (!compact() && book().language; as lang) {
          <span data-testid="language-pill" class="pill">
            {{ formatLanguage(lang) }}
          </span>
        }

        @if (book().originalLanguage; as originalLanguage) {
          <span data-testid="original-language-pill" class="pill">
            {{ formatLanguage(originalLanguage) }}
          </span>
        }

        @if (book().timesRead > 1) {
          <span data-testid="times-read-pill" class="pill">Reads: {{ book().timesRead }}</span>
        }

        @if (book().chapterCount !== null) {
          <span data-testid="chapter-count-pill" class="pill">Chapters: {{ book().chapterCount }}</span>
        }

        @if (!compact()) {
          @for (shelf of activeCustomShelves(); track shelf.id) {
            <span class="pill">📚 {{ shelf.name }}</span>
          }
        }
      </div>

      @if (!compact()) {
        @if (book().notes; as notes) {
          <p data-testid="book-notes" class="book-notes">
            📝 {{ truncateText(notes) }}
          </p>
        }
      }

      @if (book().genres && book().genres.length > 0 && !compact()) {
        <div data-testid="genre-row" class="genre-row">
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

      <footer class="card-footer">
        <div class="footer-left">
          @if (book().lastRead && book().status !== 'completed') {
            <p>Last read</p>
            <p>{{ book().lastRead }}</p>
          }

          <p>Latest chapter</p>
          <p data-testid="latest-chapter-value">{{ book().latestChapter || '—' }}</p>

          @if (!compact() && book().lastUploadedAt) {
            <p data-testid="last-uploaded">{{ formatDate(book().lastUploadedAt) }}</p>
          }
        </div>

        <div class="footer-right">
          @if (customShelves().length > 0 && !compact()) {
            <div class="shelf-menu-container">
              <button
                data-testid="add-shelf-btn"
                type="button"
                (click)="showShelfMenu.set(!showShelfMenu())"
              >
                + Shelf
              </button>

              @if (showShelfMenu()) {
                <ul data-testid="shelf-dropdown" class="shelf-dropdown">
                  @for (shelf of customShelves(); track shelf.id) {
                    <li
                      data-testid="shelf-item"
                      (click)="onShelfClick(shelf.id)"
                    >
                      {{ isBookOnShelf(shelf) ? '✓' : '○' }} {{ shelf.name }}
                    </li>
                  }
                </ul>
              }
            </div>
          }

          <a
            data-testid="book-detail-link"
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
  readonly customShelves = input<Shelf[]>([]);
  readonly compact = input<boolean>(false);
  
  readonly opened = output<string>();
  readonly genreToggled = output<string>();
  readonly shelfToggled = output<{ bookId: string; shelfId: string }>();

  readonly showShelfMenu = signal(false);

  readonly activeCustomShelves = () => this.customShelves().filter((shelf) => this.isBookOnShelf(shelf));

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

  formatDate(value: Date): string {
    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}