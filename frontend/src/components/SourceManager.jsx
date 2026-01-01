/**
 * SourceManager Component
 * 
 * Manages book source/link display and editing
 * Used in AddBook and BookDetails
 */
function SourceManager({
  sources,
  onRemoveSource,
  newSourceLabel,
  onSourceLabelChange,
  newSourceUrl,
  onSourceUrlChange,
  onAddSource,
  isEditing = false,
  compact = false,
}) {
  if (!isEditing && sources.length === 0) {
    return null
  }

  return (
    <>
      <h3>Source Links</h3>
      <div className="source-grid">
        {sources.map((source, index) =>
          isEditing ? (
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
                onClick={() => onRemoveSource(index)}
              >
                Remove
              </button>
            </div>
          ) : (
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
          )
        )}
      </div>

      {isEditing && (
        <form className="stack" onSubmit={onAddSource}>
          <p className="eyebrow">Add New Source</p>
          <div className="grid-2">
            <label className="field">
              <span>Label</span>
              <input
                type="text"
                value={newSourceLabel}
                onChange={(e) => onSourceLabelChange(e.target.value)}
                placeholder="Official, Scanlation A..."
              />
            </label>
            <label className="field">
              <span>URL</span>
              <input
                type="url"
                value={newSourceUrl}
                onChange={(e) => onSourceUrlChange(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
          <button type="submit" className="ghost">
            + Add Source
          </button>
        </form>
      )}
    </>
  )
}

export default SourceManager
