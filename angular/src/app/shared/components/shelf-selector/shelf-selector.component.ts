import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Shelf } from '../../../models/shelf.model';

@Component({
  selector: 'app-shelf-selector',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Shelves</legend>

      @if (availableShelves().length > 0) {
        <ul>
          @for (shelf of availableShelves(); track shelf.id) {
            <li>
              <label>
                <input
                  type="checkbox"
                  [attr.data-testid]="'shelf-toggle-' + shelf.id"
                  [checked]="isSelected(shelf.id)"
                  (change)="toggleShelf(shelf.id)"
                />
                {{ shelf.name }}
              </label>
            </li>
          }
        </ul>
      } @else {
        <input
          data-testid="shelf-selector-input"
          [(ngModel)]="pendingShelfId"
          name="pendingShelfId"
          placeholder="Shelf ID"
        />
        <button data-testid="add-shelf-button" type="button" (click)="addShelf()">Add shelf</button>

        <ul>
          @for (shelfId of control().value; track shelfId) {
            <li>
              {{ shelfId }}
              <button type="button" (click)="removeShelf(shelfId)">×</button>
            </li>
          }
        </ul>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShelfSelectorComponent {
  readonly control = input.required<FormControl<string[]>>();
  readonly availableShelves = input<Shelf[]>([]);

  pendingShelfId = '';

  isSelected(shelfId: string): boolean {
    return this.control().value.includes(shelfId);
  }

  toggleShelf(shelfId: string): void {
    const current = this.control().value;
    if (current.includes(shelfId)) {
      this.control().setValue(current.filter((id) => id !== shelfId));
    } else {
      this.control().setValue([...current, shelfId]);
    }
  }

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

  removeShelf(shelfId: string): void {
    this.control().setValue(this.control().value.filter((id) => id !== shelfId));
  }
}
