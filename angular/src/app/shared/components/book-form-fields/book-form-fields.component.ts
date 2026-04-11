import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-form-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <fieldset [formGroup]="form()">
      <label for="title">Title</label>
      <input id="title" data-testid="title-input" formControlName="title" />

      <label for="description">Description</label>
      <textarea id="description" formControlName="description"></textarea>

      <label for="status">Status</label>
      <select id="status" formControlName="status">
        <option value="plan_to_read">Plan to read</option>
        <option value="reading">Reading</option>
        <option value="waiting">Waiting</option>
        <option value="completed">Completed</option>
        <option value="dropped">Dropped</option>
        <option value="on_hold">On hold</option>
      </select>

      <label for="genres">Genres</label>
      <input id="genres" formControlName="genres" />

      <label for="language">Language</label>
      <input id="language" formControlName="language" />

      <label for="chapterCount">Chapter Count</label>
      <input id="chapterCount" type="number" formControlName="chapterCount" />

      <label for="coverUrl">Cover URL</label>
      <input id="coverUrl" formControlName="coverUrl" />
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookFormFieldsComponent {
  readonly form = input.required<FormGroup>();
}
