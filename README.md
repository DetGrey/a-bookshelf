# A Bookshelf

A personal library management application built with React and Vite. This application allows users to track their reading list, save progress, and organize links to various book and manga sources.

## Features

**Smart Link Integration**
Paste a URL from a supported site to automatically fetch the title, cover image, and description.

**Reading Status**
Categorize items into lists: Reading, Plan to Read, Completed, and Dropped.

**Progress Tracking**
Save the last chapter read and maintain personal notes for each entry.

**Multi-Source Management**
Save multiple URLs for a single book entry (e.g., Official source, Scanlation A, Scanlation B) to easily switch between sources.

**Filtering and Sorting**
Organize the library by status, alphabetical order, or date updated.

## Tech Stack

* **Frontend:** React (Vite)
* **Hosting:** GitHub Pages
* **Database & Auth:** Supabase (Free Tier)
* **Backend Logic:** Supabase Edge Functions (Used for scraping metadata from links)
* **Styling:** CSS Modules or TailwindCSS

---

## Todo List & Roadmap

### Phase 1: Project Initialization

* [ ] Initialize the Vite project using the React template.
* [ ] Install necessary dependencies (`react-router-dom`, `@supabase/supabase-js`).
* [ ] Set up the GitHub repository.
* [ ] Configure `vite.config.js` for GitHub Pages deployment (set `base` path).
* [ ] Create a GitHub Action or script to automate deployment to GitHub Pages.

### Phase 2: Supabase Configuration

* [ ] Create a new Supabase project.
* [ ] **Authentication:** Enable Email/Password login in the Supabase dashboard.
* [ ] **Database Schema:** Create the following tables:
* `profiles`: Stores user preferences.
* `books`: Stores title, cover image, description, status, current chapter, and notes.
* `links`: Stores multiple source URLs associated with a specific book.


* [ ] **Edge Functions:** Set up a Supabase Edge Function named `fetch-metadata`. This function will take a URL, fetch the HTML, and return Open Graph tags (image, title).

### Phase 3: Core UI & Authentication

* [ ] **Routing:** Set up React Router for navigation (Login, Dashboard, Book Details).
* [ ] **Auth Forms:** Create Login and Sign-up components connected to Supabase Auth.
* [ ] **Protected Routes:** Ensure only logged-in users can access the dashboard.
* [ ] **Navigation:** Create a persistent navigation bar.

### Phase 4: The "Smart Add" Feature

* [ ] **Edge Function Logic:** Write the Deno code for the `fetch-metadata` function to parse HTML meta tags.
* [ ] **Add Book Interface:** Create a modal or page with a "Paste URL" input.
* [ ] **Integration:** Connect the frontend to the Edge Function. When a user pastes a link, the app should call the function and populate the form fields with the result.

### Phase 5: Dashboard & Tracking

* [ ] **Library Grid:** Display books as cards showing the cover image and progress.
* [ ] **Status Management:** Implement logic to move books between "Reading", "Completed", etc.
* [ ] **Details Page:** Create a view for individual books that allows editing notes and updating the "Last Chapter Read".
* [ ] **Link Management:** Allow users to add or delete extra source links for a book.

### Phase 6: Refinement

* [ ] **Error Handling:** Add graceful error messages if metadata fetching fails.
* [ ] **Image Fallbacks:** Add a default placeholder image for books without covers.
* [ ] **Responsiveness:** Ensure the layout works on mobile devices.

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

# NOTES

Since you are deploying to **GitHub Pages** (which is static hosting only) but still need to scrape websites for images and text, the best architectural choice is to lean heavily on **Supabase**.

GitHub Pages cannot run the server-side code needed to scrape websites (due to CORS security). However, since you are already using Supabase for the database, you can use **Supabase Edge Functions** to handle the scraping. This keeps everything free and works perfectly with GitHub Pages.