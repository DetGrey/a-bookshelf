import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BookFormFieldsComponent } from './book-form-fields.component';

function buildForm(fb: FormBuilder): FormGroup {
  return fb.group({
    title: [''],
    description: [''],
    score: [null],
    status: ['plan_to_read'],
    genres: [''],
    language: [''],
    chapterCount: [null],
    coverUrl: [''],
    notes: [''],
    timesRead: [1],
    lastRead: [''],
    latestChapter: [''],
    lastUploadedAt: [''],
    originalLanguage: [''],
    sources: [[]],
    shelves: [[]],
    relatedBookIds: [[]],
  });
}

describe('BookFormFieldsComponent', () => {
  it('renders score dropdown with 1–10 options', () => {
    TestBed.configureTestingModule({
      imports: [BookFormFieldsComponent, ReactiveFormsModule],
    });

    const fb = TestBed.inject(FormBuilder);
    const form = buildForm(fb);
    const fixture = TestBed.createComponent(BookFormFieldsComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('[data-testid="score-select"]'));
    expect(select).not.toBeNull();
    const options = select.nativeElement.querySelectorAll('option');
    // blank + 10 numeric options
    expect(options.length).toBeGreaterThanOrEqual(10);
  });

  it('renders notes textarea', () => {
    TestBed.configureTestingModule({
      imports: [BookFormFieldsComponent, ReactiveFormsModule],
    });

    const fb = TestBed.inject(FormBuilder);
    const form = buildForm(fb);
    const fixture = TestBed.createComponent(BookFormFieldsComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="notes-textarea"]'))).not.toBeNull();
  });

  it('renders timesRead, lastRead, latestChapter, lastUploadedAt, originalLanguage inputs', () => {
    TestBed.configureTestingModule({
      imports: [BookFormFieldsComponent, ReactiveFormsModule],
    });

    const fb = TestBed.inject(FormBuilder);
    const form = buildForm(fb);
    const fixture = TestBed.createComponent(BookFormFieldsComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="times-read-input"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="last-read-input"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="latest-chapter-input"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="last-uploaded-at-input"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="original-language-input"]'))).not.toBeNull();
  });

  it('two-way binds notes to the form control', async () => {
    TestBed.configureTestingModule({
      imports: [BookFormFieldsComponent, ReactiveFormsModule],
    });

    const fb = TestBed.inject(FormBuilder);
    const form = buildForm(fb);
    const fixture = TestBed.createComponent(BookFormFieldsComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('[data-testid="notes-textarea"]')).nativeElement as HTMLTextAreaElement;
    textarea.value = 'my reading notes';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(form.get('notes')!.value).toBe('my reading notes');
  });

  it('normalizes timesRead on blur to integer with minimum 1', () => {
    TestBed.configureTestingModule({
      imports: [BookFormFieldsComponent, ReactiveFormsModule],
    });

    const fb = TestBed.inject(FormBuilder);
    const form = buildForm(fb);
    const fixture = TestBed.createComponent(BookFormFieldsComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('[data-testid="times-read-input"]')).nativeElement as HTMLInputElement;

    input.value = '0';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(form.get('timesRead')!.value).toBe(1);

    input.value = '2.6';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(form.get('timesRead')!.value).toBe(3);
  });
});
