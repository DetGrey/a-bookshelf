import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-shelf-selector',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Shelves</legend>
      <input
        data-testid="shelf-selector-input"
        [(ngModel)]="pendingShelfId"
        name="pendingShelfId"
        placeholder="Shelf ID"
      />
      <button data-testid="add-shelf-button" type="button" (click)="addShelf()">Add shelf</button>

      <ul>
        @for (shelfId of control().value; track shelfId) {
          <li>{{ shelfId }}</li>
        }
      </ul>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShelfSelectorComponent {
  readonly control = input.required<FormControl<string[]>>();

  pendingShelfId = '';

  addShelf(): void {
    const shelfId = this.pendingShelfId.trim();
    if (!shelfId) {
      return;
    }

    const current = this.control().value;
    if (current.includes(shelfId)) {
      return;
    }

    this.control().setValue([...current, shelfId]);
    this.pendingShelfId = '';
  }
}
