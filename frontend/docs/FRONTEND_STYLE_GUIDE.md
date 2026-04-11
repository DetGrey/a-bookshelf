# Frontend Style Guide

This guide explains the visual system so a rebuilt frontend can match the current website, regardless of framework or target platform.

## 1) Overall visual direction
- Dark, polished, personal-library aesthetic.
- Soft glassmorphism panels over a subtle multi-stop gradient background.
- Accent-driven CTAs with strong contrast.
- Dense enough for power use, but still spacious and readable.
- Rounded corners, soft borders, and modern card-based structure.

### Design personality
- Modern but not playful.
- Utility-first, information-dense, and calm.
- Slightly premium feel without becoming glossy or neon-heavy.

## 2) Color system

These are the actual values used by the current interface.

### Core palette
- Background base: `#06070f`
- Background gradient:
  - `radial-gradient(circle at 20% 20%, rgba(0, 201, 167, 0.12), transparent 35%)`
  - `radial-gradient(circle at 80% 10%, rgba(255, 158, 44, 0.12), transparent 25%)`
  - `linear-gradient(120deg, #05060d, #07091a 60%, #05060d)`
- Panel surface: `rgba(255, 255, 255, 0.04)`
- Panel hover / stronger surface: `rgba(255, 255, 255, 0.07)`
- Border: `rgba(255, 255, 255, 0.1)`
- Primary text: `#e8ecf3`
- Muted text: `#a8b2c1`
- Accent 1: `#00c9a7`
- Accent 2: `#ff9e2c`
- Dark CTA text: `#05060d`
- Success text: `#4ade80` (good match for success state language)
- Error text: `#ff7b7b`

### Functional usage
- Primary actions: `linear-gradient(135deg, #00c9a7, #ff9e2c)`
- Secondary actions: panel background with faint border
- Success: green emphasis for saved / updated states
- Error: red emphasis for validation and network failures
- Warning/info: muted helper text or accent-adjacent tone

### Token mapping for implementation
- `--bg`: `#06070f`
- `--panel`: `rgba(255, 255, 255, 0.04)`
- `--panel-strong`: `rgba(255, 255, 255, 0.07)`
- `--border`: `rgba(255, 255, 255, 0.1)`
- `--text-primary`: `#e8ecf3`
- `--text-muted`: `#a8b2c1`
- `--accent`: `#00c9a7`
- `--accent-2`: `#ff9e2c`
- `--radius`: `12px`
- `--shadow`: `0 8px 24px rgba(0, 0, 0, 0.3)`

## 3) Typography
- Use a geometric/rounded sans-serif feel.
- Main family should be highly legible and modern.
- Headings are compact with slightly reduced letter spacing.
- Body text should be comfortable at small sizes.
- Labels/eyebrows are compact, muted, and small.

### Suggested font behavior
- Headings: 600–700 weight
- Body: 400–500 weight
- Labels: 500–600 weight
- Keep line-height around 1.5–1.7 for body text

### Hierarchy
- H1: page title.
- H2: section title.
- H3: card title.
- Eyebrow: tiny section label above major headings.
- Muted helper text: use for descriptions and supporting details.

## 4) Layout and spacing
- Use a mobile-first layout.
- Pages should have generous but not excessive padding.
- Main content area should remain centered on large screens.
- The bookshelf should become a two-column layout with a sticky sidebar on wider screens.
- Cards and sections should be separated by consistent gaps.

### Spacing feel
- Tight vertical rhythm inside cards.
- Medium spacing between blocks.
- Larger separation between major sections.

## 5) Buttons

### Primary button
- Gradient background: `#00c9a7 → #ff9e2c`
- Text color: `#05060d`
- Slight hover lift
- Strong but soft shadow
- Used for high-priority actions such as save, add, upload, and confirm

### Ghost button
- Panel background or transparent look
- Border visible
- Used for secondary or contextual actions

### Secondary button
- Similar to ghost, but with slightly stronger default emphasis

### Icon button
- Small, minimal border
- Used for remove/delete icons and compact actions

### Sizing
- Minimum touch target around 44px.
- Rounded corners around 10px.
- Comfortable padding for mobile taps.

## 6) Cards and surfaces
- Cards use translucent panels with blur.
- Borders should remain subtle.
- Shadows should be soft, not heavy.
- Card content should be readable and neatly grouped.

### Card patterns
- Book cards: cover left, details right on desktop.
- Stat cards: compact, evenly spaced.
- Tool cards: more vertical room for controls and result lists.
- Source cards: smaller grid items with link or management actions.

- Pills are a major UI language in the app.
- Use pills for:
  - status
  - score labels
  - genres
  - languages
  - shelves
  - small toggles
- Pills should be rounded, compact, and easy to tap.
- Active pills should be filled.
- Inactive pills should be ghost-style.

### Pill styling feel
- Border radius: 999px-like appearance in practice
- Tight horizontal padding
- Strong contrast against panel surfaces

## 8) Forms
- Labels sit above controls.
- Inputs are full width and dark-themed.
- Use clear placeholders but do not rely on them as labels.
- Forms should be stacked with consistent spacing.
- Textareas, inputs, and selects should feel uniform.

### Form rules
- Keep controls large enough for mobile.
- Avoid dense multi-column forms on small screens.
- Use grid-2 only when there is enough width.

## 9) Navigation
- Sticky top nav with blur effect.
- Brand block on the left.
- Main route links centered/left.
- Auth actions on the right.
- On mobile, nav can hide while scrolling down and reappear while scrolling up.

## 10) Sidebar
- Sticky on desktop, normal flow on mobile.
- Collapsible groups for status shelves and custom shelves.
- Shelf counts aligned to the right.
- Delete action should be subtle until hover on desktop.

## 11) Book cover treatment
- Covers should lazy-load.
- If missing or broken, show a gradient fallback with deterministic hue.
- Keep the card layout stable while loading.
- Image ratio should feel consistent across cards and detail pages.

## 12) Responsive behavior
- Mobile first.
- One-column layouts by default.
- Two-column or multi-column only on medium+ screens.
- Keep all primary actions visible without clutter.

## 13) Motion and accessibility
- Use small motion only: hover, expand, scroll restoration.
- Respect reduced-motion preferences.
- Keep focus outlines visible.
- Make important controls keyboard accessible.

## 14) Component style cues
- Dashboard: overview-first, stat-heavy, tool-heavy.
- Bookshelf: dense, sortable, filterable, utility-driven.
- Add/Edit: form-centered with preview sections.
- BookDetails: hero layout with metadata cards and relationship sections.

## 15) What to copy if recreating the look
- Dark multi-gradient background.
- Glassy panels with blur.
- Teal/orange gradient primary buttons.
- Rounded card and pill language.
- Muted helper text and crisp hierarchy.
- Sticky shell and sidebar patterns.
- Compact, power-user-friendly data density.
