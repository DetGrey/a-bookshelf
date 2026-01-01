import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { getBook, updateBook, addLink, deleteLink, deleteBook, STATUS } from '../lib/db.js'
import BookFormFields from '../components/BookFormFields.jsx'
import MetadataFetcher from '../components/MetadataFetcher.jsx'
import SourceManager from '../components/SourceManager.jsx'

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
          <MetadataFetcher
            fetchUrl={fetchUrl}
            onFetchUrlChange={setFetchUrl}
            onFetch={handleFetch}
            loading={fetchLoading}
            error={fetchError}
            success={fetchSuccess}
            fetchedMetadata={fetchedMetadata}
            onApply={applyFetched}
            compact={true}
          />

          <BookFormFields form={editForm} onChange={setEditForm} />

          <SourceManager
            sources={sources}
            onRemoveSource={handleRemoveSource}
            newSourceLabel={newSourceLabel}
            onSourceLabelChange={setNewSourceLabel}
            newSourceUrl={newSourceUrl}
            onSourceUrlChange={setNewSourceUrl}
            onAddSource={handleAddSource}
            isEditing={true}
          />

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
                  <p className="muted">Last Upload</p>
                  <strong>{book.last_uploaded_at ? new Date(book.last_uploaded_at).toLocaleString() : '—'}</strong>
                </div>
              </div>

              {book.genres?.length > 0 && (
                <div className="pill-row" style={{ marginTop: '8px' }}>
                  {book.genres.map((g, i) => (
                    <button
                      key={`${g}-${i}`}
                      className="pill ghost"
                      onClick={() => navigate(`/bookshelf?genre=${encodeURIComponent(g)}`)}
                      style={{ cursor: 'pointer', border: 'none', background: 'inherit', padding: '5px 10px' }}
                    >
                      {g}
                    </button>
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

          <SourceManager
            sources={sources}
            onRemoveSource={handleRemoveSource}
            isEditing={false}
          />
        </div>
      )}
    </div>
  )
}

export default BookDetails
