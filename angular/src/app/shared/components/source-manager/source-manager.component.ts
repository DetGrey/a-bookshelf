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

      <input
        data-testid="source-url-input"
        [(ngModel)]="pendingUrl"
        name="pendingSourceUrl"
        placeholder="Source URL"
      />
      <button data-testid="add-source-button" type="button" (click)="addSource()">Add source</button>

      <ul>
        @for (group of sources().controls; track $index) {
          <li>{{ group.controls.url.value }}</li>
        }
      </ul>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceManagerComponent {
  readonly sources = input.required<FormArray<SourceFormGroup>>();

  pendingUrl = '';

  addSource(): void {
    const url = this.pendingUrl.trim();
    if (!url) {
      return;
    }

    this.sources().push(
      new FormGroup({
        siteName: new FormControl('', { nonNullable: true }),
        url: new FormControl(url, { nonNullable: true, validators: [Validators.required] }),
      }),
    );

    this.pendingUrl = '';
  }
}
