import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { buildCloudflareImageProxyUrl } from '../../utils/image-proxy';

@Component({
  selector: 'app-cover-image',
  standalone: true,
  template: `
    @if (imageUrl()) {
      <img [attr.src]="imageUrl()" [attr.alt]="alt()" />
    } @else {
      <div>No cover</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverImageComponent {
  readonly src = input<string | null>(null);
  readonly alt = input('Book cover');

  readonly imageUrl = computed(() => buildCloudflareImageProxyUrl(this.src()));
}
