import { TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { SourceManagerComponent } from './source-manager.component';

type SourceFormGroup = FormGroup<{ siteName: FormControl<string>; url: FormControl<string> }>;

function makeSourcesArray(items: Array<{ siteName: string; url: string }> = []): FormArray<SourceFormGroup> {
  const array = new FormArray<SourceFormGroup>([]);
  for (const item of items) {
    array.push(new FormGroup({
      siteName: new FormControl(item.siteName, { nonNullable: true }),
      url: new FormControl(item.url, { nonNullable: true }),
    }));
  }
  return array;
}

describe('SourceManagerComponent', () => {
  const openSection = (fixture: ReturnType<typeof TestBed.createComponent<SourceManagerComponent>>) => {
    const toggle = fixture.debugElement.query(By.css('[data-testid="source-manager-toggle"]')).nativeElement as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
  };

  it('adds a source to the FormArray when URL is provided', () => {
    const sources = makeSourcesArray();

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();
    openSection(fixture);

    const urlInput = fixture.debugElement.query(By.css('[data-testid="source-url-input"]')).nativeElement as HTMLInputElement;
    urlInput.value = 'https://example.com/book';
    urlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const addButton = fixture.debugElement.query(By.css('[data-testid="add-source-button"]')).nativeElement as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    expect(sources.length).toBe(1);
    expect(sources.at(0).controls.url.value).toBe('https://example.com/book');
  });

  it('clears URL and siteName inputs after adding a source', () => {
    const sources = makeSourcesArray();

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();
    openSection(fixture);

    fixture.componentInstance.pendingUrl = 'https://example.com/book';
    fixture.componentInstance.pendingSiteName = 'Example';
    fixture.detectChanges();

    fixture.componentInstance.addSource();

    expect(fixture.componentInstance.pendingUrl).toBe('');
    expect(fixture.componentInstance.pendingSiteName).toBe('');
  });

  it('skips adding a source when URL is empty', () => {
    const sources = makeSourcesArray();

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();
    openSection(fixture);

    fixture.componentInstance.addSource();

    expect(sources.length).toBe(0);
  });

  it('removes a source at the given index', () => {
    const sources = makeSourcesArray([
      { siteName: 'Alpha', url: 'https://alpha.example/book' },
      { siteName: 'Beta', url: 'https://beta.example/book' },
    ]);

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();
    openSection(fixture);

    const removeButton = fixture.debugElement.query(By.css('[data-testid="remove-source-0"]')).nativeElement as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(sources.length).toBe(1);
    expect(sources.at(0).controls.siteName.value).toBe('Beta');
  });

  it('auto-suggests siteName from URL hostname on blur when siteName is empty', () => {
    const sources = makeSourcesArray();

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();

    fixture.componentInstance.pendingUrl = 'https://www.novelupdates.com/series/test';
    fixture.componentInstance.pendingSiteName = '';
    fixture.detectChanges();

    fixture.componentInstance.suggestSiteName();

    expect(fixture.componentInstance.pendingSiteName).toBe('novelupdates.com');
  });

  it('does not overwrite siteName when it is already set', () => {
    const sources = makeSourcesArray();

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();

    fixture.componentInstance.pendingUrl = 'https://example.com/book';
    fixture.componentInstance.pendingSiteName = 'My Custom Name';
    fixture.detectChanges();

    fixture.componentInstance.suggestSiteName();

    expect(fixture.componentInstance.pendingSiteName).toBe('My Custom Name');
  });

  it('leaves siteName empty when URL is not a valid URL', () => {
    const sources = makeSourcesArray();

    TestBed.configureTestingModule({
      imports: [SourceManagerComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(SourceManagerComponent);
    fixture.componentRef.setInput('sources', sources);
    fixture.detectChanges();

    fixture.componentInstance.pendingUrl = 'not-a-valid-url';
    fixture.componentInstance.pendingSiteName = '';

    fixture.componentInstance.suggestSiteName();

    expect(fixture.componentInstance.pendingSiteName).toBe('');
  });
});
