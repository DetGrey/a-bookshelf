import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-form-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrl: './book-form-fields.component.scss',
  template: `
    <fieldset class="book-form-fields stack" [formGroup]="form()">
      <label class="field" for="title">
        <span>Title</span>
        <input id="title" data-testid="title-input" formControlName="title" autoCapitalize="sentences" />
      </label>

      <label class="field" for="description">
        <span>Description</span>
        <textarea id="description" rows="3" formControlName="description" autoCapitalize="sentences"></textarea>
      </label>

      <div class="grid-2">
        <label class="field" for="status">
          <span>Status</span>
          <select id="status" formControlName="status">
            <option value="plan_to_read">Plan to read</option>
            <option value="reading">Reading</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
            <option value="on_hold">On hold</option>
          </select>
        </label>

        <label class="field" for="score">
          <span>Score</span>
          <select id="score" data-testid="score-select" formControlName="score">
            <option [ngValue]="null">Unscored</option>
            @for (n of scoreOptions; track n) {
              <option [ngValue]="n">{{ n }}</option>
            }
          </select>
        </label>
      </div>

      <div class="grid-2">
        <label class="field" for="timesRead">
          <span>Times Read</span>
          <input
            id="timesRead"
            data-testid="times-read-input"
            type="number"
            min="1"
            formControlName="timesRead"
            (blur)="normalizeTimesRead()"
          />
        </label>

        <label class="field" for="chapterCount">
          <span>Chapter Count</span>
          <input id="chapterCount" type="number" min="0" placeholder="Auto-filled when available" formControlName="chapterCount" />
        </label>
      </div>

      <div class="grid-2">
        <label class="field" for="lastRead">
          <span>Last Read</span>
          <input id="lastRead" data-testid="last-read-input" formControlName="lastRead" placeholder="Ch 50" autoCapitalize="sentences" />
        </label>

        <label class="field" for="coverUrl">
          <span>Cover Image URL</span>
          <input id="coverUrl" type="url" formControlName="coverUrl" placeholder="https://..." />
        </label>

        <label class="field" for="language">
          <span>Language</span>
          <input id="language" formControlName="language" placeholder="English, Spanish..." autoCapitalize="words" />
        </label>

        <label class="field" for="originalLanguage">
          <span>Original Language</span>
          <input
            id="originalLanguage"
            data-testid="original-language-input"
            formControlName="originalLanguage"
            placeholder="Japanese, Korean, English..."
            autoCapitalize="sentences"
          />
        </label>
      </div>

      <div class="grid-2">
        <label class="field" for="genres">
          <span>Genres</span>
          <input id="genres" formControlName="genres" placeholder="Action, Romance, Fantasy" autoCapitalize="words" />
        </label>

        <label class="field" for="latestChapter">
          <span>Latest Chapter (site)</span>
          <input id="latestChapter" data-testid="latest-chapter-input" formControlName="latestChapter" autoCapitalize="sentences" />
        </label>
      </div>

      <label class="field" for="lastUploadedAt">
        <span>Last Uploaded At (site)</span>
        <input id="lastUploadedAt" data-testid="last-uploaded-at-input" type="datetime-local" formControlName="lastUploadedAt" />
      </label>

      <label class="field" for="notes">
        <span>Notes</span>
        <textarea
          id="notes"
          data-testid="notes-textarea"
          formControlName="notes"
          rows="3"
          placeholder="Personal notes, reading progress, etc."
        ></textarea>
      </label>
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
