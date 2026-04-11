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
    chapterCount: new FormControl<number | null>(null),
    coverUrl: new FormControl('', { nonNullable: true }),
  });

  it('fetches metadata and shows preview states before apply', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        title: 'Solo Leveling',
        description: 'Hunters and gates',
        image: 'https://images.example.com/solo.jpg',
        genres: ['Action', 'Fantasy'],
        language: 'English',
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

    const fetchButton = fixture.debugElement.query(By.css('[data-testid="metadata-fetch-button"]')).nativeElement as HTMLButtonElement;
    fetchButton.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(invoke).toHaveBeenCalledWith('fetch-metadata', {
      body: { url: 'https://example.com/series' },
    });
    expect(fixture.nativeElement.textContent).toContain('Solo Leveling');
    expect(fixture.nativeElement.textContent).toContain('Ready to apply metadata');
  });

  it('applies metadata safely without overwriting existing values', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: {
        title: 'Fetched title',
        description: 'Fetched description',
        image: 'https://images.example.com/fetched.jpg',
        genres: ['Action'],
        language: 'English',
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
    expect(form.controls.chapterCount.value).toBe(50);
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

    const fetchButton = fixture.debugElement.query(By.css('[data-testid="metadata-fetch-button"]')).nativeElement as HTMLButtonElement;
    fetchButton.click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('metadata failed');
  });
});
