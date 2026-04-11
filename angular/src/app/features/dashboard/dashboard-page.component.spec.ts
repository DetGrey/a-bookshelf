import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BookService } from '../../core/book/book.service';
import { QualityToolsService } from '../../core/quality/quality-tools.service';
import { BackupRestoreService } from '../../core/backup/backup-restore.service';
import { DashboardPageComponent } from './dashboard-page.component';

const backupRestoreStub = {
  exportLibrary: jest.fn().mockResolvedValue({
    success: true,
    data: {
      profile: { id: 'user-1', email: 'reader@example.com' },
      books: [],
      shelves: [],
      bookLinks: [],
      relatedBooks: [],
      shelfBooks: [],
    },
  }),
  restoreLibrary: jest.fn().mockResolvedValue({
    success: true,
    data: {
      booksUpserted: 0,
      shelvesUpserted: 0,
      bookLinksUpserted: 0,
      relatedBooksUpserted: 0,
      shelfBooksUpserted: 0,
      errorCount: 0,
      errors: [],
    },
  }),
};

describe('DashboardPageComponent', () => {
  it('renders completed count and last updated title stat cards', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1', userId: 'user-1', title: 'Older', description: '',
                score: 7, status: 'completed', genres: ['action'], language: 'en',
                chapterCount: 10, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-2', userId: 'user-1', title: 'Newest', description: '',
                score: 8, status: 'reading', genres: ['drama'], language: 'en',
                chapterCount: 20, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-03T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(2),
            averageScore: signal(7.5),
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Completed');
    expect(fixture.nativeElement.textContent).toContain('1');
    expect(fixture.nativeElement.textContent).toContain('Last updated');
    expect(fixture.nativeElement.textContent).toContain('Newest');
  });

  it('renders dashboard stats and ignores zero scores in the average', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1', userId: 'user-1', title: 'Book A', description: '',
                score: 0, status: 'waiting', genres: ['action'], language: 'en',
                chapterCount: 10, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-2', userId: 'user-1', title: 'Book B', description: '',
                score: 8, status: 'completed', genres: ['drama'], language: 'en',
                chapterCount: 20, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(2),
            averageScore: signal(8),
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
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
                id: 'book-1', userId: 'user-1', title: 'Book A', description: '',
                score: 7, status: 'waiting',
                genres: ['action', 'fantasy', 'drama', 'romance', 'comedy', 'horror'],
                language: 'en', chapterCount: 10,
                sourceUrls: [
                  'https://alpha.example/one', 'https://beta.example/two',
                  'https://gamma.example/three', 'https://delta.example/four',
                  'https://epsilon.example/five', 'https://zeta.example/six',
                ],
                latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(1),
            averageScore: signal(7),
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
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
        { provide: BackupRestoreService, useValue: backupRestoreStub },
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
        { provide: BackupRestoreService, useValue: backupRestoreStub },
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

  it('exports and restores backups from the dashboard controls', async () => {
    const exportLibrary = jest.fn().mockResolvedValue({
      success: true,
      data: {
        profile: { id: 'user-1', email: 'reader@example.com' },
        books: [],
        shelves: [],
        bookLinks: [],
        relatedBooks: [],
        shelfBooks: [],
      },
    });
    const restoreLibrary = jest.fn().mockResolvedValue({
      success: true,
      data: {
        booksUpserted: 1,
        shelvesUpserted: 1,
        bookLinksUpserted: 0,
        relatedBooksUpserted: 0,
        shelfBooksUpserted: 0,
        errorCount: 0,
        errors: [],
      },
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
            scanDuplicateTitles: jest.fn(),
            scanStaleWaiting: jest.fn(),
            scanCoverHealth: jest.fn(),
          },
        },
        {
          provide: BackupRestoreService,
          useValue: {
            exportLibrary,
            restoreLibrary,
          },
        },
      ],
    });

    Object.defineProperty(URL, 'revokeObjectURL', { value: jest.fn(), configurable: true });
    const createSpy = jest.fn().mockReturnValue('blob:backup');
    Object.defineProperty(URL, 'createObjectURL', { value: createSpy, configurable: true });
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    await fixture.componentInstance.downloadBackup();
    fixture.detectChanges();

    expect(exportLibrary).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Backup exported.');

    const file = {
      text: jest.fn().mockResolvedValue(JSON.stringify({
        profile: { id: 'user-1', email: 'reader@example.com' },
        books: [],
        shelves: [],
        bookLinks: [],
        relatedBooks: [],
        shelfBooks: [],
      })),
    } as unknown as File;

    await fixture.componentInstance.onBackupFileSelected({
      target: { files: [file] },
    } as unknown as Event);
    fixture.detectChanges();

    expect(restoreLibrary).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Restore complete. Books: 1, shelves: 1');

    createSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('shows cover repair button only after a scan that finds external covers', async () => {
    const scanCoverHealth = jest.fn().mockReturnValue({
      issues: [],
      missingCount: 0,
      externalCount: 2,
      proxiedCount: 0,
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
            scanDuplicateTitles: jest.fn(),
            scanStaleWaiting: jest.fn(),
            scanCoverHealth,
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="cover-repair"]'))).toBeNull();

    const coverCheckButton = fixture.debugElement.query(By.css('[data-testid="cover-checker"]')).nativeElement as HTMLButtonElement;
    coverCheckButton.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="cover-repair"]'))).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Repair 2 external covers');
  });

  it('executes cover repair and shows the completion summary', async () => {
    const scanCoverHealth = jest.fn().mockReturnValue({
      issues: [],
      missingCount: 0,
      externalCount: 1,
      proxiedCount: 0,
    });
    const repairExternalCovers = jest.fn().mockResolvedValue({
      success: true,
      data: { repairedCount: 1, skippedCount: 0, issues: [] },
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
            scanDuplicateTitles: jest.fn(),
            scanStaleWaiting: jest.fn(),
            scanCoverHealth,
            repairExternalCovers,
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="cover-checker"]')).nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="cover-repair"]')).nativeElement.click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    expect(repairExternalCovers).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.textContent).toContain('Cover repair complete');
    expect(fixture.nativeElement.textContent).toContain('Repaired: 1');
    expect(fixture.debugElement.query(By.css('[data-testid="cover-repair"]'))).toBeNull();
  });

  it('walks through the full genre consolidation flow: start → select → confirm → result', async () => {
    const consolidateGenres = jest.fn().mockResolvedValue({
      success: true,
      data: {
        updatedCount: 3,
        targetGenre: 'Fantasy',
        sourceGenres: ['fantasy', 'high fantasy'],
        mode: 'merge',
      },
    });

    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-1', userId: 'user-1', title: 'Book A', description: '',
                score: null, status: 'reading', genres: ['fantasy', 'action'], language: 'en',
                chapterCount: 10, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(1),
            averageScore: signal(0),
          },
        },
        {
          provide: QualityToolsService,
          useValue: {
            scanDuplicateTitles: jest.fn(),
            scanStaleWaiting: jest.fn(),
            scanCoverHealth: jest.fn(),
            consolidateGenres,
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    // Step 1: click Genre consolidation to open the selection panel
    fixture.debugElement.query(By.css('[data-testid="genre-consolidation"]')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="genre-consolidation-panel"]'))).not.toBeNull();

    // Step 2: select the 'fantasy' genre using the component's method (toggleSourceGenre is the public API)
    fixture.componentInstance.toggleSourceGenre('fantasy');
    fixture.componentInstance.consolidationTarget = 'Fantasy';
    fixture.detectChanges();

    const confirmButton = fixture.debugElement.query(By.css('[data-testid="consolidation-confirm"]')).nativeElement as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    expect(consolidateGenres).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Genre consolidation complete');
    expect(fixture.nativeElement.textContent).toContain('3 book(s)');
    // Panel is gone, idle button is back
    expect(fixture.debugElement.query(By.css('[data-testid="genre-consolidation"]'))).not.toBeNull();
  });

  it('cancelling genre consolidation resets back to idle state', () => {
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
            scanDuplicateTitles: jest.fn(),
            scanStaleWaiting: jest.fn(),
            scanCoverHealth: jest.fn(),
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="genre-consolidation"]')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="genre-consolidation-panel"]'))).not.toBeNull();

    fixture.debugElement.query(By.css('[data-testid="consolidation-cancel"]')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="genre-consolidation-panel"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="genre-consolidation"]'))).not.toBeNull();
  });

  it('renders per-status recent sections and orders books by updatedAt desc', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal([
              {
                id: 'book-r-old', userId: 'user-1', title: 'Reading Old', description: '',
                score: null, status: 'reading', genres: [], language: null,
                chapterCount: null, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z'),
              },
              {
                id: 'book-r-new', userId: 'user-1', title: 'Reading New', description: '',
                score: null, status: 'reading', genres: [], language: null,
                chapterCount: null, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-03T00:00:00.000Z'),
              },
              {
                id: 'book-plan', userId: 'user-1', title: 'Plan Book', description: '',
                score: null, status: 'plan_to_read', genres: [], language: null,
                chapterCount: null, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-04T00:00:00.000Z'),
              },
              {
                id: 'book-wait', userId: 'user-1', title: 'Waiting Book', description: '',
                score: null, status: 'waiting', genres: [], language: null,
                chapterCount: null, latestChapter: null, lastUploadedAt: null, lastFetchedAt: null,
                notes: null, timesRead: 1, lastRead: null, originalLanguage: null,
                coverUrl: null, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-05T00:00:00.000Z'),
              },
            ]),
            bookCount: signal(4),
            averageScore: signal(0),
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const readingSection = fixture.componentInstance.statusSections().find((section) => section.key === 'reading');
    expect(readingSection?.books.map((book) => book.title)).toEqual(['Reading New', 'Reading Old']);

    expect(fixture.debugElement.query(By.css('[data-testid="status-section-reading"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="status-section-plan_to_read"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="status-section-waiting"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="status-section-completed"]'))).toBeNull();

    const compactGrids = fixture.debugElement.queryAll(By.css('[data-testid^="status-section-"] app-book-grid'));
    expect(compactGrids.length).toBe(3);
  });

  it('uses 4 books per status on wide screens and 3 on narrow screens', async () => {
    const readingBooks = Array.from({ length: 5 }).map((_, index) => ({
      id: `reading-${index}`,
      userId: 'user-1',
      title: `Reading ${index}`,
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
      updatedAt: new Date(`2026-01-0${index + 1}T00:00:00.000Z`),
    }));

    const originalWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });

    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BookService,
          useValue: {
            books: signal(readingBooks),
            bookCount: signal(readingBooks.length),
            averageScore: signal(0),
          },
        },
        { provide: BackupRestoreService, useValue: backupRestoreStub },
      ],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const readingSection = fixture.componentInstance.statusSections().find((section) => section.key === 'reading');
    expect(readingSection?.books.length).toBe(4);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    const narrowSection = fixture.componentInstance.statusSections().find((section) => section.key === 'reading');
    expect(narrowSection?.books.length).toBe(3);

    fixture.destroy();

    if (originalWidthDescriptor) {
      Object.defineProperty(window, 'innerWidth', originalWidthDescriptor);
    }
  });
});