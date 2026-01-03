import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'
import { useBooks } from '../context/BooksProvider.jsx'
import { toggleBookShelf, createShelf, deleteShelf, getShelves, STATUS } from '../lib/db.js'
import { supabase } from '../lib/supabaseClient.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import BookCard from '../components/BookCard.jsx'
import ShelfSidebar from '../components/ShelfSidebar.jsx'
import BookGrid from '../components/BookGrid.jsx'
import GenreFilter from '../components/GenreFilter.jsx'
import ChapterCountFilter from '../components/ChapterCountFilter.jsx'

// Built-in status-based shelves
const statusShelves = [
  { id: 'all', name: 'All Books', isStatus: true },
  { id: 'reading', name: STATUS.reading, isStatus: true },
  { id: 'plan_to_read', name: STATUS.plan_to_read, isStatus: true },
  { id: 'waiting', name: STATUS.waiting, isStatus: true },
  { id: 'completed', name: STATUS.completed, isStatus: true },
  { id: 'dropped', name: STATUS.dropped, isStatus: true },
  { id: 'on_hold', name: STATUS.on_hold, isStatus: true },
]

const sortOptions = [
  { value: 'created', label: 'Date Added' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'status', label: 'Status' },
]

function Bookshelf() {
  const { user } = useAuth()
  const { books, loading: contextLoading, setBooks } = useBooks()
  usePageTitle('Bookshelf')
  const [customShelves, setCustomShelves] = useState([])
  const [activeShelf, setActiveShelf] = useState('all')
  const [activeGenres, setActiveGenres] = useState([])
  const [genreFilterMode, setGenreFilterMode] = useState('all')
  const [genreFilterOpen, setGenreFilterOpen] = useState(false)
  const [chapterFilter, setChapterFilter] = useState({ mode: 'max', value: null })
  const [chapterFilterOpen, setChapterFilterOpen] = useState(false)
  const [languageFilter, setLanguageFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkingWaiting, setCheckingWaiting] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState([])
  const [showErrors, setShowErrors] = useState(false)
  const [waitingProgress, setWaitingProgress] = useState({ current: 0, total: 0 })
  const [updateDetails, setUpdateDetails] = useState([])

  const subtleBoxStyle = {
    marginBottom: '12px',
    border: '1px solid var(--border-strong, var(--border))',
    borderRadius: '12px',
    padding: '12px',
    background: 'var(--panel)',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
  }

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Clear update messages when shelf or filters change
  useEffect(() => {
    setUpdateMessage('')
    setErrorDetails([])
    setShowErrors(false)
  }, [activeShelf, activeGenres, genreFilterMode, chapterFilter, languageFilter, searchQuery])

  // Read genre from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const genreParam = params.get('genre')
    if (genreParam) {
      setActiveGenres([decodeURIComponent(genreParam)])
      setGenreFilterOpen(true)
    }
  }, [])

  // Load custom shelves
  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const shelves = await getShelves(user.id)
        if (mounted) {
          setCustomShelves(shelves)
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  // Sync loading state with context
  useEffect(() => {
    setLoading(contextLoading)
  }, [contextLoading])

  // Calculate shelf counts
  const getShelfCount = (shelfId) => {
    if (shelfId === 'all') return books.length
    const statusKeys = ['reading', 'plan_to_read', 'waiting', 'completed', 'dropped', 'on_hold']
    if (statusKeys.includes(shelfId)) {
      return books.filter((b) => b.status === shelfId).length
    }
    return books.filter((b) => b.shelves?.includes(shelfId)).length
  }

  // Get all unique genres from books
  const allGenres = [...new Set(books.flatMap((b) => b.genres ?? []))].sort()
  const allLanguages = [...new Set(books.map((b) => b.language).filter(Boolean))].sort()

  // Filter and sort books
  const getFilteredBooks = () => {
    let filtered = [...books]

    // Filter by shelf
    if (activeShelf !== 'all') {
      const statusKeys = ['reading', 'plan_to_read', 'waiting', 'completed', 'dropped', 'on_hold']
      if (statusKeys.includes(activeShelf)) {
        filtered = filtered.filter((book) => book.status === activeShelf)
      } else {
        filtered = filtered.filter((book) => book.shelves?.includes(activeShelf))
      }
    }

    // Filter by genres
    if (activeGenres.length > 0) {
      if (genreFilterMode === 'all') {
        filtered = filtered.filter((book) => activeGenres.every((genre) => book.genres?.includes(genre)))
      } else {
        filtered = filtered.filter((book) => activeGenres.some((genre) => book.genres?.includes(genre)))
      }
    }

    // Filter by language
    if (languageFilter !== 'all') {
      filtered = filtered.filter((book) => (book.language ?? '') === languageFilter)
    }

    // Filter by chapter count
    if (chapterFilter.value !== null) {
      filtered = filtered.filter((book) => {
        const count = book.chapter_count
        if (count === null || count === undefined) return false
        if (chapterFilter.mode === 'max') {
          return count <= chapterFilter.value
        } else {
          return count >= chapterFilter.value
        }
      })
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.description.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'status':
        filtered.sort((a, b) =>
          (STATUS[a.status] ?? a.status).localeCompare(STATUS[b.status] ?? b.status)
        )
        break
      case 'updated':
        filtered.sort(
          (a, b) => new Date(b.last_uploaded_at ?? 0) - new Date(a.last_uploaded_at ?? 0)
        )
        break
      case 'created':
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        break
    }

    // Apply direction
    if (sortDirection === 'asc') {
      filtered.reverse()
    }

    return filtered
  }

  // Shelf management
  const handleCreateShelf = async (shelfName) => {
    if (!user) return
    const shelf = await createShelf(user.id, shelfName)
    setCustomShelves([...customShelves, shelf])
  }

  const handleDeleteShelf = async (shelfId) => {
    if (confirm(`Delete this shelf? Books will not be deleted, just removed from this list.`)) {
      await deleteShelf(shelfId)
      setCustomShelves(customShelves.filter((s) => s.id !== shelfId))
      setBooks(
        books.map((book) => ({
          ...book,
          shelves: book.shelves?.filter((s) => s !== shelfId) ?? [],
        }))
      )
      if (activeShelf === shelfId) setActiveShelf('all')
    }
  }

  const handleToggleBookShelf = async (bookId, shelfId) => {
    await toggleBookShelf(bookId, shelfId)
    setBooks(
      books.map((book) => {
        if (book.id === bookId) {
          const currentShelves = book.shelves ?? []
          const isInShelf = currentShelves.includes(shelfId)
          return {
            ...book,
            shelves: isInShelf
              ? currentShelves.filter((s) => s !== shelfId)
              : [...currentShelves, shelfId],
          }
        }
        return book
      })
    )
  }

  // Update checking
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleCheckWaitingUpdates = async () => {
    if (checkingWaiting) return
    setCheckingWaiting(true)
    setUpdateMessage('')
    setError('')
    setErrorDetails([])
    setShowErrors(false)
    setUpdateDetails([])
    setWaitingProgress({ current: 0, total: 0 })
    const normalizeCount = (val) => {
      const n = Number(val)
      if (!Number.isFinite(n) || n <= 0) return null
      return Math.round(n)
    }
    const normalizeText = (val) => {
      if (val === null || val === undefined) return ''
      return String(val).trim()
    }
    const now = new Date().toISOString()
    const batchSize = 3
    const delayMs = 1000
    try {
      const waitingBooks = books.filter((b) => b.status === 'waiting')
      if (waitingBooks.length === 0) {
        setUpdateMessage('No waiting books to check.')
        return
      }

      setWaitingProgress({ current: 0, total: waitingBooks.length })

      const updatedIds = new Set()
      const updates = []

      for (let i = 0; i < waitingBooks.length; i += batchSize) {
        const batch = waitingBooks.slice(i, i + batchSize)
            const batchResults = await Promise.all(
              batch.map(async (book) => {
            const url = book.sources?.[0]?.url
            if (!url) return { bookId: book.id, title: book.title, skipped: 'no_url' }

            const { data: payload, error: fnError } = await supabase.functions.invoke('fetch-latest', {
              body: { url },
            })

            if (fnError || !payload) return { bookId: book.id, title: book.title, error: fnError?.message || 'fetch failed' }

            const payloadLatest = normalizeText(payload.latest_chapter)
            const payloadUploaded = payload.last_uploaded_at
            const payloadCount = normalizeCount(payload.chapter_count)

            const latestHasText = payloadLatest !== ''
            const uploadHasValue = Boolean(payloadUploaded)
            const countHasValue = payloadCount !== null
            const emptyPayload = !latestHasText && !uploadHasValue && !countHasValue

            if (emptyPayload) {
              return { bookId: book.id, title: book.title, payload, skipped: 'empty_payload' }
            }

            // Compare latest chapter: normalize both strings and check if they differ
            const normalizedCurrentLatest = normalizeText(book.latest_chapter)
            const hasLatestChange = latestHasText && payloadLatest !== normalizedCurrentLatest

            // Compare upload dates: only count as change if dates are different days (ignore time of day)
            const parsedPayloadUpload = uploadHasValue ? new Date(payloadUploaded) : null
            const parsedCurrentUpload = book.last_uploaded_at ? new Date(book.last_uploaded_at) : null
            const payloadUploadMs = parsedPayloadUpload && !isNaN(parsedPayloadUpload) ? parsedPayloadUpload.getTime() : null
            const currentUploadMs = parsedCurrentUpload && !isNaN(parsedCurrentUpload) ? parsedCurrentUpload.getTime() : null
            const payloadUploadDate = payloadUploadMs ? new Date(payloadUploadMs).toISOString().split('T')[0] : null
            const currentUploadDate = currentUploadMs ? new Date(currentUploadMs).toISOString().split('T')[0] : null
            const hasUploadChange = uploadHasValue && payloadUploadDate !== currentUploadDate

            const currentCount = normalizeCount(book.chapter_count)
            const hasCountChange = countHasValue && payloadCount !== currentCount

            // Determine if any field changed (latest chapter, upload date, or chapter count)
            const hasChange = hasLatestChange || hasUploadChange || hasCountChange

            if (!hasChange) {
              return { bookId: book.id, title: book.title, payload, skipped: 'no_change' }
            }

            if (hasChange) {
              const { error: updateError } = await supabase
                .from('books')
                .update({
                  latest_chapter: hasLatestChange ? payloadLatest : book.latest_chapter,
                  last_uploaded_at: hasUploadChange ? payloadUploaded : book.last_uploaded_at,
                  chapter_count: hasCountChange ? payloadCount : book.chapter_count,
                  last_fetched_at: now,
                })
                .eq('id', book.id)

              if (!updateError) {
                updatedIds.add(book.id)
              }
            }

            const changes = []
            if (hasLatestChange) changes.push(`Latest: ${normalizedCurrentLatest || '—'} → ${payloadLatest || '—'}`)
            if (hasUploadChange) changes.push(`Upload: ${book.last_uploaded_at ? new Date(book.last_uploaded_at).toLocaleString() : '—'} → ${payloadUploaded ? new Date(payloadUploaded).toLocaleString() : '—'}`)
            if (hasCountChange) changes.push(`Chapters: ${book.chapter_count ?? '—'} → ${payloadCount}`)

            return { bookId: book.id, title: book.title, payload, updated: hasChange, changes }
          })
        )

        updates.push(...batchResults)
        setWaitingProgress((prev) => ({ current: Math.min(waitingBooks.length, (i + batch.length)), total: waitingBooks.length }))

        // Throttle between batches (skip after last batch)
        if (i + batchSize < waitingBooks.length) {
          await sleep(delayMs)
        }
      }

      const updatesById = new Map(updates.map((u) => [u.bookId, u]))
      const updatedDetails = updates
        .filter((u) => u.updated && u.changes?.length)
        .map((u) => ({ title: u.title, changes: u.changes }))

      const emptyPayloadCount = updates.filter((u) => u.skipped === 'empty_payload').length
      const noChangeCount = updates.filter((u) => u.skipped === 'no_change').length
      const noUrlCount = updates.filter((u) => u.skipped === 'no_url').length
      const errorCount = updates.filter((u) => u.error).length
      const skippedCount = emptyPayloadCount + noChangeCount + noUrlCount

      const errorItems = updates
        .filter((u) => u.error)
        .map((u) => ({
          bookId: u.bookId,
          title: u.title,
          message: u.error,
        }))
      setErrorDetails(errorItems)
      if (errorItems.length === 0) setShowErrors(false)

      setBooks((prev) =>
        prev.map((book) => {
          const result = updatesById.get(book.id)
          const payload = result?.payload
          if (payload && updatedIds.has(book.id)) {
            const payloadLatest = payload.latest_chapter
            const payloadUploaded = payload.last_uploaded_at
              const payloadCount = normalizeCount(payload.chapter_count)
            const hasLatestChange = payloadLatest && payloadLatest !== book.latest_chapter
            const hasUploadChange = payloadUploaded && payloadUploaded !== book.last_uploaded_at
              const hasCountChange = payloadCount !== null && payloadCount !== book.chapter_count
            return {
              ...book,
              latest_chapter: hasLatestChange ? payloadLatest : book.latest_chapter,
              last_uploaded_at: hasUploadChange ? payloadUploaded : book.last_uploaded_at,
                chapter_count: hasCountChange ? payloadCount : book.chapter_count,
              last_fetched_at: now,
            }
          }
          return book
        })
      )

      const summaryParts = [
        `Checked ${waitingBooks.length} waiting books`,
        `updated ${updatedIds.size}`,
      ]

      if (skippedCount) {
        summaryParts.push(`skipped ${skippedCount}`)
      }
      if (errorCount) summaryParts.push(`errors ${errorCount}`)

      setUpdateMessage(summaryParts.join('; ') + '.')
      setUpdateDetails(updatedDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCheckingWaiting(false)
      setWaitingProgress({ current: 0, total: 0 })
    }
  }

  const filteredBooks = getFilteredBooks()

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Bookshelf</h1>
          <p className="muted">Browse, filter, and organize your collection</p>
        </div>
        <Link to="/add" className="primary">
          Smart Add
        </Link>
      </div>

      <div className="bookshelf-layout">
        {/* Sidebar with shelves */}
        <ShelfSidebar
          statusShelves={statusShelves}
          customShelves={customShelves}
          activeShelf={activeShelf}
          onShelfChange={setActiveShelf}
          onDeleteShelf={handleDeleteShelf}
          onCreateShelf={handleCreateShelf}
          getShelfCount={getShelfCount}
        />

        {/* Main content area */}
        <div className="shelf-content">
          {/* Filters and search */}
          <div className="shelf-controls">
            <label className="field" style={{ flex: 1 }}>
              <span>Search</span>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <label className="field" style={{ minWidth: '180px' }}>
              <span>Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ minWidth: '160px' }}>
              <span>Language</span>
              <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
                <option value="all">All languages</option>
                {allLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="ghost"
              onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              title={sortDirection === 'desc' ? 'Descending' : 'Ascending'}
              style={{ padding: '8px 12px', fontSize: '0.9rem', height: 'fit-content', alignSelf: 'flex-end' }}
            >
              {sortDirection === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {/* Genre filter */}
          <GenreFilter
            allGenres={allGenres}
            activeGenres={activeGenres}
            onGenreChange={setActiveGenres}
            genreFilterMode={genreFilterMode}
            onGenreFilterModeChange={setGenreFilterMode}
            isOpen={genreFilterOpen}
            onOpenChange={setGenreFilterOpen}
          />

          {/* Chapter count filter */}
          <ChapterCountFilter
            chapterFilter={chapterFilter}
            onChapterFilterChange={setChapterFilter}
            isOpen={chapterFilterOpen}
            onOpenChange={setChapterFilterOpen}
          />

          {/* Results count with check updates button for waiting shelf */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p className="muted">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found{' '}
              {loading && '(loading...)'}
            </p>
            {activeShelf === 'waiting' && filteredBooks.length > 0 && (
              <button
                className="primary"
                onClick={handleCheckWaitingUpdates}
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                disabled={checkingWaiting}
              >
                {checkingWaiting ? 'Checking…' : 'Check Updates'}
              </button>
            )}
          </div>

          {checkingWaiting && waitingProgress.total > 0 && (
            <div className="notice" style={{ marginBottom: '12px', padding: '8px 12px' }}>
              <p className="muted" style={{ margin: 0 }}>
                Checking {waitingProgress.current}/{waitingProgress.total} (throttled)
              </p>
              <div style={{ marginTop: '6px', height: '6px', background: 'var(--panel)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((waitingProgress.current / waitingProgress.total) * 100)}%`,
                    height: '100%',
                    background: 'var(--accent)',
                  }}
                />
              </div>
            </div>
          )}

          {updateMessage && (
            <p className="muted" style={{ marginBottom: '12px' }}>
              {updateMessage}
            </p>
          )}

          {updateDetails.length > 0 && (
            <div className="notice" style={subtleBoxStyle}>
              <p className="success" style={{ margin: 0, fontWeight: 600 }}>Updates</p>
              <ul className="muted" style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: 1.5 }}>
                {updateDetails.map((item, idx) => (
                  <li key={`${item.title}-${idx}`} style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text)' }}>{item.title || 'Untitled'}</strong>
                    <ul style={{ margin: '4px 0 0 14px', paddingLeft: '14px', listStyle: 'disc' }}>
                      {item.changes.map((change, cidx) => (
                        <li key={cidx}>{change}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorDetails.length > 0 && (
            <div className="notice" style={subtleBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <p className="error" style={{ margin: 0, fontWeight: 600 }}>
                  {errorDetails.length} error{errorDetails.length === 1 ? '' : 's'} during update
                </p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowErrors((v) => !v)}
                  style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                >
                  {showErrors ? 'Hide errors' : 'Show errors'}
                </button>
              </div>
              {showErrors && (
                <ul className="muted" style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: 1.5 }}>
                  {errorDetails.map((err) => (
                    <li key={err.bookId} style={{ marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text)' }}>{err.title || 'Untitled'}</strong>: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="error">{error}</p>}

          {/* Book grid */}
          <BookGrid
            books={filteredBooks}
            loading={loading}
            customShelves={customShelves}
            onAddToShelf={handleToggleBookShelf}
            activeGenres={activeGenres}
            setActiveGenres={setActiveGenres}
          />
        </div>
      </div>
    </div>
  )
}

export default Bookshelf
