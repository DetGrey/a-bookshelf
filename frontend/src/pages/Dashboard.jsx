import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'
import { useBooks } from '../context/BooksProvider.jsx'
import { getBackup, restoreBackup, STATUS } from '../lib/db.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import BookCard from '../components/BookCard.jsx'

function Dashboard() {
  const { user } = useAuth()
  const { books, loading } = useBooks()
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupError, setBackupError] = useState('')
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState('')
  const [dupeLoading, setDupeLoading] = useState(false)
  const [dupeResults, setDupeResults] = useState([])
  const [dupeMessage, setDupeMessage] = useState('')
  const fileInputRef = useRef(null)

  usePageTitle('Dashboard')

  const loadBooks = useCallback(async () => {
    if (!user) return
    // Books are now managed by BooksProvider context
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
      // Context will automatically refresh via realtime subscription
      setRestoreMessage('Restore complete.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed'
      setBackupError(message)
    } finally {
      setRestoreLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Duplicate title finder (simple Dice coefficient over bigrams + substring check)
  const normalizeTitle = (title = '') => title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const bigrams = (text) => {
    if (!text) return []
    if (text.length === 1) return [text]
    const grams = []
    for (let i = 0; i < text.length - 1; i += 1) {
      grams.push(text.slice(i, i + 2))
    }
    return grams
  }
  const diceSimilarity = (a, b) => {
    const aBigrams = bigrams(a)
    const bBigrams = bigrams(b)
    if (!aBigrams.length || !bBigrams.length) return 0
    const counts = new Map()
    aBigrams.forEach((g) => counts.set(g, (counts.get(g) || 0) + 1))
    let overlap = 0
    bBigrams.forEach((g) => {
      const count = counts.get(g) || 0
      if (count > 0) {
        overlap += 1
        counts.set(g, count - 1)
      }
    })
    return (2 * overlap) / (aBigrams.length + bBigrams.length)
  }

  const handleFindDuplicates = () => {
    setDupeLoading(true)
    setDupeResults([])
    setDupeMessage('')

    const normalized = books.map((b) => ({
      ...b,
      norm: normalizeTitle(b.title || ''),
    })).filter((b) => b.norm.length > 0)

    const pairs = []
    for (let i = 0; i < normalized.length; i += 1) {
      for (let j = i + 1; j < normalized.length; j += 1) {
        const a = normalized[i]
        const b = normalized[j]
        const sim = diceSimilarity(a.norm, b.norm)
        const contains = a.norm.includes(b.norm) || b.norm.includes(a.norm)
        if (sim >= 0.7 || contains) {
          pairs.push({
            a,
            b,
            score: Math.max(sim, contains ? 0.7 : sim),
          })
        }
      }
    }

    pairs.sort((x, y) => y.score - x.score)
    setDupeResults(pairs)
    setDupeMessage(pairs.length ? '' : 'No likely duplicates found.')
    setDupeLoading(false)
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
  const IGNORE_GENRES = new Set(['manhwa', 'manhua', 'webtoon', 'manga', 'full color'])
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
    // eslint-disable-next-line no-unused-vars
    const stops = genreEntries.map(([_genre, count], idx) => {
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

      <section className="card dashboard-section">
        <div className="block-head dashboard-section-header">
          <h2>Genre breakdown</h2>
          <p className="muted">
            {totalGenres ? 'Share of genres across your library' : 'No genre data yet'}
          </p>
        </div>
        {totalGenres ? (
          <div className="genre-breakdown">
            <div
              className="genre-pie"
              style={genrePieStyle()}
            />
            <div className="stack genre-legend">
              {genreEntries.slice(0, 8).map(([genre, count], idx) => {
                const percent = ((count / totalGenres) * 100).toFixed(0)
                return (
                  <div key={genre} className="genre-legend-item">
                    <span
                      className="genre-legend-indicator"
                      style={{
                        background: palette[idx % palette.length],
                      }}
                    />
                    <span className="genre-legend-label">{genre}</span>
                    <span className="muted">{percent}%</span>
                  </div>
                )
              })}
              {genreEntries.length > 8 && (
                <p className="muted genre-legend-more">
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
        const sectionBooks = books
          .filter((book) => book.status === key)
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 5)
        if (!sectionBooks.length) return null
        return (
          <section key={key} className="block">
            <div className="block-head">
              <h2 className="section-heading">
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

      <section className="card quality-check-section">
        <div className="block-head quality-check-header">
          <div>
            <p className="eyebrow m-0">Quality check</p>
            <h2 className="m-0">Find possible duplicate titles</h2>
          </div>
          <button
            className="ghost quality-check-button"
            onClick={handleFindDuplicates}
            disabled={dupeLoading || loading || books.length === 0}
          >
            {dupeLoading ? 'Scanning…' : 'Scan for duplicates'}
          </button>
        </div>
        {dupeMessage && <p className="muted mt-4">{dupeMessage}</p>}
        {dupeResults.length > 0 && (
          <div className="stack duplicate-results">
            {dupeResults.map(({ a, b, score }) => (
              <div key={`${a.id}-${b.id}`} className="card duplicate-item-card">
                <div className="duplicate-comparison">
                  <div className="duplicate-titles-wrapper">
                    <div className="duplicate-titles-list">
                      <Link to={`/book/${a.id}`} target="_blank" rel="noreferrer">
                        <strong>{a.title}</strong>
                      </Link>
                      <Link to={`/book/${b.id}`} target="_blank" rel="noreferrer" className="muted duplicate-vs-link">
                        vs. {b.title}
                      </Link>
                    </div>
                  </div>
                  <span className="pill ghost similarity-percentage">Similarity {(score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card data-portability-section">
          <div>
            <p className="eyebrow m-0">Data portability</p>
            <p className="muted m-0">Download or upload all your data as JSON (books, shelves, links).</p>
          </div>
          <div className="data-portability-buttons">
            <button
              className="ghost quality-check-button"
              onClick={handleUploadClick}
              disabled={restoreLoading}
            >
              {restoreLoading ? 'Importing…' : 'Upload JSON'}
            </button>
            <button
              className="ghost quality-check-button"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
            >
              {backupLoading ? 'Preparing…' : 'Download Backup'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden-file-input"
              onChange={handleRestore}
            />
          </div>
        </section>
    </div>
  )
}

export default Dashboard
