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
    cover_url: '',
    genres: '', // comma-separated for editing
    last_uploaded_at: '',
    last_fetched_at: '',
  })
  const [newSourceLabel, setNewSourceLabel] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [sources, setSources] = useState([])
  const [fetchUrl, setFetchUrl] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [fetchSuccess, setFetchSuccess] = useState('')
  const [fetchedMetadata, setFetchedMetadata] = useState(null)

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
          cover_url: b.cover_url ?? '',
          genres: (b.genres ?? []).join(', '),
          last_uploaded_at: b.last_uploaded_at ?? '',
          last_fetched_at: b.last_fetched_at ?? '',
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
    const payload = {
      ...editForm,
      genres: editForm.genres
        ? editForm.genres.split(',').map((g) => g.trim()).filter(Boolean)
        : [],
    }
    await updateBook(book.id, payload)
    setBook({ ...book, ...payload })
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

  const handleFetch = async (e) => {
    e.preventDefault()
    setFetchError('')
    setFetchSuccess('')
    setFetchLoading(true)
    try {
      if (!fetchUrl) throw new Error('Please enter a URL to fetch.')
      const { data, error: fnError } = await supabase.functions.invoke('fetch-metadata', {
        body: { url: fetchUrl },
      })
      if (fnError) throw fnError
      const fallback = {
        title: 'Metadata demo title',
        description: 'Connect your Supabase Edge Function to return real data.',
        image:
          'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80',
        genres: [],
        original_language: '',
        latest_chapter: '',
        last_uploaded_at: null,
      }
      const meta = data?.metadata ?? fallback
      setFetchedMetadata(meta)
      setFetchSuccess('Metadata fetched. Review below, then apply to fields.')
    } catch (err) {
      setFetchError(err?.message ?? 'Unable to fetch metadata right now.')
    } finally {
      setFetchLoading(false)
    }
  }

  const applyFetched = () => {
    if (!fetchedMetadata) return
    const now = new Date().toISOString()
    setEditForm((prev) => ({
      ...prev,
      title: fetchedMetadata.title ?? prev.title,
      description: fetchedMetadata.description ?? prev.description,
      cover_url: fetchedMetadata.image ?? prev.cover_url,
      genres: (fetchedMetadata.genres ?? []).join(', '),
      original_language: fetchedMetadata.original_language ?? prev.original_language,
      latest_chapter: fetchedMetadata.latest_chapter ?? prev.latest_chapter,
      last_uploaded_at: fetchedMetadata.last_uploaded_at ?? prev.last_uploaded_at,
      last_fetched_at: now,
    }))
    setFetchSuccess('Applied metadata to fields. Remember to Save Changes.')
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
          <section className="card" style={{ marginBottom: '16px' }}>
            <p className="eyebrow">Fetch Metadata</p>
            <form onSubmit={handleFetch} className="stack">
              <label className="field">
                <span>Source URL</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ flex: 1 }}
                    type="url"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    placeholder="https://example.com/title-page"
                  />
                  <button type="submit" className="ghost" disabled={fetchLoading}>
                    {fetchLoading ? 'Fetching…' : 'Fetch'}
                  </button>
                </div>
              </label>
              {fetchError && <p className="error">{fetchError}</p>}
              {fetchSuccess && <p className="success">{fetchSuccess}</p>}
            </form>
            {fetchedMetadata && (
              <div className="metadata-preview" style={{ marginTop: '8px' }}>
                <div className="thumb" style={{ backgroundImage: `url(${fetchedMetadata.image})` }} />
                <div className="stack">
                  <strong>{fetchedMetadata.title}</strong>
                  <p className="muted" style={{ margin: 0 }}>{fetchedMetadata.description}</p>
                  {fetchedMetadata.genres?.length > 0 && (
                    <div className="pill-row" style={{ marginTop: '8px' }}>
                      {fetchedMetadata.genres.map((g, i) => (
                        <span key={`${g}-${i}`} className="pill ghost">{g}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="ghost" onClick={applyFetched}>Apply to fields</button>
                  </div>
                </div>
              </div>
            )}
          </section>
          
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

          <div className="grid-2">
            <label className="field">
              <span>Cover Image URL</span>
              <input
                type="url"
                value={editForm.cover_url}
                onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value })}
                placeholder="https://..."
              />
            </label>

            <label className="field">
              <span>Genres</span>
              <input
                type="text"
                value={editForm.genres}
                onChange={(e) => setEditForm({ ...editForm, genres: e.target.value })}
                placeholder="Action, Romance, Fantasy"
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
            <span>Last Uploaded At (site)</span>
            <input
              type="datetime-local"
              value={editForm.last_uploaded_at || ''}
              onChange={(e) => setEditForm({ ...editForm, last_uploaded_at: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Last Fetched At</span>
            <input
              type="datetime-local"
              value={editForm.last_fetched_at || ''}
              onChange={(e) => setEditForm({ ...editForm, last_fetched_at: e.target.value })}
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
