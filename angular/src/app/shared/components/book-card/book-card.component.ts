import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Book } from '../../../models/book.model';
import { Shelf } from '../../../models/shelf.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  template: `
    <article class="book-card" [id]="'book-anchor-' + book().id">
      <h3>{{ book().title }}</h3>
      <p>Status: {{ book().status }}</p>

      <div class="pill-row">
        @if (book().score; as score) {
          <span data-testid="score-pill" class="pill" [style.color]="scoreColor(score)">
            Score: {{ score }}
          </span>
        }
        
        @if (book().language; as lang) {
          <span data-testid="language-pill" class="pill">
            {{ formatLanguage(lang) }}
          </span>
        }
      </div>

      @if (!compact()) {
        @if (book().notes; as notes) {
          <p data-testid="book-notes" class="book-notes">
            {{ truncateText(notes) }}
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

      <a
        data-testid="book-detail-link"
        [attr.href]="'/book/' + book().id"
        (click)="opened.emit(book().id)"
      >
        Open details
      </a>

      <footer class="card-footer">
        <div class="footer-left"></div>
        <div class="footer-right">
          @if (customShelves().length > 0 && !compact()) {
            <div class="shelf-menu-container">
              <button 
                data-testid="add-shelf-btn" 
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

  scoreColor(score: number): string {
    if (score >= 9) return '#b34ad3';
    if (score >= 7) return '#0ba360';
    if (score >= 5) return '#c6a700';
    if (score >= 3) return '#d97706';
    return '#d14343';
  }

  formatLanguage(language: string): string {
    const flags: Record<string, string> = {
      'english': '🇬🇧',
      'japanese': '🇯🇵',
      'korean': '🇰🇷',
      'chinese': '🇨🇳',
      'spanish': '🇪🇸'
    };
    
    const flag = flags[language.toLowerCase()];
    return flag ? `${flag} ${language}` : language;
  }

  truncateText(text: string): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= 15) return text;
    return words.slice(0, 15).join(' ') + '…';
  }

  isBookOnShelf(shelf: Shelf): boolean {
    return shelf.bookIds?.includes(this.book().id) ?? false;
  }

  onShelfClick(shelfId: string): void {
    this.shelfToggled.emit({ bookId: this.book().id, shelfId });
    this.showShelfMenu.set(false);
  }
}