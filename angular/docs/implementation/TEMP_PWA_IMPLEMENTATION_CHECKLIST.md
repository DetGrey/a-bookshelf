# Temporary PWA Implementation Checklist (Online-Only)

Date: 2026-04-18
Status: Draft checklist
Scope: Make the Angular site installable like an app, while remaining online-only behavior

## 1. Base requirements

- [ ] Production site is served over HTTPS (GitHub Pages should satisfy this).
- [ ] App is deployed under the correct repo subpath (example: `/a-bookshelf/`).
- [ ] Existing SPA deep-link fallback remains in place (`index.html` copied to `404.html`).

## 2. Add installable PWA support

- [ ] Add Angular PWA/service worker support for the project.
- [ ] Ensure these files exist:
- [ ] `manifest.webmanifest`
- [ ] `ngsw-config.json`
- [ ] Ensure production build config enables service worker.

## 3. Configure manifest for GitHub Pages

- [ ] Set `name` and `short_name`.
- [ ] Set `display` to `standalone`.
- [ ] Set `theme_color` and `background_color`.
- [ ] Set `start_url` to repo subpath root (example: `/a-bookshelf/`).
- [ ] Set `scope` to the same repo subpath (example: `/a-bookshelf/`).
- [ ] Add install icons: 192x192 and 512x512 PNG.

## 4. Keep caching lightweight (online-first)

- [ ] Keep default/static asset caching only.
- [ ] Do not add offline route goals.
- [ ] Do not add API/data offline caching rules.
- [ ] Keep app behavior dependent on network, same as current site.

## 5. Ensure metadata is complete

- [ ] Confirm manifest is linked in app HTML head.
- [ ] Confirm theme-color meta tag is present.
- [ ] Confirm icons are included in built output.

## 6. Build and deploy

- [ ] Production build succeeds.
- [ ] Build output contains manifest and service worker files.
- [ ] Deploy to GitHub Pages.
- [ ] Confirm deployed paths resolve correctly under repo subpath.

## 7. Compatibility setup (no manual checklist)

- [ ] Use standard PWA settings supported by Chromium browsers (Android, desktop).
- [ ] Keep manifest and metadata standards-compliant for best compatibility on other browsers.
- [ ] Accept platform differences in install UI (for example iOS uses Add to Home Screen from Share menu).

---

## Minimal success criteria

- Install option is available in supported browsers.
- App launches from home screen/start menu in standalone mode.
- App remains online-only in behavior (no offline target).
- Routing works correctly on GitHub Pages under repo subpath.

## Notes

- This checklist intentionally avoids direct code edits.
- Replace example subpaths with your actual GitHub Pages repo path.
