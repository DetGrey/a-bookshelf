import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

type SourceFormGroup = FormGroup<{
  siteName: FormControl<string>;
  url: FormControl<string>;
}>;

@Component({
  selector: 'app-source-manager',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Sources</legend>

      <div>
        <input
          data-testid="source-url-input"
          [(ngModel)]="pendingUrl"
          name="pendingSourceUrl"
          placeholder="Source URL"
          (blur)="suggestSiteName()"
        />
        <input
          data-testid="source-sitename-input"
          [(ngModel)]="pendingSiteName"
          name="pendingSiteName"
          placeholder="Site name (optional)"
        />
        <button data-testid="add-source-button" type="button" (click)="addSource()">Add source</button>
      </div>

      <ul>
        @for (group of sources().controls; track $index) {
          <li>
            <span>{{ group.controls.siteName.value || group.controls.url.value }}</span>
            <a [attr.href]="group.controls.url.value" target="_blank" rel="noopener noreferrer">
              {{ group.controls.url.value }}
            </a>
            <button type="button" [attr.data-testid]="'remove-source-' + $index" (click)="removeSource($index)">×</button>
          </li>
        }
      </ul>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceManagerComponent {
  readonly sources = input.required<FormArray<SourceFormGroup>>();

  pendingUrl = '';
  pendingSiteName = '';

  suggestSiteName(): void {
    if (this.pendingSiteName) {
      return;
    }

    try {
      this.pendingSiteName = new URL(this.pendingUrl).hostname.replace(/^www\./, '');
    } catch {
      // invalid URL — leave siteName empty
    }
  }

  addSource(): void {
    const url = this.pendingUrl.trim();
    if (!url) {
      return;
    }

    this.sources().push(
      new FormGroup({
        siteName: new FormControl(this.pendingSiteName.trim(), { nonNullable: true }),
        url: new FormControl(url, { nonNullable: true, validators: [Validators.required] }),
      }),
    );

    this.pendingUrl = '';
    this.pendingSiteName = '';
  }

  removeSource(index: number): void {
    this.sources().removeAt(index);
  }
}
