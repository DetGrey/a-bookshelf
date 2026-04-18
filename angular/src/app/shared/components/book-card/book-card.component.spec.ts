import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookCardComponent } from './book-card.component';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Book } from '../../../models/book.model';
import { Shelf } from '../../../models/shelf.model';

@Component({
  standalone: true,
  imports: [BookCardComponent],
  template: `
    <app-book-card 
      [book]="book" 
      [activeGenres]="activeGenres"
      [customShelves]="customShelves"
      [compact]="compact"
      (genreToggled)="onGenreToggled($event)"
      (shelfToggled)="onShelfToggled($event)"
    />
  `
})
class TestHostComponent {
  book: Book = {
    id: '1',
    userId: 'u1',
    title: 'Test Book',
    description: 'Test',
    score: null,
    status: 'completed',
    genres: [],
    language: null,
    chapterCount: null,
    latestChapter: null,
    lastUploadedAt: null,
    lastFetchedAt: null,
    notes: null,
    timesRead: 1,
    lastRead: null,
    originalLanguage: null,
    coverUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  activeGenres: string[] = [];
  toggledGenre: string | null = null;
  
  customShelves: Shelf[] = [];
  toggledShelfPayload: { bookId: string; shelfId: string } | null = null;

  compact = false;

  onGenreToggled(genre: string) {
    this.toggledGenre = genre;
  }

  onShelfToggled(payload: { bookId: string; shelfId: string }) {
    this.toggledShelfPayload = payload;
  }
}

describe('BookCardComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- SLICE 1: SCORE TESTS ---
  describe('Score Pill Display Logic', () => {
    it('hides the score entirely if score is null', () => {
      component.book = { ...component.book, score: null };
      fixture.detectChanges();
      const scoreElement = fixture.debugElement.query(By.css('[data-testid="score-pill"]'));
      expect(scoreElement).toBeFalsy();
    });

    it('hides the score entirely if score is 0', () => {
      component.book = { ...component.book, score: 0 };
      fixture.detectChanges();
      const scoreElement = fixture.debugElement.query(By.css('[data-testid="score-pill"]'));
      expect(scoreElement).toBeFalsy();
    });

    const scoreTestCases = [
      { score: 9, expectedColor: 'rgb(179, 74, 211)' },
      { score: 10, expectedColor: 'rgb(179, 74, 211)' },
      { score: 7, expectedColor: 'rgb(11, 163, 96)' },
      { score: 8, expectedColor: 'rgb(11, 163, 96)' },
      { score: 5, expectedColor: 'rgb(198, 167, 0)' },
      { score: 6, expectedColor: 'rgb(198, 167, 0)' },
      { score: 3, expectedColor: 'rgb(217, 119, 6)' },
      { score: 4, expectedColor: 'rgb(217, 119, 6)' },
      { score: 1, expectedColor: 'rgb(209, 67, 67)' },
      { score: 2, expectedColor: 'rgb(209, 67, 67)' },
    ];

    scoreTestCases.forEach(({ score, expectedColor }) => {
      it(`renders correct color (${expectedColor}) for score ${score}`, () => {
        component.book = { ...component.book, score };
        fixture.detectChanges();

        const scoreElement = fixture.debugElement.query(By.css('[data-testid="score-pill"]'));
        expect(scoreElement).toBeTruthy();
        expect(scoreElement.styles['color']).toBe(expectedColor);
      });
    });
  });

  // --- SLICE 2: GENRE TESTS ---
  describe('Genre Row Logic', () => {
    it('hides the genre row entirely if genres array is empty', () => {
      component.book = { ...component.book, genres: [] };
      fixture.detectChanges();
      const genreRow = fixture.debugElement.query(By.css('[data-testid="genre-row"]'));
      expect(genreRow).toBeFalsy();
    });

    it('renders genre pills and emits genreToggled on click', () => {
      component.book = { ...component.book, genres: ['Fantasy', 'Sci-Fi'] };
      fixture.detectChanges();

      const genreButtons = fixture.debugElement.queryAll(By.css('[data-testid="genre-pill"]'));
      expect(genreButtons.length).toBe(2);
      
      genreButtons[0]!.triggerEventHandler('click', null);
      expect(component.toggledGenre).toBe('Fantasy');
    });

    it('applies the active class if genre is in activeGenres array', () => {
      component.book = { ...component.book, genres: ['Fantasy', 'Sci-Fi'] };
      component.activeGenres = ['Sci-Fi'];
      fixture.detectChanges();

      const genreButtons = fixture.debugElement.queryAll(By.css('[data-testid="genre-pill"]'));
      expect(genreButtons[0]!.classes['active']).toBeFalsy();
      expect(genreButtons[1]!.classes['active']).toBeTruthy();
    });
  });

  // --- SLICE 3: SHELF TESTS ---
  describe('Shelf Dropdown Logic', () => {
    it('does not render the + Shelf button if customShelves is empty', () => {
      component.customShelves = [];
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('[data-testid="add-shelf-btn"]'));
      expect(btn).toBeFalsy();
    });

    it('toggles the dropdown when + Shelf button is clicked', () => {
      component.customShelves = [
        { id: 's1', userId: 'u1', name: 'Favorites', bookCount: 0, createdAt: new Date() }
      ];
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('[data-testid="add-shelf-btn"]'));
      
      let dropdown = fixture.debugElement.query(By.css('[data-testid="shelf-dropdown"]'));
      expect(dropdown).toBeFalsy();

      btn.triggerEventHandler('click', null);
      fixture.detectChanges();

      dropdown = fixture.debugElement.query(By.css('[data-testid="shelf-dropdown"]'));
      expect(dropdown).toBeTruthy();

      btn.triggerEventHandler('click', null);
      fixture.detectChanges();

      dropdown = fixture.debugElement.query(By.css('[data-testid="shelf-dropdown"]'));
      expect(dropdown).toBeFalsy();
    });

    it('shows correct checkmarks and emits payload on selection', () => {
      component.book = { ...component.book, id: 'b1' };
      component.customShelves = [
        { id: 's1', userId: 'u1', name: 'Favorites', bookCount: 1, bookIds: ['b1'], createdAt: new Date() },
        { id: 's2', userId: 'u1', name: 'To Read', bookCount: 0, bookIds: [], createdAt: new Date() }
      ];
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('[data-testid="add-shelf-btn"]'));
      btn.triggerEventHandler('click', null); 
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('[data-testid="shelf-item"]'));
      expect(items.length).toBe(2);

      expect(items[0]!.nativeElement.textContent).toContain('✓');
      expect(items[1]!.nativeElement.textContent).toContain('○');

      items[1]!.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.toggledShelfPayload).toEqual({ bookId: 'b1', shelfId: 's2' });
    });
  });

  // --- SLICE 4: LANGUAGE TESTS ---
  describe('Language Pill Logic', () => {
    it('does not render a language pill if language is null', () => {
      component.book = { ...component.book, language: null };
      fixture.detectChanges();
      const langPill = fixture.debugElement.query(By.css('[data-testid="language-pill"]'));
      expect(langPill).toBeFalsy();
    });

    const languageTestCases = [
      { language: 'English', expectedText: '🇬🇧 English' },
      { language: 'Japanese', expectedText: '🇯🇵 Japanese' },
      { language: 'Korean', expectedText: '🇰🇷 Korean' },
      { language: 'Chinese', expectedText: '🇨🇳 Chinese' },
      { language: 'Spanish', expectedText: '🇪🇸 Spanish' },
      { language: 'French', expectedText: 'French' },
    ];

    languageTestCases.forEach(({ language, expectedText }) => {
      it(`renders correct formatting for ${language}`, () => {
        component.book = { ...component.book, language };
        fixture.detectChanges();
        const langPill = fixture.debugElement.query(By.css('[data-testid="language-pill"]'));
        
        expect(langPill).toBeTruthy();
        expect(langPill.nativeElement.textContent.trim()).toBe(expectedText);
      });
    });
  });

  // --- SLICE 5: COMPACT MODE TESTS ---
  describe('Compact Mode Logic', () => {
    beforeEach(() => {
      component.book = { ...component.book, genres: ['Fantasy'] };
      component.customShelves = [
        { id: 's1', userId: 'u1', name: 'Favorites', bookCount: 0, createdAt: new Date() }
      ];
    });

    it('renders genre row and shelf button when compact is false', () => {
      component.compact = false;
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="genre-row"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.shelf-menu-container'))).toBeTruthy();
    });

    it('hides genre row and shelf button when compact is true', () => {
      component.compact = true;
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="genre-row"]'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.shelf-menu-container'))).toBeFalsy();
    });
  });

  // --- SLICE 6: NOTES & TRUNCATION TESTS ---
  describe('Notes and Truncation Logic', () => {
    it('does not render notes if book.notes is null', () => {
      component.book = { ...component.book, notes: null };
      fixture.detectChanges();
      const notesEl = fixture.debugElement.query(By.css('[data-testid="book-notes"]'));
      expect(notesEl).toBeFalsy();
    });

    it('renders notes if book.notes has content and compact is false', () => {
      component.book = { ...component.book, notes: 'A very short note.' };
      component.compact = false;
      fixture.detectChanges();
      const notesEl = fixture.debugElement.query(By.css('[data-testid="book-notes"]'));
      
      expect(notesEl).toBeTruthy();
      expect(notesEl.nativeElement.textContent.trim()).toBe('📝 A very short note.');
    });

    it('hides notes when compact is true', () => {
      component.book = { ...component.book, notes: 'A very short note.' };
      component.compact = true;
      fixture.detectChanges();
      const notesEl = fixture.debugElement.query(By.css('[data-testid="book-notes"]'));
      expect(notesEl).toBeFalsy();
    });

    it('truncates notes that are longer than 15 words', () => {
      const longNote = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen.';
      component.book = { ...component.book, notes: longNote };
      component.compact = false;
      fixture.detectChanges();
      
      const notesEl = fixture.debugElement.query(By.css('[data-testid="book-notes"]'));
      expect(notesEl.nativeElement.textContent.trim()).toBe('📝 One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen…');
    });
  });

  describe('Source Label Logic', () => {
    it('truncates long source labels to six characters plus dots', () => {
      component.book = {
        ...component.book,
        sources: [{ siteName: 'novelupdates', url: 'https://example.com' }],
      } as Book;
      fixture.detectChanges();

      const sourceLink = fixture.debugElement.query(By.css('[data-testid="source-link"]'));
      expect(sourceLink.nativeElement.textContent.trim()).toBe('novelu...');
    });

    it('keeps short source labels unchanged', () => {
      component.book = {
        ...component.book,
        sources: [{ siteName: 'Bato', url: 'https://example.com' }],
      } as Book;
      fixture.detectChanges();

      const sourceLink = fixture.debugElement.query(By.css('[data-testid="source-link"]'));
      expect(sourceLink.nativeElement.textContent.trim()).toBe('Bato');
    });
  });
});