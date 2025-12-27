import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getBook, updateBook, addLink, deleteLink, deleteBook, STATUS, STATUS_KEYS } from '../lib/db.js'

function BookDetails() {
  const { bookId } = useParams()
  const navigate = useNavigate()

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'reading',
    original_language: '',
    last_read: '',
    latest_chapter: '',
    notes: '',
  })
  const [newSourceLabel, setNewSourceLabel] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [sources, setSources] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const b = await getBook(bookId)
        if (!mounted) return
        setBook(b)
        setSources(b.sources ?? [])
        setEditForm({
          title: b.title ?? '',
          description: b.description ?? '',
          status: b.status ?? 'reading',
          original_language: b.original_language ?? '',
          last_read: b.last_read ?? '',
          latest_chapter: b.latest_chapter ?? '',
          notes: b.notes ?? '',
        })
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
  }, [bookId])

  if (loading) {
    return (
      <div className="page narrow">
        <div className="centered">
          <h2>Loading…</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page narrow">
        <div className="centered">
          <h2>Could not load book</h2>
          <p className="error">{error}</p>
          <Link to="/" className="primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="page narrow">
        <div className="centered">
          <h2>Book not found</h2>
          <p className="muted">This book doesn't exist in your library.</p>
          <Link to="/" className="primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    await updateBook(book.id, editForm)
    setBook({ ...book, ...editForm })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${book.title}" from your library?`)) {
      await deleteBook(book.id)
      navigate('/')
    }
  }

  const handleAddSource = async (e) => {
    e.preventDefault()
    if (newSourceLabel && newSourceUrl) {
      await addLink(book.id, newSourceLabel, newSourceUrl)
      setSources([...sources, { id: `temp-${Date.now()}`, label: newSourceLabel, url: newSourceUrl }])
      setNewSourceLabel('')
      setNewSourceUrl('')
    }
  }

  const handleRemoveSource = async (index) => {
    const link = sources[index]
    if (link?.id && !String(link.id).startsWith('temp-')) await deleteLink(link.id)
    setSources(sources.filter((_, i) => i !== index))
  }

  return (
    <div className="page">
      <div className="page-head">
        <Link to="/" className="ghost">← Back to Library</Link>
        {!isEditing && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button className="ghost" style={{ color: '#ff7b7b' }} onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="stack">
          <h1>Edit Book</h1>
          
          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </label>

          <div className="grid-2">
            <label className="field">
              <span>Status</span>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                {STATUS_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {STATUS[key]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Original Language</span>
              <input
                type="text"
                value={editForm.original_language}
                onChange={(e) => setEditForm({ ...editForm, original_language: e.target.value })}
                placeholder="Japanese, Korean, English..."
              />
            </label>

            <label className="field">
              <span>Last Read</span>
              <input
                type="text"
                value={editForm.last_read}
                onChange={(e) => setEditForm({ ...editForm, last_read: e.target.value })}
                placeholder="Ch 50"
              />
            </label>
          </div>

          <label className="field">
            <span>Latest Chapter (site)</span>
            <input
              type="text"
              value={editForm.latest_chapter}
              onChange={(e) => setEditForm({ ...editForm, latest_chapter: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows="4"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Your personal thoughts, reminders, or reading notes..."
            />
          </label>

          <h3>Source Links</h3>
          <div className="source-grid">
            {sources.map((source, index) => (
              <div key={index} className="card source-card">
                <div>
                  <strong>{source.label}</strong>
                  <p className="muted" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                    {source.url}
                  </p>
                </div>
                <button
                  className="ghost"
                  style={{ color: '#ff7b7b' }}
                  onClick={() => handleRemoveSource(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <form className="stack" onSubmit={handleAddSource}>
            <p className="eyebrow">Add New Source</p>
            <div className="grid-2">
              <label className="field">
                <span>Label</span>
                <input
                  type="text"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                  placeholder="Official, Scanlation A..."
                />
              </label>
              <label className="field">
                <span>URL</span>
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
            <button type="submit" className="ghost">
              + Add Source
            </button>
          </form>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="primary" onClick={handleSave}>
              Save Changes
            </button>
            <button className="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="stack">
            <div className="book-hero">
            <div className="cover" style={{ backgroundImage: `url(${book.cover_url})` }} />
            <div className="stack">
              <div>
                <p className="eyebrow">{STATUS[book.status] ?? book.status}</p>
                <h1>{book.title}</h1>
                <p className="muted">{book.description}</p>
              </div>

              <div className="pill-row">
                {book.last_read && <span className="pill">Last read: {book.last_read}</span>}
                {book.latest_chapter && <span className="pill ghost">Latest: {book.latest_chapter}</span>}
              </div>

              <div className="stat-grid">
                <div className="stat">
                  <p className="muted">Status</p>
                  <strong>{STATUS[book.status] ?? book.status}</strong>
                </div>
                <div className="stat">
                  <p className="muted">Original Language</p>
                  <strong>{book.original_language || '—'}</strong>
                </div>
                <div className="stat">
                  <p className="muted">Last Updated</p>
                  <strong>{book.updated_at ? new Date(book.updated_at).toLocaleDateString() : '—'}</strong>
                </div>
                <div className="stat">
                  <p className="muted">Fetched</p>
                  <strong>{book.last_fetched_at ? new Date(book.last_fetched_at).toLocaleString() : '—'}</strong>
                </div>
                <div className="stat">
                  <p className="muted">Uploaded</p>
                  <strong>{book.last_uploaded_at ? new Date(book.last_uploaded_at).toLocaleString() : '—'}</strong>
                </div>
              </div>

              {book.genres?.length > 0 && (
                <div className="pill-row" style={{ marginTop: '8px' }}>
                  {book.genres.map((g, i) => (
                    <span key={`${g}-${i}`} className="pill ghost">{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {book.notes && (
            <section className="card">
              <p className="eyebrow">Personal Notes</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{book.notes}</p>
            </section>
          )}

          <section>
            <div className="block-head">
              <p className="eyebrow">Source Links</p>
            </div>
            <div className="source-grid">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card source-card"
                >
                  <div>
                    <strong>{source.label}</strong>
                    <p className="muted" style={{ fontSize: '0.85rem' }}>
                      Open in new tab →
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default BookDetails
