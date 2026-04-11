# ISSUE-023 — React Parity Final Pass (UI Geometry, Image Rendering, Overflow, Colors, and Copy)

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§5 component rules, §10 styling)
- `../../FRONTEND_BLUEPRINT.md` (all UI behavior/copy sections)
- `ISSUE-022-design-system-and-styling.md`

## Slice Metadata
- Type: HITL
- Blocked by: ISSUE-022
- User stories covered:
  - As a user, the Angular app should look and read exactly like the legacy React app.
  - As a user, card geometry, cover images, spacing, and colors should match across breakpoints.
  - As a user, no form/input overflow should occur in common mobile and desktop widths.

---

## Problem statement

Current Angular implementation is functionally strong but not visually/copy identical to React. Reported parity gaps include:

1. Card sizes/layout differ (grid density, card dimensions, spacing hierarchy).
2. Cover images missing or rendered inconsistently vs React.
3. Input controls overflow containers in some layouts.
4. Colors/theme differ from legacy tokens and gradients.
5. Text/copy differs in labels, headings, CTA wording, helper/error text.
6. Dashboard genre/status breakdown lacks React-equivalent visual treatment (color indicators/diagram-like cues).

Goal: **React parity must be exact** (except framework internals). Angular should be a drop-in UI/UX replacement of React.

---

## Scope

Perform a page-by-page and component-by-component parity pass against `frontend/src`:

- Dashboard
- Bookshelf
- Add Book
- Book Details
- Login
- Signup
- Shared components used in all pages

### Explicit parity rule

- If React says `X`, Angular must say `X`.
- If React renders `Y` style/geometry at a given breakpoint, Angular must render `Y`.
- No “close enough” substitutions for copy, spacing, color, border, or card/image geometry.

---

## Source of truth

React files are authoritative:

- `frontend/src/index.css`
- `frontend/src/App.css`
- `frontend/src/styles/*.css`
- `frontend/src/pages/*.jsx`
- `frontend/src/components/*.jsx`

Angular must align with:

- `angular/src/styles/**/*.scss`
- `angular/src/app/**/*.ts` templates
- `angular/src/app/**/*.scss`

---

## Required work

## Execution steps (screen-by-screen)

### Step 1 — Login screen parity
- React references:
  - `frontend/src/pages/Login.jsx`
  - `frontend/src/styles/forms.css`
  - `frontend/src/styles/buttons.css`
  - `frontend/src/styles/layout.css`
- Angular targets:
  - `angular/src/app/features/auth/login/login-page.component.ts`
  - `angular/src/app/features/auth/login/login-page.component.scss`
- Step checklist:
  - [ ] Heading/subheading copy matches React exactly.
  - [ ] Field labels/placeholders match React exactly.
  - [ ] Auth card width, padding, border radius, and shadow match React.
  - [ ] Submit button size, style, and disabled/loading text match React.
  - [ ] Error/success text wording and color match React.
  - [ ] No overflow at 375px width.

### Step 2 — Signup screen parity
- React references:
  - `frontend/src/pages/Signup.jsx`
  - `frontend/src/styles/forms.css`
  - `frontend/src/styles/buttons.css`
- Angular targets:
  - `angular/src/app/features/auth/signup/signup-page.component.ts`
  - `angular/src/app/features/auth/signup/signup-page.component.scss`
- Step checklist:
  - [ ] Title, subtitle, and helper copy match React exactly.
  - [ ] Password/confirm-password labels and placeholders match React.
  - [ ] CTA and back-link text/case/punctuation match React.
  - [ ] Validation and mismatch-password messages match React wording.
  - [ ] Card/spacing/button geometry matches login/react parity.
  - [ ] No overflow at mobile/tablet breakpoints.

### Step 3 — Dashboard screen parity
- React references:
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/styles/layout.css`
  - `frontend/src/styles/cards.css`
  - `frontend/src/styles/utilities.css`
- Angular targets:
  - `angular/src/app/features/dashboard/dashboard-page.component.ts`
  - `angular/src/styles/_layout.scss`
- Step checklist:
  - [ ] Stat card count/order matches React.
  - [ ] Stat card dimensions, typography, and spacing match React.
  - [ ] Genre breakdown includes React-equivalent color indicators/diagram cues.
  - [ ] Status breakdown includes React-equivalent color indicators/diagram cues.
  - [ ] Source breakdown visual hierarchy and top-five/expand treatment match React.
  - [ ] Section headings and tool button copy match React.
  - [ ] Dashboard remains readable and non-overflowing at 375/768/1440 widths.

### Step 4 — Bookshelf screen parity
- React references:
  - `frontend/src/pages/Bookshelf.jsx`
  - `frontend/src/styles/layout.css`
  - `frontend/src/styles/sidebar.css`
  - `frontend/src/styles/filters.css`
- Angular targets:
  - `angular/src/app/features/bookshelf/bookshelf-page.component.ts`
  - `angular/src/styles/_layout.scss`
- Step checklist:
  - [x] Sidebar width/sticky behavior/button rows match React.
  - [x] Shelf item active/hover states match React.
  - [x] Filter controls (search/sort/language/genre/chapter) spacing and wrapping match React.
  - [x] Genre any/all and chapter min/max toggles visually match React pills.
  - [x] Pagination card/layout/button sizing matches React.
  - [x] Book grid density and breakpoints match React.
  - [x] No input/button overflow in filter rows on mobile.

### Step 5 — Add Book screen parity
- React references:
  - `frontend/src/pages/AddBook.jsx`
  - `frontend/src/styles/forms.css`
  - `frontend/src/styles/cards.css`
- Angular targets:
  - `angular/src/app/features/add-book/add-book-page.component.ts`
  - `angular/src/app/features/add-book/add-book-page.component.scss`
  - related shared components used on page
- Step checklist:
  - [x] Page heading/copy and CTA text match React.
  - [x] Form card sections and vertical rhythm match React.
  - [x] Metadata preview block visual hierarchy matches React.
  - [x] Source manager list/input/add-button geometry matches React.
  - [x] Shelf selector and related-book linker spacing matches React.
  - [x] Cover preview is visible and sized like React.
  - [x] No overflow in any form section at 375px width.

### Step 6 — Book Details screen parity
- React references:
  - `frontend/src/pages/BookDetails.jsx`
  - `frontend/src/styles/cards.css`
  - `frontend/src/styles/images.css`
- Angular targets:
  - `angular/src/app/features/book-details/book-details-page.component.ts`
  - `angular/src/app/features/book-details/book-details-page.component.scss`
- Step checklist:
  - [ ] Read-mode header/actions match React layout and copy.
  - [ ] Edit-mode form shell, spacing, and button grouping match React.
  - [ ] Details metadata labels and empty-state text match React exactly.
  - [ ] Sources/shelves/related sections match React structure and spacing.
  - [ ] Cover/hero image sizing and fallback behavior match React.
  - [ ] No overflow in edit controls or section lists across breakpoints.

### Step 7 — Shared component parity
- React references:
  - `frontend/src/components/*.jsx`
  - `frontend/src/styles/cards.css`
  - `frontend/src/styles/pills.css`
  - `frontend/src/styles/images.css`
- Angular targets:
  - `angular/src/app/shared/components/**`
- Step checklist:
  - [x] `BookCard` card-head/footer geometry, pills, and dropdown visuals match React.
  - [x] `BookGrid` min column width, gap, and breakpoint behavior match React.
  - [x] `CoverImage` default size and fallback rendering match React in each context.
  - [x] `BookFormFields` label/field spacing and control styling match React.
  - [x] `SourceManager` row/list/remove controls match React.
  - [x] `ShelfSelector` checkbox/list and fallback-id entry mode match React.
  - [x] `BookSearchLinker` suggestions/list chip remove visuals match React.

---

## Verification protocol (must complete)

### A. Visual parity checklist

For each page and breakpoint (`375x812`, `768x1024`, `1440x900`):

- [ ] Layout structure matches React
- [ ] Card geometry matches React
- [ ] Cover images render like React
- [ ] No horizontal overflow
- [ ] Colors and contrast match React
- [ ] Text/copy exactly matches React

### B. Functional safety

- [x] Existing Angular tests pass
- [x] No regressions in auth, filters, metadata fetch, details edit/read, dashboard tools

### C. Optional but recommended

- Add deterministic screenshot parity checks (Playwright or equivalent) for key pages in both apps.

---

## Acceptance criteria

- [ ] Angular UI is visually equivalent to React on Dashboard, Bookshelf, Add Book, Book Details, Login, Signup.
- [ ] Dashboard genre/status/source breakdown includes React-equivalent color/diagram visual cues.
- [ ] Card sizes and responsive behavior match React at mobile/tablet/desktop breakpoints.
- [ ] Cover images render in all contexts where React renders them.
- [ ] No input/control overflow in supported breakpoints.
- [ ] Color palette and component theming match React tokens/usage.
- [ ] Text/copy is identical to React across all visible UI strings.
- [ ] Full Angular regression suite remains green.

---

## Implementation notes

- Keep Angular architecture boundaries intact (`core`/`shared`/`features`/`models`).
- Prefer SCSS fixes and template class alignment over logic changes.
- Avoid introducing new features, interactions, or text not present in React.
- If a React style depends on class composition, mirror that composition in Angular templates.

---

## Deliverables

1. Updated Angular styles/templates for parity.
2. A short parity report listing resolved differences by page/component.
3. Confirmation of test pass.
