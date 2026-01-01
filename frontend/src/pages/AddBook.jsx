import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthProvider.jsx'
import { createBook, addLink, getShelves, toggleBookShelf, STATUS_KEYS, STATUS } from '../lib/db.js'
import BookFormFields from '../components/BookFormFields.jsx'
import MetadataFetcher from '../components/MetadataFetcher.jsx'
import ShelfSelector from '../components/ShelfSelector.jsx'

function AddBook() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [customShelves, setCustomShelves] = useState([])
  const [selectedShelves, setSelectedShelves] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_url: '',
    genres: '',
    original_language: '',
    status: STATUS_KEYS[0],
    last_read: '',
    notes: '',
    latest_chapter: '',
    last_uploaded_at: '',
  })

  // Load custom shelves
  useEffect(() => {
    let mounted = true
    async function loadShelves() {
      if (!user) return
      try {
        const shelves = await getShelves(user.id)
        if (mounted) setCustomShelves(shelves)
      } catch (err) {
        console.error('Failed to load shelves:', err)
      }
    }
    loadShelves()
    return () => {
      mounted = false
    }
  }, [user])

  // Format ISO string to datetime-local format
  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  // Fetch metadata from URL
  const handleFetch = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    setMetadata(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-metadata', {
        body: { url },
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      if (data?.metadata) {
        const m = data.metadata
        setMetadata(m)
        setFetchedAt(new Date())

        setForm((prev) => ({
          ...prev,
          title: m.title || prev.title,
          description: m.description || prev.description,
          cover_url: m.image || prev.cover_url,
          genres: Array.isArray(m.genres) ? m.genres.join(', ') : (m.genres || prev.genres),
          original_language: m.original_language || prev.original_language,
          latest_chapter: m.latest_chapter || prev.latest_chapter,
          last_uploaded_at: formatDatetimeLocal(m.last_uploaded_at) || prev.last_uploaded_at,
        }))
      }
      setSuccess('Metadata fetched. Review or edit fields below, then save.')
    } catch (err) {
      setError(err?.message ?? 'Unable to fetch metadata right now.')
    } finally {
      setLoading(false)
    }
  }

  // Save book to library
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: form.title || 'Untitled',
        description: form.description || '',
        cover_url: form.cover_url || '',
        genres: form.genres
          ? form.genres.split(',').map((g) => g.trim()).filter(Boolean)
          : [],
        original_language: form.original_language || '',
        status: form.status,
        last_read: form.last_read || '',
        notes: form.notes || '',
        latest_chapter: form.latest_chapter || '',
        last_uploaded_at: form.last_uploaded_at || null,
        last_fetched_at: fetchedAt || null,
      }

      const bookId = await createBook(user.id, payload)
      if (url) await addLink(bookId, 'Source', url)

      // Add to selected shelves
      for (const shelfId of selectedShelves) {
        await toggleBookShelf(bookId, shelfId)
      }

      setSuccess('Saved to your library!')
      setTimeout(() => navigate('/bookshelf'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">Smart Add</p>
          <h1>Paste a link, capture the details</h1>
          <p className="muted">
            Connects to the Supabase Edge Function `fetch-metadata` to pull Open Graph data from supported sites.
          </p>
        </div>
      </div>

      <form className="stack" onSubmit={handleFetch}>
        <label className="field">
          <span>Source URL</span>
          <p className="muted">
            Right now it only works with bato pages.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1 }}
              type="url"
              name="url"
              placeholder="https://example.com/volume-12"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Fetching…' : 'Fetch metadata'}
            </button>
          </div>
        </label>

        {error && <p className="error">{error}</p>}
        {metadata && (
          <p className="success">{success || 'Metadata fetched. Fields below were autofilled.'}</p>
        )}
      </form>

      <section className="card" style={{ marginTop: '16px' }}>
        <div className="stack">
          <p className="eyebrow">Book Details</p>
          <BookFormFields form={form} onChange={setForm} />

          <ShelfSelector
            customShelves={customShelves}
            selectedShelves={selectedShelves}
            onToggleShelf={(shelfId) => {
              setSelectedShelves(
                selectedShelves.includes(shelfId)
                  ? selectedShelves.filter((id) => id !== shelfId)
                  : [...selectedShelves, shelfId]
              )
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="ghost" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save to Library'}
            </button>
          </div>
        </div>
      </section>

      {metadata && (
        <section className="card metadata">
          <div className="thumb" style={{ backgroundImage: `url(${metadata.image})` }} />
          <div className="stack">
            <p className="eyebrow">Preview</p>
            <h2>{metadata.title}</h2>
            <p className="muted">{metadata.description}</p>
            <div className="pill-row">
              <span className="pill">{STATUS[form.status]}</span>
              {form.last_read && <span className="pill ghost">Last: {form.last_read}</span>}
            </div>
            {form.genres && (
              <div className="pill-row" style={{ marginTop: '8px' }}>
                {form.genres.split(',').map((g, i) => (
                  <span key={`${g}-${i}`} className="pill ghost">{g.trim()}</span>
                ))}
              </div>
            )}
            <p className="muted">Ready to save to your library.</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default AddBook
