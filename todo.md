## Todo List & Roadmap

### Phase 1: Project Initialization ✅

* [x] Initialize the Vite project using the React template.
* [x] Install necessary dependencies (`react-router-dom`, `@supabase/supabase-js`).
* [x] Set up the GitHub repository.
* [x] Configure `vite.config.js` for GitHub Pages deployment (set `base` path).
* [x] Create a GitHub Action or script to automate deployment to GitHub Pages.

### Phase 2: Supabase Configuration ✅

* [x] Create a new Supabase project.
* [x] **Authentication:** Email/Password login configured in Supabase dashboard.
* [x] **Database Schema:** All tables created and configured:
  * `profiles`: Stores user preferences.
  * `books`: Stores title, cover_url, description, status, genres, original_language, last_read, latest_chapter, notes, and timestamps.
  * `book_links`: Stores multiple source URLs with site_name and URL.
  * `shelves`: Stores custom shelf names and user ownership.
  * `shelf_books`: Junction table for many-to-many book-shelf relationships.
* [x] **RLS Policies:** Row Level Security enabled on all tables for user data isolation.
* [x] **Edge Functions:** `fetch-metadata` Deno function written and ready for deployment.

### Phase 3: Core UI & Authentication ✅

* [x] **Routing:** React Router set up for all pages (Dashboard, Bookshelf, BookDetails, AddBook, Login, Signup).
* [x] **Auth Forms:** Login and Sign-up components connected to Supabase Auth.
* [x] **Protected Routes:** ProtectedRoute guards private pages using Supabase session.
* [x] **Navigation:** Persistent navigation bar with auth state and links.

### Phase 4: The "Smart Add" Feature ✅

* [x] **Edge Function Logic:** Deno code parses Open Graph tags, genres, original_language, and latest_chapter from any URL.
* [x] **Add Book Interface:** Form with URL input, manual fallback fields, and book creation.
* [x] **Integration:** Frontend calls Edge Function via `supabase.functions.invoke`; metadata populates form fields.
* [x] **Book Creation:** New books saved to Supabase with all metadata and initial source link.

### Phase 5: Dashboard & Tracking ✅

* [x] **Library Grid:** Display books as cards with cover, title, status, last_read, latest_chapter, original_language.
* [x] **Bookshelf Page:** Advanced filtering by status shelves and custom shelves; search and sort (by updated_at, title, progress).
* [x] **Multi-Shelf Support:** Books belong to multiple custom shelves simultaneously via `shelf_books` junction table.
* [x] **Shelf Management:** Create, delete, and toggle book membership in custom shelves from the UI.
* [x] **Status Management:** Move books between "Reading", "Plan to Read", "Completed", "Dropped", "On Hold" statuses.
* [x] **Details Page:** Full book view with edit mode for title, description, status, last_read, latest_chapter, notes, original_language, and genres.
* [x] **Link Management:** Add or delete source links (`book_links`) for each book.
* [x] **Timestamp Display:** Show updated_at, last_fetched_at, and last_uploaded_at on book detail page.

### Phase 6: Refinement ✅

* [x] **Error Handling:** Graceful error messages for failed metadata fetches and Supabase operations.
* [x] **Image Fallbacks:** Add default placeholder image for books without covers.
* [x] **Responsiveness:** Layout works on all screen sizes with mobile-first breakpoints.
* [x] **Mobile-First Design:** Touch-friendly controls (44px min-height), vertical layouts, and optimized typography.

---

## Next Steps

### Immediate Priority (Deploy)
1. **Enable Supabase Auth:**
   - Log into Supabase dashboard → Authentication → Providers
   - Ensure Email/Password is enabled
   - Test sign-up and login flows

2. **Deploy Edge Function:**
   ```bash
   cd supabase
   supabase functions deploy fetch-metadata
   ```
   - Verifies Deno syntax and deploys to your project
   - Test via AddBook form with a manga/book URL

3. **Deploy to GitHub Pages:**
   - Push all changes to `main` branch
   - GitHub Actions workflow builds frontend and publishes to gh-pages
   - Verify live site at `https://<username>.github.io/a-bookshelf/`

4. **Test End-to-End:**
   - Sign up with test account
   - Add a book via Smart Add (paste manga/book URL)
   - Verify metadata fetch and Supabase record creation
   - Test shelf creation, filtering, and book editing
   - Check mobile responsiveness on phone

### Future Enhancements
- Add image upload functionality for custom covers
- Implement bulk actions (mark multiple books completed)
- Add advanced search and filtering by genre, language
- Add reading statistics (books read this year, avg rating)
- Add social sharing (favorite books, reading lists)
- Add notifications for new chapters
- Optimize Edge Function for more sites (AniList, Goodreads, etc.)
- Add dark mode toggle
- Implement offline mode with service workers