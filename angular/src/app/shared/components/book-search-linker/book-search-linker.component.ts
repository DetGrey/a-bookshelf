import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-search-linker',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Related books</legend>
      <input
        data-testid="related-book-input"
        [(ngModel)]="pendingRelatedId"
        name="pendingRelatedBookId"
        placeholder="Related book ID"
      />
      <button data-testid="add-related-button" type="button" (click)="addRelated()">Add related</button>

      <ul>
        @for (relatedId of control().value; track relatedId) {
          <li>{{ relatedId }}</li>
        }
      </ul>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSearchLinkerComponent {
  readonly control = input.required<FormControl<string[]>>();

  pendingRelatedId = '';

  addRelated(): void {
    const relatedId = this.pendingRelatedId.trim();
    if (!relatedId) {
      return;
    }

    const current = this.control().value;
    if (current.includes(relatedId)) {
      return;
    }

    this.control().setValue([...current, relatedId]);
    this.pendingRelatedId = '';
  }
}
