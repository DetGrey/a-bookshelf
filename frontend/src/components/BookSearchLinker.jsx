import { useState, useEffect, useRef } from 'react'
import { searchBooks } from '../lib/db.js'
import { useAuth } from '../context/AuthProvider.jsx'

function BookSearchLinker({ currentBookId, existingRelatedBooks = [], pendingRelatedBooks, onAddRelated, onRemoveRelated, onRemoveExistingRelated, isEditing = false }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchBooks(user.id, query)
        // Filter out current book, already linked books, and pending books
        const linkedIds = new Set([
          currentBookId,
          ...existingRelatedBooks.map((r) => r.relatedBookId),
          ...pendingRelatedBooks.map((r) => r.relatedBookId),
        ])
        const filtered = data.filter((b) => !linkedIds.has(b.id))
        setResults(filtered)
        setShowResults(true)
      } catch (err) {
        console.error('Search failed:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, user.id, currentBookId, existingRelatedBooks, pendingRelatedBooks])

  const handleLink = (book) => {
    onAddRelated(book.id, relationshipType || 'related', book)
    setQuery('')
    setRelationshipType('')
    setResults([])
    setShowResults(false)
  }

  const handleUnlink = (pendingId) => {
    if (!confirm('Remove this book link?')) return
    onRemoveRelated(pendingId)
  }

  if (!isEditing) {
    return null
  }

  return (
    <div className="book-search-linker">
      <label>
        <strong>Related Books</strong>
        <small style={{ display: 'block', marginTop: '0.25rem' }}>
          Link language versions or related books
        </small>
      </label>

      {(existingRelatedBooks.length > 0 || pendingRelatedBooks.length > 0) && (
        <div className="linked-books">
          {existingRelatedBooks.map((rel) => (
            <div key={rel.id} className="linked-book-item">
              <div className="linked-book-info">
                {rel.book?.coverUrl && (
                  <img
                    src={rel.book.coverUrl}
                    alt={rel.book.title}
                  />
                )}
                <div>
                  <strong>{rel.book?.title || 'Unknown'}</strong>
                  <div className="language-relation">
                    {rel.book?.language && <span>{rel.book.language}</span>}
                    {rel.book?.language && rel.relationshipType && <span> • </span>}
                    {rel.relationshipType && <span>{rel.relationshipType}</span>}
                  </div>
                </div>
                {onRemoveExistingRelated && (
                  <button
                    type="button"
                    onClick={() => onRemoveExistingRelated(rel.id)}
                    className="btn-icon"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
                {!onRemoveExistingRelated && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', paddingRight: '0.5rem' }}>
                    (saved)
                  </span>
                )}
              </div>
            </div>
          ))}
          {pendingRelatedBooks.map((rel) => (
            <div key={rel.tempId || rel.id} className="linked-book-item">
              <div className="linked-book-info">
                {rel.book?.coverUrl && (
                  <img
                    src={rel.book.coverUrl}
                    alt={rel.book.title}
                  />
                )}
                <div>
                  <strong>{rel.book?.title || 'Unknown'}</strong>
                  <div className="language-relation">
                    {rel.book?.language && <span>{rel.book.language}</span>}
                    {rel.book?.language && rel.relationshipType && <span> • </span>}
                    {rel.relationshipType && <span>{rel.relationshipType}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveRelated(rel.tempId || rel.id)}
                  className="btn-icon"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={searchRef} style={{ position: 'relative', marginTop: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <label className="field">
            <span>Search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a book..."
              onFocus={() => {
                if (results.length > 0) setShowResults(true)
              }}
            />
          </label>
          <label className="field">
            <span>Relation</span>
            <input
              type="text"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g. Spanish version"
            />
          </label>
        </div>

        {showResults && (
          <div className="search-results-dropdown">
            {loading && <div className="search-result-item">Searching...</div>}
            {!loading && results.length === 0 && <div className="search-result-item">No results found</div>}
            {!loading &&
              results.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  className="search-result-item"
                  onClick={() => handleLink(book)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {book.coverUrl && (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{ width: '30px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    )}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 500 }}>{book.title}</div>
                      {book.language && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{book.language}</div>}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookSearchLinker