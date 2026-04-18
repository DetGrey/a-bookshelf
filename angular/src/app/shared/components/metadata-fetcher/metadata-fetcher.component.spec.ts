import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SUPABASE_CLIENT } from '../../../core/supabase.token';
import { MetadataFetcherComponent } from './metadata-fetcher.component';

describe('MetadataFetcherComponent', () => {
  const createForm = () => new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    genres: new FormControl('', { nonNullable: true }),
    language: new FormControl('', { nonNullable: true }),
    latestChapter: new FormControl('', { nonNullable: true }),
    chapterCount: new FormControl<number | null>(null),
    coverUrl: new FormControl('', { nonNullable: true }),
  });

  it('prefills Source URL input when prefillSourceUrl is provided and input is empty', () => {
    TestBed.configureTestingModule({
      imports: [MetadataFetcherComponent, ReactiveFormsModule],
      providers: [{ provide: SUPABASE_CLIENT, useValue: { functions: { invoke: jest.fn() } } }],
    });

    const fixture = TestBed.createComponent(MetadataFetcherComponent);
    fixture.componentRef.setInput('form', createForm());
    fixture.componentRef.setInput('prefillSourceUrl', 'https://example.com/series');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('[data-testid="metadata-url-input"]')).nativeElement as HTMLInputElement;
    expect(input.value).toBe('https://example.com/series');
  });

  it('fetches metadata and shows a rich preview card before applying', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        title: 'Solo Leveling',
        description: 'Hunters and gates',
        image: 'https://images.example.com/solo.jpg',
        genres: ['Action', 'Fantasy'],
        language: 'English',
        latest_chapter: 'Chapter 210',
        chapter_count: 210,
      },
      error: null,
    });

    TestBed.configureTestingModule({
      imports: [MetadataFetcherComponent, ReactiveFormsModule],
      providers: [
        { provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } },
      ],
    });

    const fixture = TestBed.createComponent(MetadataFetcherComponent);
    fixture.componentRef.setInput('form', createForm());
    fixture.detectChanges();

    const urlInput = fixture.debugElement.query(By.css('[data-testid="metadata-url-input"]')).nativeElement as HTMLInputElement;
    urlInput.value = 'https://example.com/series';
    urlInput.dispatchEvent(new Event('input'));
    fixture.componentInstance.sourceUrl = 'https://example.com/series';
    fixture.detectChanges();

    const fetchButton = fixture.debugElement.query(By.css('[data-testid="metadata-fetch-button"]')).nativeElement as HTMLButtonElement;
    fetchButton.click();
    
    // Wait for the async Supabase call
    await fixture.whenStable();
    fixture.detectChanges();

    const previewCard = fixture.debugElement.query(By.css('[data-testid="fetched-preview"]'));
    expect(previewCard).toBeTruthy();
    expect(previewCard.nativeElement.textContent).toContain('Solo Leveling');
    expect(previewCard.nativeElement.textContent).toContain('Hunters and gates');
    expect(previewCard.nativeElement.textContent).toContain('Action');
    expect(previewCard.nativeElement.textContent).toContain('Fantasy');
    expect(previewCard.nativeElement.textContent).toContain('Latest: Chapter 210');
    expect(previewCard.nativeElement.textContent).toContain('Chapters: 210');
    expect(fixture.nativeElement.textContent).toContain('Fetched Preview');

    const cover = fixture.debugElement.query(By.css('app-cover-image'));
    expect(cover).toBeTruthy();
  });

  it('applies metadata safely without overwriting existing values', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        title: 'Fetched title',
        description: 'Fetched description',
        image: 'https://images.example.com/fetched.jpg',
        genres: ['Action'],
        language: 'English',
        latest_chapter: 'Chapter 50',
        chapter_count: 50,
      },
      error: null,
    });

    const form = createForm();
    form.patchValue({
      title: 'Manual title',
      description: '',
      coverUrl: '',
      genres: '',
      language: 'Japanese',
      latestChapter: '',
      chapterCount: null,
    });

    TestBed.configureTestingModule({
      imports: [MetadataFetcherComponent, ReactiveFormsModule],
      providers: [
        { provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } },
      ],
    });

    const fixture = TestBed.createComponent(MetadataFetcherComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    const urlInput = fixture.debugElement.query(By.css('[data-testid="metadata-url-input"]')).nativeElement as HTMLInputElement;
    urlInput.value = 'https://example.com/series';
    urlInput.dispatchEvent(new Event('input'));
    fixture.componentInstance.sourceUrl = 'https://example.com/series';
    fixture.detectChanges();

    const fetchButton = fixture.debugElement.query(By.css('[data-testid="metadata-fetch-button"]')).nativeElement as HTMLButtonElement;
    fetchButton.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const applyButton = fixture.debugElement.query(By.css('[data-testid="metadata-apply-button"]')).nativeElement as HTMLButtonElement;
    applyButton.click();
    fixture.detectChanges();

    expect(form.controls.title.value).toBe('Manual title');
    expect(form.controls.description.value).toBe('Fetched description');
    expect(form.controls.language.value).toBe('Japanese');
    expect(form.controls.latestChapter.value).toBe('Chapter 50');
    expect(form.controls.chapterCount.value).toBe(50);
    expect(fixture.debugElement.query(By.css('[data-testid="fetched-preview"]'))).toBeFalsy();
  });

  it('supports edge response wrapped in metadata object', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        metadata: {
          title: 'Wrapped title',
          description: 'Wrapped description',
          image: 'https://images.example.com/wrapped.jpg',
          genres: ['Drama'],
          latest_chapter: 'Episode 12',
          chapter_count: 12,
        },
      },
      error: null,
    });

    const form = createForm();

    TestBed.configureTestingModule({
      imports: [MetadataFetcherComponent, ReactiveFormsModule],
      providers: [{ provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } }],
    });

    const fixture = TestBed.createComponent(MetadataFetcherComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    fixture.componentInstance.sourceUrl = 'https://example.com/series';
    await fixture.componentInstance.fetchMetadata();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="fetched-preview"]'))).toBeTruthy();

    const applyButton = fixture.debugElement.query(By.css('[data-testid="metadata-apply-button"]')).nativeElement as HTMLButtonElement;
    applyButton.click();
    fixture.detectChanges();

    expect(form.controls.title.value).toBe('Wrapped title');
    expect(form.controls.latestChapter.value).toBe('Episode 12');
    expect(form.controls.chapterCount.value).toBe(12);
  });

  it('shows endpoint error state when fetch fails', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'metadata failed' },
    });

    TestBed.configureTestingModule({
      imports: [MetadataFetcherComponent, ReactiveFormsModule],
      providers: [
        { provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } },
      ],
    });

    const fixture = TestBed.createComponent(MetadataFetcherComponent);
    fixture.componentRef.setInput('form', createForm());
    fixture.detectChanges();

    const urlInput = fixture.debugElement.query(By.css('[data-testid="metadata-url-input"]')).nativeElement as HTMLInputElement;
    urlInput.value = 'https://example.com/series';
    urlInput.dispatchEvent(new Event('input'));
    fixture.componentInstance.sourceUrl = 'https://example.com/series';
    fixture.detectChanges();

    const fetchButton = fixture.debugElement.query(By.css('[data-testid="metadata-fetch-button"]')).nativeElement as HTMLButtonElement;
    fetchButton.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('metadata failed');
  });

  it('hides the preview card when clear-preview-btn is clicked', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: { title: 'Test', description: 'Desc' },
      error: null
    });

    TestBed.configureTestingModule({
      imports: [MetadataFetcherComponent, ReactiveFormsModule],
      providers: [{ provide: SUPABASE_CLIENT, useValue: { functions: { invoke } } }],
    });

    const fixture = TestBed.createComponent(MetadataFetcherComponent);
    fixture.componentRef.setInput('form', createForm());
    
    // Simulate fetched state
    fixture.componentInstance.sourceUrl = 'https://test.com';
    await fixture.componentInstance.fetchMetadata();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="fetched-preview"]'))).toBeTruthy();

    const clearBtn = fixture.debugElement.query(By.css('[data-testid="clear-preview-btn"]')).nativeElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="fetched-preview"]'))).toBeFalsy();
  });
});
