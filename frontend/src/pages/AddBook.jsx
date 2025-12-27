import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthProvider.jsx'
import { createBook, addLink, STATUS, STATUS_KEYS } from '../lib/db.js'

function AddBook() {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(STATUS_KEYS[0])
  const [chapter, setChapter] = useState('')
  const [notes, setNotes] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFetch = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-metadata', {
        body: { url },
      })

      if (fnError) throw fnError

      // Fallback to demo metadata if the function is not configured yet
      const fallback = {
        title: 'Metadata demo title',
        description: 'Connect your Supabase Edge Function to return real data.',
        image:
          'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80',
      }

      setMetadata(data?.metadata ?? fallback)
      setSuccess('Metadata fetched. You can now save this entry to the database when ready.')
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
      const bookId = await createBook(user.id, {
        title: metadata?.title ?? 'Untitled',
        description: metadata?.description ?? '',
        cover_url: metadata?.image ?? '',
        status,
        last_read: chapter,
        notes,
      })
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
          <input
            type="url"
            name="url"
            placeholder="https://example.com/volume-12"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </label>

        <div className="grid-2">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STATUS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Last chapter read</span>
            <input
              type="text"
              name="chapter"
              placeholder="Chapter 12"
              value={chapter}
              onChange={(event) => setChapter(event.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea
            name="notes"
            rows="3"
            placeholder="What to remember next time you open this link..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Fetching metadata...' : 'Fetch metadata'}
          </button>
          <button type="button" className="ghost" disabled={!metadata || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save to Library'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      {metadata && (
        <section className="card metadata">
          <div className="thumb" style={{ backgroundImage: `url(${metadata.image})` }} />
          <div className="stack">
            <p className="eyebrow">Preview</p>
            <h2>{metadata.title}</h2>
            <p className="muted">{metadata.description}</p>
            <div className="pill-row">
              <span className="pill">{STATUS[status]}</span>
              {chapter && <span className="pill ghost">Last: {chapter}</span>}
            </div>
            <p className="muted">Ready to save to your library.</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default AddBook
