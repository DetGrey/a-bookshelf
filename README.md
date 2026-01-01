# A Bookshelf

A personal library management application built with React and Vite. This application allows users to track their reading list, save progress, and organize links to various book and manga sources.

## Features

**Smart Link Integration**
Paste a URL from a supported site to automatically fetch the title, cover image, and description using Supabase Edge Functions.

**Reading Status & Shelves**
Categorize items into Reading, Plan to Read, Waiting, Completed, Dropped, and custom shelves.

**Progress Tracking**
Track latest chapter, last uploaded timestamp, and personal notes per entry.

**Multi-Source Management**
Save multiple URLs for a single book entry (e.g., Official source, Scanlation A, Scanlation B) to easily switch between sources.

**Filtering and Sorting**
Organize the library by status, genre, alphabetical order, or date updated.

**Update Checks for Waiting Shelf**
Batch-check all waiting books against the `fetch-latest` function; unchanged or empty responses are skipped, and errors can be expanded in a collapsible panel.

## Tech Stack

* **Frontend:** React (Vite)
* **Hosting:** GitHub Pages
* **Database & Auth:** Supabase
* **Backend Logic:** Supabase Edge Functions (`fetch-metadata`, `fetch-latest`)
* **Styling:** CSS

---

## Deployment Instructions

To deploy this project to GitHub Pages:

1. Update `vite.config.js` with the base URL of your repository:
```javascript
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [react()],
})

```


2. Build the project:
`npm run build`
3. Deploy the `dist` folder to the `gh-pages` branch.
