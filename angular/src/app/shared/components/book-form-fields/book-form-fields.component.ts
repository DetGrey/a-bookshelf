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

      <label for="score">Score</label>
      <select id="score" data-testid="score-select" formControlName="score">
        <option [ngValue]="null">Unscored</option>
        @for (n of scoreOptions; track n) {
          <option [ngValue]="n">{{ n }}</option>
        }
      </select>

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

      <label for="latestChapter">Latest Chapter</label>
      <input id="latestChapter" data-testid="latest-chapter-input" formControlName="latestChapter" />

      <label for="lastUploadedAt">Last Uploaded At</label>
      <input id="lastUploadedAt" data-testid="last-uploaded-at-input" type="datetime-local" formControlName="lastUploadedAt" />

      <label for="coverUrl">Cover URL</label>
      <input id="coverUrl" formControlName="coverUrl" />

      <label for="originalLanguage">Original Language</label>
      <input id="originalLanguage" data-testid="original-language-input" formControlName="originalLanguage"
        placeholder="Japanese, Korean, English..." />

      <label for="notes">Notes</label>
      <textarea id="notes" data-testid="notes-textarea" formControlName="notes" rows="3"
        placeholder="Personal notes, reading progress, etc."></textarea>

      <label for="timesRead">Times Read</label>
      <input
        id="timesRead"
        data-testid="times-read-input"
        type="number"
        min="1"
        formControlName="timesRead"
        (blur)="normalizeTimesRead()"
      />

      <label for="lastRead">Last Read</label>
      <input id="lastRead" data-testid="last-read-input" formControlName="lastRead" placeholder="Ch 50" />
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookFormFieldsComponent {
  readonly form = input.required<FormGroup>();
  readonly scoreOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  normalizeTimesRead(): void {
    const control = this.form().get('timesRead');
    if (!control) {
      return;
    }

    const rawValue = control.value;
    const parsed = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    const normalized = Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 1;

    if (rawValue !== normalized) {
      control.setValue(normalized);
    }
  }
}
