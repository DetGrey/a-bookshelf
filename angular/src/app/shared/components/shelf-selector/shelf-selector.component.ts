import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Shelf } from '../../../models/shelf.model';

@Component({
  selector: 'app-shelf-selector',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  styleUrl: './shelf-selector.component.scss',
  template: `
    <fieldset class="shelf-selector">
      <legend>Add to Shelves (optional)</legend>

      @if (availableShelves().length > 0) {
        <ul class="pill-row mt-4 shelves-list">
          @for (shelf of availableShelves(); track shelf.id) {
            <li>
              <label class="pill-toggle" [class.selected]="isSelected(shelf.id)">
                <input
                  type="checkbox"
                  [attr.data-testid]="'shelf-toggle-' + shelf.id"
                  [checked]="isSelected(shelf.id)"
                  (change)="toggleShelf(shelf.id)"
                />
                <span>{{ isSelected(shelf.id) ? '✓ ' : '' }}{{ shelf.name }}</span>
              </label>
            </li>
          }
        </ul>
      } @else {
        <label class="field">
          <span>Shelf ID</span>
          <input
            data-testid="shelf-selector-input"
            [(ngModel)]="pendingShelfId"
            name="pendingShelfId"
            placeholder="Shelf ID"
          />
        </label>
        <button data-testid="add-shelf-button" type="button" class="ghost" (click)="addShelf()">Add shelf</button>

        <ul class="manual-list">
          @for (shelfId of control().value; track shelfId) {
            <li>
              {{ shelfId }}
              <button type="button" (click)="removeShelf(shelfId)">✕</button>
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
