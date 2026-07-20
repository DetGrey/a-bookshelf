# Design System & Style Guide

Welcome to the **A Bookshelf** design system and style guide. This document provides reference documentation for colors, typography, layout, components, and interactive micro-animations used across the codebase. 

The workspace contains two implementations with related but distinct designs:
1. **Production Angular App (Active)**: A flat, dark slate design system prioritizing high-contrast legibility, warm tones, and soft indigo brand accents.
2. **Legacy React Frontend (Vite)**: A glassmorphic design system using glowing radial backgrounds, neon teal/orange accents, and semi-transparent card overlays.

---

## 🎨 Color Palettes & Themes

### 1. Production Angular App Theme (Active)
The production system is built on a dark slate foundation (`#1a1a1a`) combined with soft indigo accents and warm bone-white body text.

| Color Name | Custom CSS Property | Hex Value | RGB / HSL Values | Semantic Usage & Context |
| :--- | :--- | :--- | :--- | :--- |
| **Document Background** | `--bg` | `#1a1a1a` | `rgb(26, 26, 26)` / `hsl(0, 0%, 10%)` | Main document canvas backdrop. |
| **Panel Background** | `--panel` | `#242424` | `rgb(36, 36, 36)` / `hsl(0, 0%, 14%)` | Cards, sidebar, and container backdrops. |
| **Panel Strong** | `--panel-strong`| `#2d2d2d` | `rgb(45, 45, 45)` / `hsl(0, 0%, 18%)` | Nested items, form backgrounds, active controls. |
| **Border** | `--border` | `#323232` | `rgb(50, 50, 50)` / `hsl(0, 0%, 20%)` | Grid lines, inputs, container separation. |
| **Base Text** | `--text` | `#ece7dc` | `rgb(236, 231, 220)` / `hsl(41, 27%, 89%)`| High-contrast, warm bone-white body copy. |
| **Muted Text** | `--text-muted` | `#7a7a7a` | `rgb(122, 122, 122)` / `hsl(0, 0%, 48%)`| Secondary metadata, counts, descriptions. |
| **Primary Accent** | `--accent` | `#6c63ff` | `rgb(108, 99, 255)` / `hsl(243, 100%, 69%)`| Brand color, active links, focus rings, eyebrows. |
| **Secondary Accent** | `--accent-2` | `#8f89ff` | `rgb(143, 137, 255)` / `hsl(243, 100%, 77%)`| Lighter indigo for highlights and soft gradients. |
| **Nav Background** | `--nav-bg` | `rgba(26, 26, 26, 0.95)` | `rgba(26, 26, 26, 0.95)` | Sticky header backdrop (supports 95% opacity). |
| **Error Status** | `--error` | `#cf6679` | `rgb(207, 102, 121)` / `hsl(349, 53%, 61%)`| Negative feedback, alert text, invalid states. |
| **Success Status** | `--success` | `#9ccc65` | `rgb(156, 204, 101)` / `hsl(88, 50%, 60%)`| Positive feedback, progress bars, shelf matches. |

### 2. Legacy React Frontend Theme
The legacy frontend utilizes neon gradients, translucent panels, and deep space backdrops.

| Color Name | Custom CSS Property | Hex / RGBA Value | Semantic Usage & Context |
| :--- | :--- | :--- | :--- |
| **Base Background** | `--bg` | `#06070f` | Main page canvas backdrop fallback. |
| **Background Gradient** | `--background-gradient`| `radial-gradient(...)` + `linear-gradient(...)` | Layered radial blobs of primary accents over a `#05060d` to `#07091a` gradient. |
| **Glass Panel** | `--panel` | `rgba(255, 255, 255, 0.04)` | Semi-transparent card and container backdrops. |
| **Glass Panel Strong** | `--panel-strong` | `rgba(255, 255, 255, 0.07)` | Hover highlights and nested container backgrounds. |
| **Glass Border** | `--border` | `rgba(255, 255, 255, 0.1)` | Subtle dividers and focus indicators. |
| **Primary Text** | `--text-primary` | `#e8ecf3` | High-contrast cool white typography. |
| **Muted Text** | `--text-muted` | `#a8b2c1` | Slate blue/gray typography. |
| **Primary Accent** | `--accent` | `#00c9a7` | Neon mint/teal brand color. |
| **Secondary Accent** | `--accent-2` | `#ff9e2c` | Neon orange highlights and gradient end-stops. |
| **Error Color** | `.error` | `#ff7b7b` | Bright red alert indicators. |
| **Success Color** | `.success` | `#4ade80` | Bright green positive feedback. |

---

## 🔤 Typography & Fonts

### Font Families
*   **Primary / Body Font**: `'Space Grotesk'`
    *   Loaded via Google Fonts (`wght@400;500;600;700`).
    *   Slightly geometric, monolinear sans-serif that lends a clean, tech-forward vibe.
    *   *System Fallback*: `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
*   **Secondary / Display / Monospace**: `'Sora'`
    *   Loaded via Google Fonts (`wght@400;600`).
    *   *Usage*: Declared as `--font-mono` in the Angular theme, providing distinct visual structure.
*   **Emoji Glyphs override**: `'NotoColorEmojiLimited'`
    *   *Glyph Range*: `U+1F1E6 - U+1F1FF` (Regional Indicator Symbols, i.e., country flags).
    *   *Source*: Loaded dynamically via `@font-face` from Google Fonts web server to ensure consistent flag displays on Windows platforms.
    *   *Fallback Stack*: `'NotoColorEmojiLimited', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI', sans-serif`.

### Typographic Hierarchy & Heading Styles

#### 1. Production Angular App
*   **Base Line Height**: `1.6` for paragraph text; `1.2` for headings.
*   **Document Headings (`h1`, `h2`, `h3`)**:
    *   Global rule: `font-weight: 600`, `line-height: 1.2`.
*   **Specific Heading Contexts**:
    *   **Page Title** (`.page-head h1`):
        *   *Desktop (width >= 768px)*: Default size (~`2rem`).
        *   *Mobile (width < 768px)*: `1.6rem` (`25.6px`) to optimize screen real estate.
    *   **Section Headers / Columns** (`.tools-column-title`): `1.15rem` (`18.4px`).
    *   **Subheadings & Cards** (`.quality-check-header h2`): `1.1rem` (`17.6px`), color: `var(--accent)`.
    *   **Card Subtitles** (`.quality-check-header h3`): `1rem` (`16px`), color: `var(--text)`.
    *   **Eyebrows** (`.eyebrow`): `0.75rem` (`12px`), `text-transform: uppercase`, `letter-spacing: 0.08em`, color: `var(--accent)`.
    *   **Large Stats** (`.stat strong`):
        *   *Desktop (width >= 1024px)*: `1.5rem` (`24px`).
        *   *Mobile/Tablet (width < 1024px)*: Responsive clamp `clamp(1.2rem, 2.4vw, 1.8rem)`.
        *   *Line Height*: `1.1`.
    *   **Muted Text / Details** (`.muted`, `span` descriptions): `0.85rem` to `0.9rem`.

#### 2. Legacy React Frontend
*   **Base Font Size**: `16px` default, `line-height: 1.6`, `font-weight: 400`.
*   **Headings (`h1` through `h5`)**:
    *   Global rule: `margin: 0`, `letter-spacing: -0.02em`, `font-weight: 600`.
*   **Sizes by Breakpoint**:
    *   **H1 (Page Title)**:
        *   *Desktop (width >= 768px)*: `2.5rem` (`40px`).
        *   *Mobile (width < 768px)*: `1.75rem` (`28px`).
    *   **H2 (Section Header)**:
        *   *Desktop (width >= 768px)*: `1.75rem` (`28px`).
        *   *Mobile (width < 768px)*: `1.35rem` (`21.6px`).
    *   **H3 (Card Title)**:
        *   `1.1rem` (`17.6px`) globally.
    *   **Eyebrows** (`.eyebrow`): `0.7rem` (`11.2px`), `text-transform: uppercase`, `letter-spacing: 0.08em`, color: `var(--accent)`, `margin-bottom: 4px`.
    *   **Muted Texts** (`.muted`): `0.9rem` (`14.4px`), color: `var(--text-muted)`.

---

## 📐 Layout, Spacing & Breakpoints

### Spacing Scale
The production Angular application defines structural variables based on an `8px` baseline grid system:
*   `--space-1`: `4px` (micro adjustments, label gutters)
*   `--space-2`: `8px` (form elements, small gaps)
*   `--space-3`: `12px` (inline controls spacing)
*   `--space-4`: `16px` (default padding, inner cards, stacks)
*   `--space-6`: `24px` (page layouts, grid sections)
*   `--space-8`: `32px` (large outer margins)

### Structural Grid Utilities
*   **Flex Stacks** (`.stack`): Vertically stacks child items with a `var(--space-4)` gap.
*   **Grids** (`.grid-2`):
    *   *Angular*: Two-column layout `grid-template-columns: 1fr 1fr` with a `var(--space-4)` gap.
    *   *React*: Responsive auto-fit layout `repeat(auto-fit, minmax(240px, 1fr))` on desktop; stacks to a single column on mobile.

### Media Query Breakpoints
The layout system responds dynamically to three key width thresholds:
1.  **Mobile Breakdown (`max-width: 767px`)**:
    *   Hides sidebar desktop layouts and wraps bookshelves.
    *   Forces navigation to flow vertically in a flex list.
    *   Scales down margins, padding, and page titles (`1.6rem`).
2.  **Desktop/Tablet Breakpoint (`min-width: 768px`)**:
    *   Nav switches to horizontal `flex-direction: row` layout.
    *   Page wrapper aligns to center (`margin: 0 auto`) with a `max-width: 1200px` (or `820px` for `.page.narrow`).
    *   Shelves grid updates to a 2-column sidebar grid (`260px` sidebar + `1fr` main shelf content).
3.  **Large Desktop (`min-width: 1024px` / `1200px`)**:
    *   Stat counters anchor to a fixed size (`1.5rem`).
    *   Card grids expand using `repeat(auto-fill, minmax(320px, 1fr))`.

---

## 🧱 Component Specifications

### 1. Buttons
*   **Production Angular Buttons**:
    *   **Primary Action**: Flat background `var(--accent)` (`#6c63ff`), text color `#fff`, border radius `6px` (`--radius-sm`), padding `8px 16px`. Hover state applies `opacity: 0.9` reduction.
    *   **Ghost Action**: Background `transparent`, border `1px solid var(--border)` (`#323232`), text color `var(--text)`. On hover, the border changes to `var(--accent)` (`#6c63ff`).
    *   **Disabled**: All buttons get `opacity: 0.5` and `cursor: not-allowed`.
*   **Legacy React Buttons**:
    *   Height anchored at a touch-friendly `min-height: 44px`.
    *   **Primary Gradient Action**: Rounded `10px` corners, styled with a linear gradient from `--accent` (teal) to `--accent-2` (orange). Displays a bright mint-green shadow: `box-shadow: 0 8px 20px rgba(0, 201, 167, 0.25)`.
    *   **Secondary Action**: Background `var(--panel)`, border `1px solid var(--border)`. Hover shifts background to `var(--panel-strong)`.
    *   **Icon Action** (`.btn-icon`): Bordered icon frame, radius `6px`, default opacity `0.6`. Hover shifts color to light red `#ff7b7b` and adds background `rgba(255, 123, 123, 0.1)`.

### 2. Cards
*   **Production Angular Card**:
    *   Flat background `var(--panel)` (`#242424`), bordered by `1px solid var(--border)` (`#323232`), curved at `12px` (`--radius`), padded with `16px` (`--space-4`), and soft dark shadows: `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3)`.
*   **Legacy React Card**:
    *   Semi-transparent background `rgba(255, 255, 255, 0.04)`. Padded at `14px`, containing a `backdrop-filter: blur(8px)` glassmorphism effect.

### 3. Pills & Badges
*   **Production Angular Pills**:
    *   `border-radius: 999px`, font-size: `0.8rem`. Solid accent background `var(--accent)` with white text.
    *   **Ghost Pill**: Transparent background, border `1px solid var(--border)`, text color `var(--text-muted)`.
*   **Legacy React Pills**:
    *   Background `rgba(255, 255, 255, 0.06)`, border `rgba(255, 255, 255, 0.1)`.
    *   **Ghost variant**: Green accent text (`var(--accent)`), translucent green border: `border-color: rgba(0, 201, 167, 0.3)`.

### 4. Form Fields & Inputs
*   **Angular Input Layout**:
    *   Stacked label layout. Input boxes use the darkest backdrop (`var(--bg)`: `#1a1a1a`) bounded by thin borders (`--border`). Curved at `6px` (`--radius-sm`).
    *   **Focus State**: Bypasses browser outlines to show a clean purple border: `border-color: var(--accent)`.
*   **Legacy React Input Layout**:
    *   Input boxes use background `var(--panel-strong)` (`rgba(255, 255, 255, 0.07)`), padded at `14px` with a `10px` border radius. Font size matches `16px` to prevent automatic zooming on iOS mobile browsers.
    *   **Focus State**: Applies a soft neon-teal outline: `outline: 2px solid rgba(0, 201, 167, 0.4)`.

---

## 🖼️ Cover Images & Dynamic Placeholders

The application loads book cover images lazily using `IntersectionObserver` (with a load margin offset of `120px` to trigger early loading). 

### Dynamic Hue-Hashed Placeholders
If a book lacks a cover image url, or the image fails to load (times out after 3 seconds), the system dynamically renders a procedural fallback canvas gradient:
1.  **Hue Hash Calculation**: The application takes the alphanumeric title of the book, calculates a numeric hash value based on character unicode values, and performs a modulo operation of 360:
    ```typescript
    private hashHue(text: string): number {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0; // force 32bit integer
      }
      return Math.abs(hash) % 360;
    }
    ```
2.  **Gradient Formula**: The generated hue (`H`) is plugged into HSL parameters to draw a smooth, high-contrast 135-degree linear gradient. The second stop offsets the hue by 30 degrees and increases saturation slightly:
    $$\text{Stop 1: } \text{hsl}(H, 60\%, 35\%)$$
    $$\text{Stop 2: } \text{hsl}((H + 30) \bmod 360, 60\%, 45\%)$$
3.  **Result**: Every book gets a unique, visually harmonious, colorful placeholder card with a readable title overlay (`color: rgba(255, 255, 255, 0.85)`).

---

## ⚡ Interactions, Accessibility & Print

### Micro-animations
*   **Press Interactions**: Buttons, active links, and selectable shelf items scale down slightly when clicked to mimic tactile physical feedback:
    ```css
    .button:active, .shelf-item:active {
      transform: scale(0.98);
    }
    ```
*   **Active Hover Lift**: Legacy primary buttons lift vertically by `1px` on hover:
    ```css
    .primary:hover {
      transform: translateY(-1px);
    }
    ```
*   **Interactive Sidebar Trashing**: To prevent visual clutter on desktop screens, shelf delete buttons (`.shelf-delete`) have a default opacity of `0` (`opacity: 0.7` on mobile). When the mouse hovers over a shelf container item, the delete button fades in (`opacity: 1`) smoothly on desktop:
    ```css
    .shelf-item-wrapper:hover .shelf-delete {
      opacity: 1;
    }
    ```

### Accessibility Utilities
*   **Keyboard Navigation**: Interactive elements focused using keyboard tabs render glowing outlines with offsets to stand out:
    ```css
    *:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    ```
*   **Reduced Motion**: Respects system preferences. If the user has enabled reduced motion at the OS level, all animations and transitions are forced to run at `0.01ms`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```
*   **High Contrast Media Query**: If high contrast mode is requested, theme borders and panels are forced to higher opacities to ensure legibility:
    ```css
    @media (prefers-contrast: more) {
      :root {
        --border: rgba(255, 255, 255, 0.2);
        --panel: rgba(255, 255, 255, 0.06);
        --panel-strong: rgba(255, 255, 255, 0.12);
      }
    }
    ```

### Print Layout Styles
If the page is printed, layout structural wrappers, sidebars, and navigation headers are hidden automatically:
```css
@media print {
  .nav,
  .shelf-sidebar {
    display: none;
  }
}
```
