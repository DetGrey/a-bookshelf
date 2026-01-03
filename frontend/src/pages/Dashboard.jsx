import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'
import { getBooks, getBackup, restoreBackup, STATUS } from '../lib/db.js'
import BookCard from '../components/BookCard.jsx'

function Dashboard() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupError, setBackupError] = useState('')
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState('')
  const fileInputRef = useRef(null)

  const loadBooks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const list = await getBooks(user.id)
      setBooks(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadBooks()
  }, [user, loadBooks])

  const sectionKeys = ['reading', 'plan_to_read', 'waiting', 'completed', 'dropped']
  const lastUpdated = books[0]?.updated_at

  const waitingCount = books.filter((b) => b.status === 'waiting').length

  const handleDownloadBackup = async () => {
    if (!user || backupLoading) return
    setBackupLoading(true)
    setBackupError('')
    try {
      const data = await getBackup(user.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `a-bookshelf-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : String(err))
    } finally {
      setBackupLoading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRestore = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setRestoreMessage('')
    setBackupError('')
    setRestoreLoading(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      await restoreBackup(user.id, json)
      setRestoreMessage('Restore complete. Refreshing data…')
      await loadBooks()
      setRestoreMessage('Restore complete.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed'
      setBackupError(message)
    } finally {
      setRestoreLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Stats: average score (ignore 0) and perfect scores
  const scoredBooks = books.filter((b) => {
    const n = Number(b.score)
    return Number.isFinite(n) && n !== 0
  })
  const averageScore = scoredBooks.length
    ? (scoredBooks.reduce((sum, b) => sum + Number(b.score), 0) / scoredBooks.length).toFixed(1)
    : null
  const perfectScoreCount = books.filter((b) => Number(b.score) === 10).length

  // Genre breakdown
  const IGNORE_GENRES = new Set(['manhwa', 'manhua', 'webtoon', 'manga'])
  const genreCounts = books.reduce((acc, book) => {
    (book.genres ?? []).forEach((g) => {
      const key = g.trim()
      if (!key) return
      if (IGNORE_GENRES.has(key.toLowerCase())) return
      acc[key] = (acc[key] || 0) + 1
    })
    return acc
  }, {})
  const genreEntriesRaw = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])
  const totalGenres = genreEntriesRaw.reduce((sum, [, count]) => sum + count, 0)
  const topLimit = 5
  const topGenres = genreEntriesRaw.slice(0, topLimit)
  const otherCount = genreEntriesRaw.slice(topLimit).reduce((sum, [, count]) => sum + count, 0)
  const genreEntries = otherCount > 0 ? [...topGenres, ['Other', otherCount]] : topGenres
  const palette = ['#7c83ff', '#ff8ba7', '#22c55e', '#f6aa1c', '#4cc9f0', '#a855f7', '#ef4444', '#0ea5e9']
  const genrePieStyle = () => {
    if (!totalGenres) return { background: 'var(--panel, #f5f5f5)' }
    let offset = 0
    const stops = genreEntries.map(([_, count], idx) => {
      const pct = (count / totalGenres) * 100
      const start = offset
      const end = offset + pct
      offset = end
      return `${palette[idx % palette.length]} ${start}% ${end}%`
    })
    return { background: `conic-gradient(${stops.join(', ')})` }
  }

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
      {backupError && <p className="error">{backupError}</p>}
      {restoreMessage && <p className="muted">{restoreMessage}</p>}

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
        <div className="stat">
          <p className="muted">Average score</p>
          <strong>{loading ? '—' : averageScore ?? '—'}</strong>
        </div>
        <div className="stat">
          <p className="muted">Score 10 count</p>
          <strong>{loading ? '—' : perfectScoreCount}</strong>
        </div>
      </section>

      <section className="card" style={{ marginTop: '16px' }}>
        <div className="block-head" style={{ marginBottom: '8px' }}>
          <h2 style={{ margin: 0 }}>Genre breakdown</h2>
          <p className="muted" style={{ margin: 0 }}>
            {totalGenres ? 'Share of genres across your library' : 'No genre data yet'}
          </p>
        </div>
        {totalGenres ? (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                ...genrePieStyle(),
              }}
            />
            <div className="stack" style={{ minWidth: '220px', flex: 1 }}>
              {genreEntries.slice(0, 8).map(([genre, count], idx) => {
                const percent = ((count / totalGenres) * 100).toFixed(0)
                return (
                  <div key={genre} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '4px',
                        background: palette[idx % palette.length],
                      }}
                    />
                    <span style={{ flex: 1 }}>{genre}</span>
                    <span className="muted">{percent}%</span>
                  </div>
                )
              })}
              {genreEntries.length > 8 && (
                <p className="muted" style={{ marginTop: '4px' }}>
                  + {genreEntries.length - 8} more
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">Add genres to your books to see the breakdown.</p>
        )}
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

      <section className="card" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Data portability</p>
            <p className="muted" style={{ margin: 0 }}>Download or upload all your data as JSON (books, shelves, links).</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="ghost"
              onClick={handleUploadClick}
              disabled={restoreLoading}
              style={{ padding: '10px 14px', fontSize: '0.95rem' }}
            >
              {restoreLoading ? 'Importing…' : 'Upload JSON'}
            </button>
            <button
              className="ghost"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              style={{ padding: '10px 14px', fontSize: '0.95rem' }}
            >
              {backupLoading ? 'Preparing…' : 'Download Backup'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleRestore}
            />
          </div>
        </section>
    </div>
  )
}

export default Dashboard
