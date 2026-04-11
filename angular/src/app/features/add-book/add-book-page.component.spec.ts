import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BookService } from '../../core/book/book.service';
import { SUPABASE_CLIENT } from '../../core/supabase.token';
import { AddBookPageComponent } from './add-book-page.component';

describe('AddBookPageComponent', () => {
  it('submits manual form and navigates to bookshelf on success', async () => {
    const createBook = jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'book-1',
        userId: 'user-1',
        title: 'Solo Leveling',
      },
    });
    const navigate = jest.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [AddBookPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            createBook,
            isLoading: signal(false),
            errorMessage: signal(null),
            books: signal([
              {
                id: 'book-99',
                userId: 'user-1',
                title: 'Related Title',
                description: '',
                score: null,
                status: 'reading',
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
              },
            ]),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(AddBookPageComponent);
    fixture.detectChanges();

    const titleInput = fixture.debugElement.query(By.css('[data-testid="title-input"]')).nativeElement as HTMLInputElement;
    titleInput.value = 'Solo Leveling';
    titleInput.dispatchEvent(new Event('input'));

    fixture.debugElement.query(By.css('[data-testid="source-manager-toggle"]')).nativeElement.click();
    fixture.detectChanges();

    const sourceInput = fixture.debugElement.query(By.css('[data-testid="source-url-input"]')).nativeElement as HTMLInputElement;
    sourceInput.value = 'https://example.com/solo-leveling';
    sourceInput.dispatchEvent(new Event('input'));

    const addSourceButton = fixture.debugElement.query(By.css('[data-testid="add-source-button"]')).nativeElement as HTMLButtonElement;
    addSourceButton.click();

    const shelfInput = fixture.debugElement.query(By.css('[data-testid="shelf-selector-input"]')).nativeElement as HTMLInputElement;
    shelfInput.value = 'shelf-1';
    shelfInput.dispatchEvent(new Event('input'));

    const addShelfButton = fixture.debugElement.query(By.css('[data-testid="add-shelf-button"]')).nativeElement as HTMLButtonElement;
    addShelfButton.click();

    fixture.debugElement.query(By.css('[data-testid="book-search-linker-toggle"]')).nativeElement.click();
    fixture.detectChanges();

    // Search for the related book by title, then select it from suggestions
    const relatedInput = fixture.debugElement.query(By.css('[data-testid="related-book-input"]')).nativeElement as HTMLInputElement;
    relatedInput.value = 'Related';
    relatedInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const suggestionButton = fixture.debugElement.query(By.css('[data-testid="related-book-suggestions"] button')).nativeElement as HTMLButtonElement;
    suggestionButton.click();
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(By.css('[data-testid="save-book-button"]')).nativeElement as HTMLButtonElement;
    saveButton.click();

    await Promise.resolve();

    expect(createBook).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Solo Leveling',
      sources: [{ siteName: '', url: 'https://example.com/solo-leveling' }],
      shelves: ['shelf-1'],
      relatedBookIds: ['book-99'],
    }));
    expect(navigate).toHaveBeenCalledWith(['/bookshelf']);
  });

  it('does not submit when required title is missing', async () => {
    const createBook = jest.fn();

    TestBed.configureTestingModule({
      imports: [AddBookPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            createBook,
            isLoading: signal(false),
            errorMessage: signal(null),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(AddBookPageComponent);
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(By.css('[data-testid="save-book-button"]')).nativeElement as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    await Promise.resolve();

    expect(createBook).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Please fix validation errors before saving');
  });
});
