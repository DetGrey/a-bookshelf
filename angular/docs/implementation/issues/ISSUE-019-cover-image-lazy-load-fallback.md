# ISSUE-019 — CoverImage: Lazy Loading, Gradient Fallback, and Timeout

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 component rules — dumb components, OnPush)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-015
- User stories covered:
  - As a user, book covers load progressively as I scroll so the page doesn't stall on dozens of image requests at once.
  - As a user, books with missing or broken covers show a distinct colour gradient so I can still identify them visually.

## What to build

Upgrade `CoverImageComponent` (`shared/components/cover-image/`) to match the React `CoverImage.jsx` behaviour exactly. The component is dumb (accepts `src` and `alt` inputs only — no service injection).

### Current state
The component passes `src` through a Cloudflare proxy URL and shows a "No cover" div when `src` is absent. It has no lazy loading, no fallback gradient, and no timeout.

### Target behaviour

#### Inputs
```typescript
src = input<string | null | undefined>(null);
alt = input<string>('');
lazy = input<boolean>(true);
```
(Remove any existing proxy transformation — the proxy URL conversion should remain in the parent or in a separate utility if already used elsewhere, but the component itself should not be concerned with it.)

#### Gradient fallback
Compute a hue from a hash of the `alt` (or title) text:
```typescript
private hashHue(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}
```
Fallback style:
```typescript
readonly fallbackStyle = computed(() => {
  const hue = this.hashHue(this.alt() || 'cover');
  return {
    background: `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${(hue + 30) % 360} 60% 45%))`,
  };
});
```
Always render the fallback div behind (or instead of) the image. Show it when: `src` is empty, image has errored, or image has not yet loaded.

#### State signals
```typescript
private readonly shouldLoad = signal(false);
private readonly errored = signal(false);
private readonly imageLoaded = signal(false);

readonly showImage = computed(() =>
  this.shouldLoad() && !!this.src() && !this.errored()
);
```

#### Lazy loading via `IntersectionObserver`
In `ngAfterViewInit` (or `afterNextRender`):
```typescript
if (!this.lazy()) {
  this.shouldLoad.set(true);
  return;
}

if (typeof IntersectionObserver === 'undefined') {
  this.shouldLoad.set(true);
  return;
}

const observer = new IntersectionObserver((entries) => {
  if (entries[0]?.isIntersecting) {
    this.shouldLoad.set(true);
    observer.disconnect();
  }
}, { rootMargin: '120px' });

observer.observe(this.holderEl.nativeElement);
// store observer ref, disconnect on ngOnDestroy
```
Use `@ViewChild` to get a reference to the host `<span>` element.

#### 3-second timeout for broken URLs
When `shouldLoad()` flips to `true` and `src` is non-null, start a 3-second timer. If the image hasn't loaded (`imageLoaded() === false`) when the timer fires, set `errored.set(true)`. Cancel the timer on `ngOnDestroy` and whenever `src` changes.

#### Reset on `src` change
Use `effect()` watching `src` to reset `errored` and `imageLoaded` to `false` whenever `src` changes.

#### Template
```html
<span #holder class="cover-holder">
  @if (showImage()) {
    <img
      [src]="src()"
      [alt]="alt()"
      [class.cover-loading]="!imageLoaded()"
      (load)="imageLoaded.set(true)"
      (error)="errored.set(true)"
    />
  }
  @if (!showImage() || !imageLoaded()) {
    <div class="cover-fallback" [ngStyle]="fallbackStyle()">
      <span>{{ alt() || 'No cover' }}</span>
    </div>
  }
</span>
```

#### `NgStyle` import
Import `NgStyle` from `@angular/common` to apply the gradient style object.

### Proxy URL
The existing `buildCloudflareImageProxyUrl` utility is used in `QualityToolsService`. Check if `CoverImageComponent` is currently calling it internally. If so, move that responsibility to the parent components that pass `src` (i.e. parents construct the proxy URL before passing it in). The component itself should not know about the proxy.

## Acceptance criteria
- [ ] When `lazy=true` (default), image `<img>` is not rendered until the element scrolls within 120px of the viewport.
- [ ] When `IntersectionObserver` is unavailable, image loads immediately.
- [ ] When `src` is null or empty, the gradient fallback is shown immediately without attempting to load an image.
- [ ] When the image errors, the gradient fallback replaces the image.
- [ ] When 3 seconds pass without `onLoad` firing, `errored` is set and the gradient fallback shows.
- [ ] The gradient colour is derived from the `alt` text — same input always produces same gradient.
- [ ] Changing `src` resets errored/loaded state (gradient shows again until new image loads).
- [ ] Tests cover: lazy flag disables intersection observer path, error → fallback, timeout → fallback, gradient computation determinism.
- [ ] Existing test baseline preserved.

## Blocked by
- Blocked by ISSUE-015.
