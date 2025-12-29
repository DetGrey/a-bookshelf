import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'
import { getBooks, getShelves, toggleBookShelf, createShelf, deleteShelf, STATUS, truncateText } from '../lib/db.js'

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
  { value: 'updated', label: 'Last Updated' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'status', label: 'Status' },
]

function BookCard({ book, onAddToShelf, customShelves, onGenreClick }) {
  const [showShelfMenu, setShowShelfMenu] = useState(false)

  const handleToggleShelf = (shelfId) => {
    onAddToShelf(book.id, shelfId)
    setShowShelfMenu(false)
  }

  return (
    <article className="card">
      <div className="card-head">
        <Link to={`/book/${book.id}`} style={{ display: 'block' }}>
          <div className="thumb" style={{ backgroundImage: `url(${book.cover_url})`, cursor: 'pointer' }} />
        </Link>
        <div>
          <h3>{book.title}</h3>
          <p className="muted">{truncateText(book.description)}</p>
          <div className="pill-row">
            <span className="pill">{STATUS[book.status] ?? book.status}</span>
            {book.original_language && <span className="pill ghost">{book.original_language}</span>}
            {book.last_read && <span className="pill ghost">Last: {book.last_read}</span>}
            {book.shelves?.map((shelfId) => {
              const shelf = customShelves.find((s) => s.id === shelfId)
              return shelf ? (
                <span key={shelfId} className="pill" style={{ fontSize: '0.8rem' }}>
                  📚 {shelf.name}
                </span>
              ) : null
            })}
          </div>
          {book.genres?.length > 0 && (
            <div className="pill-row" style={{ marginTop: '6px' }}>
              {book.genres.map((g, i) => (
                <button
                  key={`${g}-${i}`}
                  className="pill ghost"
                  onClick={() => onGenreClick(g)}
                  style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card-footer">
        <div>
          <p className="muted">Latest chapter</p>
          <p>{book.latest_chapter || '—'}</p>
        </div>
        <div className="card-links">
          {book.sources.slice(0, 1).map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="ghost">
              {source.label}
            </a>
          ))}
          <div style={{ position: 'relative' }}>
            <button
              className="ghost"
              onClick={() => setShowShelfMenu(!showShelfMenu)}
              style={{ fontSize: '0.85rem' }}
            >
              + Shelf
            </button>
            {showShelfMenu && (
              <div className="shelf-dropdown">
                {customShelves.map((shelf) => {
                  const isInShelf = book.shelves?.includes(shelf.id)
                  return (
                    <button
                      key={shelf.id}
                      className="shelf-dropdown-item"
                      onClick={() => handleToggleShelf(shelf.id)}
                    >
                      <span>{isInShelf ? '✓' : '○'}</span>
                      <span>{shelf.name}</span>
                    </button>
                  )
                })}
                {customShelves.length === 0 && (
                  <p className="muted" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    No custom shelves yet
                  </p>
                )}
              </div>
            )}
          </div>
          <Link to={`/book/${book.id}`} className="primary">
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

function Bookshelf() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [customShelves, setCustomShelves] = useState([])
  const [activeShelf, setActiveShelf] = useState('all')
  const [activeGenre, setActiveGenre] = useState('')
  const [sortBy, setSortBy] = useState('updated')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewShelfForm, setShowNewShelfForm] = useState(false)
  const [newShelfName, setNewShelfName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Read genre from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const genreParam = params.get('genre')
    if (genreParam) {
      setActiveGenre(decodeURIComponent(genreParam))
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const [list, shelves] = await Promise.all([getBooks(user.id), getShelves(user.id)])
        if (mounted) {
          setBooks(list)
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
  const allGenres = [...new Set(books.flatMap(b => b.genres ?? []))].sort()

  // Filter books by active shelf
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

    // Filter by genre
    if (activeGenre) {
      filtered = filtered.filter((book) => book.genres?.includes(activeGenre))
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
        filtered.sort((a, b) => (STATUS[a.status] ?? a.status).localeCompare(STATUS[b.status] ?? b.status))
        break
      case 'updated':
      default:
        filtered.sort((a, b) => new Date(b.updated_at ?? b.updatedAt) - new Date(a.updated_at ?? a.updatedAt))
        break
    }

    return filtered
  }

  const handleCreateShelf = async (e) => {
    e.preventDefault()
    if (!user) return
    if (newShelfName.trim()) {
      const shelf = await createShelf(user.id, newShelfName.trim())
      setCustomShelves([...customShelves, shelf])
      setNewShelfName('')
      setShowNewShelfForm(false)
    }
  }

  const handleDeleteShelf = async (shelfId) => {
    if (confirm(`Delete this shelf? Books will not be deleted, just removed from this list.`)) {
      await deleteShelf(shelfId)
      setCustomShelves(customShelves.filter((s) => s.id !== shelfId))
      setBooks(books.map((book) => ({
        ...book,
        shelves: book.shelves?.filter((s) => s !== shelfId) ?? [],
      })))
      if (activeShelf === shelfId) setActiveShelf('all')
    }
  }

  const handleToggleBookShelf = async (bookId, shelfId) => {
    await toggleBookShelf(bookId, shelfId)
    setBooks(books.map((book) => {
      if (book.id === bookId) {
        const currentShelves = book.shelves ?? []
        const isInShelf = currentShelves.includes(shelfId)
        return {
          ...book,
          shelves: isInShelf ? currentShelves.filter((s) => s !== shelfId) : [...currentShelves, shelfId],
        }
      }
      return book
    }))
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
        <aside className="shelf-sidebar">
          <div className="block">
            <div className="block-head">
              <p className="eyebrow">Status</p>
            </div>
            <nav className="shelf-list">
              {statusShelves.map((shelf) => {
                const count = getShelfCount(shelf.id)
                return (
                  <button
                    key={shelf.id}
                    className={`shelf-item ${activeShelf === shelf.id ? 'active' : ''}`}
                    onClick={() => setActiveShelf(shelf.id)}
                  >
                    <div>
                      <span>{shelf.name}</span>
                      <span className="shelf-count">{count}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
          
          <div className="block" style={{ marginTop: '16px' }}>
            <div className="block-head">
              <p className="eyebrow">Custom Shelves</p>
              <button
                className="ghost"
                style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                onClick={() => setShowNewShelfForm(!showNewShelfForm)}
              >
                + New
              </button>
            </div>
            <nav className="shelf-list">
              {customShelves.map((shelf) => {
                const count = getShelfCount(shelf.id)
                return (
                  <button
                    key={shelf.id}
                    className={`shelf-item ${activeShelf === shelf.id ? 'active' : ''}`}
                    onClick={() => setActiveShelf(shelf.id)}
                  >
                    <div>
                      <span>{shelf.name}</span>
                      <span className="shelf-count">{count}</span>
                    </div>
                    <button
                      className="shelf-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteShelf(shelf.id)
                      }}
                    >
                      ×
                    </button>
                  </button>
                )
              })}
            </nav>

            {showNewShelfForm && (
              <form className="stack" onSubmit={handleCreateShelf}>
                <label className="field">
                  <span>Shelf name</span>
                  <input
                    type="text"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    placeholder="Favorites, To Buy..."
                    autoFocus
                  />
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" className="primary" style={{ fontSize: '0.85rem' }}>
                    Create
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setShowNewShelfForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </aside>

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
          </div>
          
          {/* Genre filter */}
          {allGenres.length > 0 && (
            <div className="block" style={{ marginTop: '12px' }}>
              <p className="eyebrow" style={{ marginBottom: '8px' }}>Filter by Genre</p>
              <div className="pill-row">
                {activeGenre && (
                  <button
                    className="pill"
                    onClick={() => setActiveGenre('')}
                    style={{ cursor: 'pointer' }}
                  >
                    ✕ Clear
                  </button>
                )}
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    className={activeGenre === genre ? 'pill' : 'pill ghost'}
                    onClick={() => setActiveGenre(activeGenre === genre ? '' : genre)}
                    style={{ cursor: 'pointer' }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results count */}
          <p className="muted" style={{ marginBottom: '12px' }}>
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found {loading && '(loading...)'}
          </p>

          {/* Book grid */}
          {filteredBooks.length > 0 ? (
            <div className="card-grid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToShelf={handleToggleBookShelf}
                  customShelves={customShelves}
                  onGenreClick={(genre) => setActiveGenre(genre)}
                />
              ))}
            </div>
          ) : (
            <div className="centered">
              <p className="muted">No books match your filters.</p>
              <Link to="/add" className="primary">
                Add your first book
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Bookshelf
