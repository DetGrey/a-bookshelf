import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'
import { getBooks, STATUS } from '../lib/db.js'

function BookCard({ book }) {
  return (
    <article className="card">
      <div className="card-head">
        <div className="thumb" style={{ backgroundImage: `url(${book.cover_url})` }} />
        <div>
          <h3>{book.title}</h3>
          <p className="muted">{book.description}</p>
          <div className="pill-row">
            <span className="pill">{STATUS[book.status] ?? book.status}</span>
            {book.original_language && <span className="pill ghost">{book.original_language}</span>}
            {book.last_read && <span className="pill ghost">Last read: {book.last_read}</span>}
          </div>
        </div>
      </div>
      <div className="card-footer">
        <div>
          <p className="muted">Latest chapter</p>
          <p>{book.latest_chapter || '—'}</p>
        </div>
        <div className="card-links">
          {book.sources.slice(0, 2).map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="ghost">
              {source.label}
            </a>
          ))}
          <Link to={`/book/${book.id}`} className="primary">
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const list = await getBooks(user.id)
        if (mounted) setBooks(list)
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

  const sectionKeys = ['reading', 'plan_to_read', 'completed', 'dropped']
  const lastUpdated = books[0]?.updated_at

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Your library at a glance</h1>
          <p className="muted">Track reading, pull metadata, and jump back into the next chapter fast.</p>
        </div>
        <Link to="/add" className="primary">Smart Add</Link>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="stat-grid">
        <div className="stat">
          <p className="muted">Total saved</p>
          <strong>{loading ? '—' : books.length}</strong>
        </div>
        <div className="stat">
          <p className="muted">Active reads</p>
          <strong>{loading ? '—' : books.filter((b) => b.status === 'reading').length}</strong>
        </div>
        <div className="stat">
          <p className="muted">Completed</p>
          <strong>{loading ? '—' : books.filter((b) => b.status === 'completed').length}</strong>
        </div>
        <div className="stat">
          <p className="muted">Last updated</p>
          <strong>{loading || !lastUpdated ? '—' : new Date(lastUpdated).toLocaleDateString()}</strong>
        </div>
      </section>

      {sectionKeys.map((key) => {
        const sectionBooks = books.filter((book) => book.status === key)
        if (!sectionBooks.length) return null
        return (
          <section key={key} className="block">
            <div className="block-head">
              <div>
                <p className="eyebrow">{STATUS[key]}</p>
                <h2>{key === 'reading' ? 'Currently reading' : STATUS[key]}</h2>
              </div>
            </div>
            <div className="card-grid">
              {sectionBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default Dashboard
