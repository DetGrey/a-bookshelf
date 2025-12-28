import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthProvider.jsx'
import { createBook, addLink, STATUS, STATUS_KEYS } from '../lib/db.js'

function AddBook() {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_url: '',
    genres: '', // comma-separated input; convert to array on save
    original_language: '',
    status: STATUS_KEYS[0],
    last_read: '',
    notes: '',
    latest_chapter: '',
    last_uploaded_at: '', // ISO string or empty
  })

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

      // SUCCESS: Auto-fill the form
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
          last_uploaded_at: m.last_uploaded_at || prev.last_uploaded_at,
        }))
      }
      setSuccess('Metadata fetched. Review or edit fields below, then save.')
    } catch (err) {
      setError(err?.message ?? 'Unable to fetch metadata right now.')
    } finally {
      setLoading(false)
    }
  }

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
      setSuccess('Saved to your library!')
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
          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {STATUS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Last Read</span>
              <input
                type="text"
                placeholder="Ch 50"
                value={form.last_read}
                onChange={(e) => setForm({ ...form, last_read: e.target.value })}
              />
            </label>
          </div>

          <div className="grid-2">
            <label className="field">
              <span>Cover Image URL</span>
              <input
                type="url"
                placeholder="https://..."
                value={form.cover_url}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Original Language</span>
              <input
                type="text"
                placeholder="Japanese, Korean, English..."
                value={form.original_language}
                onChange={(e) => setForm({ ...form, original_language: e.target.value })}
              />
            </label>
          </div>

          <div className="grid-2">
            <label className="field">
              <span>Genres</span>
              <input
                type="text"
                placeholder="Action, Romance, Fantasy"
                value={form.genres}
                onChange={(e) => setForm({ ...form, genres: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Latest Chapter (site)</span>
              <input
                type="text"
                value={form.latest_chapter}
                onChange={(e) => setForm({ ...form, latest_chapter: e.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Last Uploaded At (site)</span>
            <input
              type="datetime-local"
              value={form.last_uploaded_at || ''}
              onChange={(e) => setForm({ ...form, last_uploaded_at: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows="3"
              placeholder="What to remember next time you open this link..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

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
