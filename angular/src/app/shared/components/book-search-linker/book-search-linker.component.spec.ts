import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BookService } from '../../../core/book/book.service';
import { BookSearchLinkerComponent } from './book-search-linker.component';

const makeBook = (id: string, title: string) => ({
  id,
  userId: 'user-1',
  title,
  description: '',
  score: null,
  status: 'reading' as const,
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
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
});

describe('BookSearchLinkerComponent', () => {
  it('shows suggestions matching the typed query', () => {
    const control = new FormControl<string[]>([], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              makeBook('book-1', 'Solo Leveling'),
              makeBook('book-2', 'Tower of God'),
              makeBook('book-3', 'Sololink Quest'),
            ]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('[data-testid="related-book-input"]')).nativeElement as HTMLInputElement;
    input.value = 'solo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const suggestions = fixture.debugElement.query(By.css('[data-testid="related-book-suggestions"]'));
    expect(suggestions).not.toBeNull();
    expect(suggestions.nativeElement.textContent).toContain('Solo Leveling');
    expect(suggestions.nativeElement.textContent).toContain('Sololink Quest');
    expect(suggestions.nativeElement.textContent).not.toContain('Tower of God');
  });

  it('excludes already-selected IDs from suggestions', () => {
    const control = new FormControl<string[]>(['book-1'], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              makeBook('book-1', 'Solo Leveling'),
              makeBook('book-2', 'Solo Journey'),
            ]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('[data-testid="related-book-input"]')).nativeElement as HTMLInputElement;
    input.value = 'solo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const suggestions = fixture.debugElement.query(By.css('[data-testid="related-book-suggestions"]'));
    expect(suggestions).not.toBeNull();
    expect(suggestions.nativeElement.textContent).not.toContain('Solo Leveling');
    expect(suggestions.nativeElement.textContent).toContain('Solo Journey');
  });

  it('shows no suggestions when query is empty', () => {
    const control = new FormControl<string[]>([], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([makeBook('book-1', 'Solo Leveling')]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="related-book-suggestions"]'))).toBeNull();
  });

  it('selecting a suggestion adds its ID to the control and clears the query', () => {
    const control = new FormControl<string[]>([], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([makeBook('book-1', 'Solo Leveling')]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('[data-testid="related-book-input"]')).nativeElement as HTMLInputElement;
    input.value = 'solo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const suggestionButton = fixture.debugElement.query(By.css('[data-testid="related-book-suggestions"] button')).nativeElement as HTMLButtonElement;
    suggestionButton.click();
    fixture.detectChanges();

    expect(control.value).toContain('book-1');
    expect(fixture.componentInstance.searchQuery()).toBe('');
    expect(fixture.debugElement.query(By.css('[data-testid="related-book-suggestions"]'))).toBeNull();
  });

  it('resolves a related book ID to its title in the selected list', () => {
    const control = new FormControl<string[]>(['book-1'], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([makeBook('book-1', 'Solo Leveling')]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Solo Leveling');
  });

  it('falls back to the raw ID when the book is not found in local state', () => {
    const control = new FormControl<string[]>(['unknown-id'], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('unknown-id');
  });

  it('removes a related book from the control when × is clicked', () => {
    const control = new FormControl<string[]>(['book-1', 'book-2'], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [BookSearchLinkerComponent, ReactiveFormsModule],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              makeBook('book-1', 'Solo Leveling'),
              makeBook('book-2', 'Tower of God'),
            ]),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookSearchLinkerComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    const removeButton = fixture.debugElement.query(By.css('[data-testid="remove-related-book-1"]')).nativeElement as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(control.value).not.toContain('book-1');
    expect(control.value).toContain('book-2');
  });
});
