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
  styleUrl: './source-manager.component.scss',
  template: `
    <section class="card source-manager">
      <button
        type="button"
        class="ghost collapsible-header"
        [class.expanded]="!isCollapsed"
        (click)="isCollapsed = !isCollapsed"
      >
        <p class="eyebrow">Source Links</p>
        <span class="collapsible-arrow">{{ isCollapsed ? '▶' : '▼' }}</span>
      </button>

      @if (!isCollapsed) {
        @if (sources().length > 0) {
          <div class="source-grid">
            @for (group of sources().controls; track $index) {
              <div class="source-card">
                <div>
                  <strong>{{ group.controls.siteName.value || group.controls.url.value }}</strong>
                  <p class="muted text-small word-break-all">{{ group.controls.url.value }}</p>
                </div>
                <button
                  type="button"
                  class="ghost text-danger"
                  [attr.data-testid]="'remove-source-' + $index"
                  (click)="removeSource($index)"
                >
                  Remove
                </button>
              </div>
            }
          </div>
        }

        <form class="stack mt-8" (submit)="$event.preventDefault(); addSource()">
          <p class="eyebrow">Add New Source</p>
          <div class="grid-2">
            <label class="field">
              <span>Label</span>
              <input
                data-testid="source-sitename-input"
                [(ngModel)]="pendingSiteName"
                name="pendingSiteName"
                placeholder="Official, Scanlation A..."
                (input)="pendingSiteName = ($any($event.target).value || '')"
              />
            </label>

            <label class="field">
              <span>URL</span>
              <input
                data-testid="source-url-input"
                [(ngModel)]="pendingUrl"
                name="pendingSourceUrl"
                placeholder="https://..."
                (input)="pendingUrl = ($any($event.target).value || '')"
                (blur)="suggestSiteName()"
              />
            </label>
          </div>

          <button data-testid="add-source-button" type="button" class="ghost" (click)="addSource()">+ Add Source</button>
        </form>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceManagerComponent {
  readonly sources = input.required<FormArray<SourceFormGroup>>();

  pendingUrl = '';
  pendingSiteName = '';
  isCollapsed = false;

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
