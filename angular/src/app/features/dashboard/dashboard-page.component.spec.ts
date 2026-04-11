import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BookService } from '../../core/book/book.service';
import { QualityToolsService } from '../../core/quality/quality-tools.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  it('renders dashboard stats and ignores zero scores in the average', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Book A',
                description: '',
                score: 0,
                status: 'waiting',
                genres: ['action'],
                language: 'en',
                chapterCount: 10,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-2',
                userId: 'user-1',
                title: 'Book B',
                description: '',
                score: 8,
                status: 'completed',
                genres: ['drama'],
                language: 'en',
                chapterCount: 20,
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(2),
            averageScore: signal(8),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Average score');
    expect(fixture.nativeElement.textContent).toContain('8');
    expect(fixture.nativeElement.textContent).toContain('Total saved');
  });

  it('shows top five breakdown items and expands extras on demand', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1',
                userId: 'user-1',
                title: 'Book A',
                description: '',
                score: 7,
                status: 'waiting',
                genres: ['action', 'fantasy', 'drama', 'romance', 'comedy', 'horror'],
                language: 'en',
                chapterCount: 10,
                sourceUrls: [
                  'https://alpha.example/one',
                  'https://beta.example/two',
                  'https://gamma.example/three',
                  'https://delta.example/four',
                  'https://epsilon.example/five',
                  'https://zeta.example/six',
                ],
                coverUrl: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(1),
            averageScore: signal(7),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('action (1)');
    expect(fixture.nativeElement.textContent).toContain('fantasy (1)');
    expect(fixture.nativeElement.textContent).toContain('drama (1)');
    expect(fixture.nativeElement.textContent).toContain('comedy (1)');
    expect(fixture.nativeElement.textContent).not.toContain('romance (1)');
    expect(fixture.nativeElement.textContent).toContain('alpha.example (1)');
    expect(fixture.nativeElement.textContent).not.toContain('zeta.example (1)');

    const genreToggle = fixture.debugElement.query(By.css('[data-testid="toggle-genres"]'));
    const sourceToggle = fixture.debugElement.query(By.css('[data-testid="toggle-sources"]'));
    genreToggle.nativeElement.click();
    sourceToggle.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('romance (1)');
    expect(fixture.nativeElement.textContent).toContain('zeta.example (1)');
  });

  it('renders quality hub entry points', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([]),
            bookCount: signal(0),
            averageScore: signal(0),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="duplicate-title-scanner"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="stale-waiting-scanner"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="cover-checker"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="backup-download"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="backup-restore"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="genre-consolidation"]'))).not.toBeNull();
  });

  it('launches the duplicate-title scan and shows a summary message', () => {
    const scanDuplicateTitles = jest.fn().mockReturnValue({
      groups: [{ title: 'Solo Leveling', normalizedTitle: 'solo leveling', books: ['book-1', 'book-2'], count: 2 }],
      duplicateCount: 1,
    });

    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([]),
            bookCount: signal(0),
            averageScore: signal(0),
          },
        },
        {
          provide: QualityToolsService,
          useValue: {
            scanDuplicateTitles,
            scanStaleWaiting: jest.fn(),
            scanCoverHealth: jest.fn(),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('[data-testid="duplicate-title-scanner"]')).nativeElement as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(scanDuplicateTitles).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Duplicate groups: 1');
  });
});