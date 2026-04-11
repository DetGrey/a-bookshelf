import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ShelfSelectorComponent } from './shelf-selector.component';

describe('ShelfSelectorComponent', () => {
  it('shows checkbox list when availableShelves are provided', () => {
    const control = new FormControl<string[]>([], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [ShelfSelectorComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(ShelfSelectorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('availableShelves', [
      { id: 'shelf-1', name: 'Favorites', userId: 'user-1', bookCount: 0, bookIds: [], createdAt: new Date() },
      { id: 'shelf-2', name: 'Reading', userId: 'user-1', bookCount: 0, bookIds: [], createdAt: new Date() },
    ]);
    fixture.detectChanges();

    const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
    expect(checkboxes.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Favorites');
    expect(fixture.nativeElement.textContent).toContain('Reading');
  });

  it('falls back to manual ID input when no availableShelves', () => {
    const control = new FormControl<string[]>([], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [ShelfSelectorComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(ShelfSelectorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('availableShelves', []);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="shelf-selector-input"]'))).not.toBeNull();
  });

  it('toggling unchecked shelf adds it to the control value', () => {
    const control = new FormControl<string[]>([], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [ShelfSelectorComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(ShelfSelectorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('availableShelves', [
      { id: 'shelf-1', name: 'Favorites', userId: 'user-1', bookCount: 0, bookIds: [], createdAt: new Date() },
    ]);
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(By.css('[data-testid="shelf-toggle-shelf-1"]')).nativeElement as HTMLInputElement;
    checkbox.dispatchEvent(new Event('change'));

    expect(control.value).toContain('shelf-1');
  });

  it('toggling checked shelf removes it from the control value', () => {
    const control = new FormControl<string[]>(['shelf-1'], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [ShelfSelectorComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(ShelfSelectorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('availableShelves', [
      { id: 'shelf-1', name: 'Favorites', userId: 'user-1', bookCount: 0, bookIds: [], createdAt: new Date() },
    ]);
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(By.css('[data-testid="shelf-toggle-shelf-1"]')).nativeElement as HTMLInputElement;
    checkbox.dispatchEvent(new Event('change'));

    expect(control.value).not.toContain('shelf-1');
  });

  it('already-selected shelves render their checkboxes as checked', () => {
    const control = new FormControl<string[]>(['shelf-1'], { nonNullable: true });

    TestBed.configureTestingModule({
      imports: [ShelfSelectorComponent, ReactiveFormsModule],
    });

    const fixture = TestBed.createComponent(ShelfSelectorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('availableShelves', [
      { id: 'shelf-1', name: 'Favorites', userId: 'user-1', bookCount: 0, bookIds: [], createdAt: new Date() },
      { id: 'shelf-2', name: 'Reading', userId: 'user-1', bookCount: 0, bookIds: [], createdAt: new Date() },
    ]);
    fixture.detectChanges();

    const favCheckbox = fixture.debugElement.query(By.css('[data-testid="shelf-toggle-shelf-1"]')).nativeElement as HTMLInputElement;
    const readingCheckbox = fixture.debugElement.query(By.css('[data-testid="shelf-toggle-shelf-2"]')).nativeElement as HTMLInputElement;

    expect(favCheckbox.checked).toBe(true);
    expect(readingCheckbox.checked).toBe(false);
  });
});
