import CoverImage from './CoverImage.jsx'

/**
 * MetadataFetcher Component
 * 
 * Handles fetching metadata from URLs with preview
 * Used in AddBook and BookDetails edit mode
 */
function MetadataFetcher({
  fetchUrl,
  onFetchUrlChange,
  onFetch,
  loading,
  error,
  success,
  fetchedMetadata,
  onApply,
  compact = false,
}) {
  return (
    <section className={compact ? undefined : 'card'} style={compact ? { marginBottom: '16px' } : { marginBottom: '16px' }}>
      <p className="eyebrow">Fetch Metadata</p>
      <form onSubmit={onFetch} className="stack">
        <label className="field">
          <span>Source URL</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1 }}
              type="url"
              value={fetchUrl}
              onChange={(e) => onFetchUrlChange(e.target.value)}
              placeholder="https://example.com/title-page"
              autoComplete="off"
            />
            <button
              type="submit"
              className={compact ? 'ghost' : 'primary'}
              disabled={loading}
            >
              {loading ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      {fetchedMetadata && (
          <div className="metadata-preview" style={{ marginTop: '8px' }}>
            <CoverImage className="thumb" src={fetchedMetadata.image} title={fetchedMetadata.title} />
          <div className="stack">
            <strong>{fetchedMetadata.title}</strong>
            <p className="muted" style={{ margin: 0 }}>
              {fetchedMetadata.description}
            </p>
            {fetchedMetadata.genres?.length > 0 && (
              <div className="pill-row" style={{ marginTop: '8px' }}>
                {fetchedMetadata.genres.map((g, i) => (
                  <span key={`${g}-${i}`} className="pill ghost">
                    {g}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="ghost" onClick={onApply}>
                Apply to fields
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default MetadataFetcher
