import { useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS, truncateText, scoreToLabel } from '../lib/db.js'

/**
 * BookCard Component
 * 
 * Displays a single book with:
 * - Cover image, title, description
 * - Status and metadata pills
 * - Latest chapter info
 * - Links to sources and book details
 * - Optional shelf management (for Bookshelf view)
 * 
 * @param {Object} props
 * @param {Object} props.book - Book data
 * @param {Function} props.onAddToShelf - Optional callback when shelf is toggled
 * @param {Array} props.customShelves - Optional list of custom shelves
 * @param {Array} props.activeGenres - Optional list of active genre filters
 * @param {Function} props.setActiveGenres - Optional callback to update genre filters
 * @param {boolean} props.compact - If true, shows simpler version (Dashboard mode)
 */
function BookCard({
  book,
  onAddToShelf,
  customShelves = [],
  activeGenres = [],
  setActiveGenres,
  compact = false,
}) {
  const [showShelfMenu, setShowShelfMenu] = useState(false)

  const scoreColor = (score) => {
    const n = Number(score)
    if (!Number.isFinite(n)) return 'var(--text)'
    if (n >= 9) return '#b34ad3ff'   // great/masterpiece
    if (n >= 7) return '#0ba360'   // good/very good
    if (n >= 5) return '#c6a700'   // average/fine
    if (n >= 3) return '#d97706'   // bad/very bad
    if (n >= 1) return '#d14343'   // appalling/horrible
    return '#ffffff'               // 0 / N/A
  }

  const languageFlag = (lang) => {
    if (!lang) return null
    const lower = lang.toLowerCase()
    if (lower.startsWith('jap') || lower === 'jp' || lower === 'ja' || lower === 'jpn') return '🇯🇵'
    if (lower.startsWith('kor') || lower === 'kr' || lower === 'ko') return '🇰🇷'
    if (lower.startsWith('chi') || lower.includes('mandarin') || lower === 'cn' || lower === 'zh') return '🇨🇳'
    return null
  }

  const handleToggleShelf = (shelfId) => {
    if (onAddToShelf) {
      onAddToShelf(book.id, shelfId)
      setShowShelfMenu(false)
    }
  }

  return (
    <article
      className="card"
      style={{
        zIndex: showShelfMenu ? 50 : 0,
        position: 'relative',
      }}
    >
      <div className="card-head">
        <Link to={`/book/${book.id}`} style={{ display: 'block' }}>
          <div
            className="thumb"
            style={{ backgroundImage: `url(${book.cover_url})`, cursor: 'pointer' }}
          />
        </Link>
        <div style={compact ? undefined : { minWidth: 0 }}>
          <h3 style={{ wordBreak: 'break-word' }}>{book.title}</h3>
          <p className="muted" style={{ wordBreak: 'break-word' }}>
            {truncateText(book.description)}
          </p>
          <div className="pill-row">
            <span className="pill">{STATUS[book.status] ?? book.status}</span>
            {book.score !== undefined && book.score !== null ? (
              <span
                className="pill ghost"
                style={{ color: scoreColor(book.score), borderColor: scoreColor(book.score) }}
              >
                {scoreToLabel(book.score) || `Score: ${book.score}`}
              </span>
            ) : null}
            {book.original_language && (
              <span className="pill ghost emoji-text">
                {languageFlag(book.original_language) ? `${languageFlag(book.original_language)} ` : ''}
                {book.original_language}
              </span>
            )}
            {book.last_read && <span className="pill ghost">Last: {book.last_read}</span>}
            {!compact &&
              book.shelves?.map((shelfId) => {
                const shelf = customShelves.find((s) => s.id === shelfId)
                return shelf ? (
                  <span key={shelfId} className="pill" style={{ fontSize: '0.8rem' }}>
                    📚 {shelf.name}
                  </span>
                ) : null
              })}
          </div>
          {!compact && book.genres?.length > 0 && (
            <div className="pill-row" style={{ marginTop: '6px' }}>
              {book.genres.map((g, i) => {
                const isActive = activeGenres.includes(g)
                return (
                  <button
                    key={`${g}-${i}`}
                    className={isActive ? 'pill' : 'pill ghost'}
                    onClick={() => {
                      if (setActiveGenres) {
                        setActiveGenres(
                          isActive ? activeGenres.filter((genre) => genre !== g) : [...activeGenres, g]
                        )
                      }
                    }}
                    style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '4px 6px' }}
                  >
                    {g}
                  </button>
                )
              })}
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
          {book.sources.slice(0, compact ? 2 : 1).map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="ghost"
            >
              {source.label}
            </a>
          ))}
          {!compact && customShelves.length > 0 && (
            <div style={{ position: 'relative', zIndex: 1000 }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <button
                className="ghost"
                onClick={() => setShowShelfMenu(!showShelfMenu)}
                style={{ fontSize: '0.85rem', height: '100%' }}
              >
                + Shelf
              </button>
                </div>
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
                </div>
              )}
            </div>
          )}
          <Link to={`/book/${book.id}`} className="primary">
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default BookCard
