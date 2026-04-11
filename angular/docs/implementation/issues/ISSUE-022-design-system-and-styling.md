# ISSUE-022 — Design System and Application-Wide Styling

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§10 styling — SCSS, component-scoped, global tokens)

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-021
- User stories covered:
  - As a user, the Angular app looks and feels like the React app: dark theme, consistent spacing, readable typography, and visual hierarchy across all pages.

## What to build

The React app ships a full CSS design system. The Angular app has `_tokens.scss` (stub) and `_layout.scss` (stub) but no component styles. This issue wires up the complete visual layer. Implement entirely in SCSS — no inline styles except dynamic ones computed from signals (score colours, cover gradients).

---

### 1. Global tokens (`src/styles/_tokens.scss`)

Define all CSS custom properties:

```scss
:root {
  // Colours
  --bg: #0f1117;
  --panel: #1a1d27;
  --border: #2a2d3a;
  --text: #e8eaf0;
  --text-muted: #8b90a0;
  --accent: #6c63ff;
  --accent-2: #00d4aa;
  --error: #ef4444;
  --success: #10b981;

  // Radius / shadow
  --radius: 12px;
  --radius-sm: 6px;
  --shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

  // Typography
  --font-body: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'Sora', monospace;

  // Spacing scale (used via utility classes)
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

Load Google Fonts in `index.html` (or `styles.scss` `@import`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@400;600&display=swap" rel="stylesheet">
```

---

### 2. Global reset and base (`src/styles.scss`)

```scss
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

h1, h2, h3 { font-weight: 600; line-height: 1.2; }

input, select, textarea, button {
  font-family: inherit;
  font-size: inherit;
}
```

---

### 3. Utility classes (`src/styles/_utilities.scss`)

Minimal set matching React usage:
```scss
.muted { color: var(--text-muted); }
.eyebrow { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
.pill {
  display: inline-flex; align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  background: var(--accent);
  color: #fff;
  &.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
  &.shelf-indicator { background: var(--panel); border: 1px solid var(--border); }
}
.pill-row { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: var(--shadow);
}
.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.ghost {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  color: var(--text);
  cursor: pointer;
  &:hover { border-color: var(--accent); }
}
.field {
  display: flex; flex-direction: column; gap: var(--space-1);
  span { font-size: 0.85rem; color: var(--text-muted); }
  input, select, textarea {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    padding: 8px 12px;
    &:focus { outline: none; border-color: var(--accent); }
  }
}
.stack { display: flex; flex-direction: column; gap: var(--space-4); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.error { color: var(--error); font-size: 0.9rem; }
.success { color: var(--success); font-size: 0.9rem; }
```

---

### 4. Layout (`src/styles/_layout.scss`)

```scss
.bookshelf-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-4);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);

  article {
    @extend .card;
    text-align: center;
    h2 { font-size: 0.8rem; color: var(--text-muted); margin-bottom: var(--space-1); }
    p { font-size: 1.8rem; font-weight: 700; }
  }
}
```

---

### 5. Navigation bar (`app-shell` / nav component)
Apply styles to the navigation:
```scss
nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;

  a { color: var(--text-muted); font-size: 0.9rem; }
  a:hover, a.active { color: var(--text); }
}
```

---

### 6. Book card component styles

Create `book-card.component.scss`:
```scss
:host { display: block; }

.card-head {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: var(--space-3);
}

.title-text {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.genre-pills button { cursor: pointer; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
}

.card-links {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.shelf-dropdown {
  position: absolute;
  right: 0;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  min-width: 160px;
  z-index: 50;

  button {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    width: 100%;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    &:hover { background: var(--bg); }
  }
}
```

---

### 7. Book grid component styles
Create `book-grid.component.scss`:
```scss
:host { display: block; }

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}
```

---

### 8. Auth page styles
Create `login-page.component.scss` and `signup-page.component.scss` (or a shared auth SCSS partial):
```scss
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--space-4);
}

.auth-card {
  @extend .card;
  width: 100%;
  max-width: 400px;

  .eyebrow { margin-bottom: var(--space-2); }
  h1 { margin-bottom: var(--space-1); }
  p.sub { color: var(--text-muted); margin-bottom: var(--space-6); font-size: 0.9rem; }
}
```

---

### 9. Cover image component styles
Create `cover-image.component.scss`:
```scss
:host { display: inline-block; }

.cover-holder {
  display: inline-block;
  width: 80px;
  height: 110px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  text-align: center;
  padding: 4px;
  color: rgba(255,255,255,0.85);
  border-radius: var(--radius-sm);
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
  transition: opacity 0.2s;
  &.cover-loading { opacity: 0; }
}
```

---

### 10. Sidebar styles
The sidebar in `BookshelfPageComponent`:
```scss
.bookshelf-layout aside {
  button {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.9rem;
    &:hover { background: var(--panel); color: var(--text); }
    &.active { background: var(--panel); color: var(--text); border-left: 2px solid var(--accent); }
  }
}
```

---

### 11. Form fieldsets (SourceManager, ShelfSelector, BookSearchLinker)
Style `<fieldset>` elements to look like sections rather than HTML fieldsets:
```scss
fieldset {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  legend { font-size: 0.85rem; color: var(--text-muted); padding: 0 var(--space-1); }
}
```

---

## Acceptance criteria
- [x] CSS custom properties are defined in `_tokens.scss` and available app-wide.
- [x] Body has dark background `#0f1117`, panel cards use `#1a1d27`, text is `#e8eaf0`.
- [x] Space Grotesk font loads and is applied to body text.
- [x] Dashboard stat grid uses responsive `auto-fill` columns.
- [x] Book grid uses responsive `auto-fill` columns (min 260px).
- [x] Bookshelf layout uses a 220px sidebar + 1fr main content grid.
- [x] Navigation bar is sticky with panel background.
- [x] Auth pages are centred on screen with a max-width card.
- [x] Pill, ghost, primary, field, card utility classes work consistently.
- [x] Cover image component shows correct sizing (80×110px default thumbnail).
- [x] No visual regressions to any feature introduced in ISSUE-000–021.

## Completion notes
- Added full design token set, utility classes, global base/reset rules, and responsive layout primitives under `src/styles/` while preserving the import-only `styles.scss` contract.
- Wired component-scoped SCSS for auth pages, `BookCardComponent`, `BookGridComponent`, and `CoverImageComponent`, and updated nav styling in `app.component.scss` for sticky panel parity.
- Loaded Space Grotesk/Sora fonts in `src/index.html` and aligned major layout surfaces (dashboard stats, bookshelf sidebar/main grid) to the ISSUE spec.
- Validation: full regression passed (`npm test`): 31/31 suites, 210/210 tests.

## Blocked by
- Blocked by ISSUE-021 (all components must exist before final styling pass).

## Notes
- Existing `_tokens.scss` and `_layout.scss` stubs will be replaced wholesale — no migration needed.
- Dynamic colours (score pills, cover gradients) stay as `[style]` bindings in templates; only static structural styles go in SCSS files.
- Do not use `ViewEncapsulation.None` — keep Angular's default emulated encapsulation and use component-scoped SCSS files.
