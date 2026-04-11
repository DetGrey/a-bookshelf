import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ErrorCode } from '../../models/result.model';
import { BookDetailsPageComponent } from './book-details-page.component';

describe('BookDetailsPageComponent', () => {
  it('renders read mode sections from resolver data', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Solo Leveling',
                      description: 'Hunters and gates',
                      score: 9,
                      status: 'reading',
                      genres: ['Action', 'Fantasy'],
                      language: 'English',
                      chapterCount: 210,
                      coverUrl: 'https://images.example.com/solo.jpg',
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [{ siteName: 'Example', url: 'https://example.com/solo' }],
                    relatedBooks: [{ bookId: 'book-2', relation: 'related' }],
                    shelves: [{ id: 'shelf-1', name: 'Favorites' }],
                  },
                },
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Solo Leveling');
    expect(fixture.nativeElement.textContent).toContain('Hunters and gates');
    expect(fixture.nativeElement.textContent).toContain('Favorites');
    expect(fixture.nativeElement.textContent).toContain('https://example.com/solo');
    expect(fixture.nativeElement.textContent).toContain('book-2');
  });

  it('shows fallback values for missing metadata and relations', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: true,
                  data: {
                    book: {
                      id: 'book-1',
                      userId: 'user-1',
                      title: 'Untitled',
                      description: '',
                      score: null,
                      status: 'plan_to_read',
                      genres: [],
                      language: null,
                      chapterCount: null,
                      coverUrl: null,
                      createdAt: new Date('2026-01-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                    },
                    sources: [],
                    relatedBooks: [],
                    shelves: [],
                  },
                },
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No description available');
    expect(fixture.nativeElement.textContent).toContain('Unscored');
    expect(fixture.nativeElement.textContent).toContain('Unknown');
    expect(fixture.nativeElement.textContent).toContain('No sources');
    expect(fixture.nativeElement.textContent).toContain('No shelves');
    expect(fixture.nativeElement.textContent).toContain('No related books');
  });

  it('renders resolver failure message', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                book: {
                  success: false,
                  error: {
                    code: ErrorCode.NotFound,
                    message: 'Book not found',
                  },
                },
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(BookDetailsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Book not found');
  });
});
