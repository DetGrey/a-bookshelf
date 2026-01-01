import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'
import { getBooks, STATUS } from '../lib/db.js'
import BookCard from '../components/BookCard.jsx'

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

  const sectionKeys = ['reading', 'plan_to_read', 'waiting', 'completed', 'dropped']
  const lastUpdated = books[0]?.updated_at

  const waitingCount = books.filter((b) => b.status === 'waiting').length

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
          <p className="muted">Completed</p>
          <strong>{loading ? '—' : books.filter((b) => b.status === 'completed').length}</strong>
        </div>
        <div className="stat">
          <p className="muted">Waiting for updates</p>
          <strong>{loading ? '—' : waitingCount}</strong>
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
              <h2 style={{ color: 'var(--accent)', margin: 0 }}>
                {key === 'reading' ? 'Currently reading' : STATUS[key]}
              </h2>
            </div>
            <div className="card-grid">
              {sectionBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  compact
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default Dashboard
