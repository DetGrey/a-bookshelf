import { useState } from 'react'

/**
 * ShelfSidebar Component
 * 
 * Left sidebar for the Bookshelf page displaying:
 * - Status-based shelves with book counts
 * - Custom user shelves with delete capability
 * - Form to create new shelves
 */
function ShelfSidebar({
  statusShelves,
  customShelves,
  activeShelf,
  onShelfChange,
  onDeleteShelf,
  onCreateShelf,
  getShelfCount,
}) {
  const [showNewShelfForm, setShowNewShelfForm] = useState(false)
  const [newShelfName, setNewShelfName] = useState('')
  const [statusOpen, setStatusOpen] = useState(true)
  const [customOpen, setCustomOpen] = useState(false)

  const handleCreateShelf = async (e) => {
    e.preventDefault()
    if (newShelfName.trim()) {
      await onCreateShelf(newShelfName.trim())
      setNewShelfName('')
      setShowNewShelfForm(false)
    }
  }

  return (
    <aside className="shelf-sidebar">
      {/* Status shelves */}
      <div className="block">
        <div className="block-head" style={{ cursor: 'pointer' }} onClick={() => setStatusOpen(!statusOpen)}>
          <p className="eyebrow">Status {statusOpen ? '▼' : '▶'}</p>
        </div>
        {statusOpen && <nav className="shelf-list">
          {statusShelves.map((shelf) => {
            const count = getShelfCount(shelf.id)
            return (
              <button
                key={shelf.id}
                className={`shelf-item ${activeShelf === shelf.id ? 'active' : ''}`}
                onClick={() => onShelfChange(shelf.id)}
              >
                <div>
                  <span>{shelf.name}</span>
                  <span className="shelf-count">{count}</span>
                </div>
              </button>
            )
          })}
        </nav>}
      </div>

      {/* Custom shelves */}
      <div className="block" style={{ marginTop: '16px' }}>
        <div className="block-head" style={{ cursor: 'pointer' }} onClick={() => setCustomOpen(!customOpen)}>
          <p className="eyebrow">Custom Shelves {customOpen ? '▼' : '▶'}</p>
          <button
            className="ghost"
            style={{ fontSize: '0.85rem', padding: '6px 10px' }}
            onClick={(e) => {
              e.stopPropagation()
              setShowNewShelfForm(!showNewShelfForm)
            }}
          >
            + New
          </button>
        </div>
        {customOpen && <nav className="shelf-list">
          {customShelves.map((shelf) => {
            const count = getShelfCount(shelf.id)
            return (
              <div key={shelf.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  className={`shelf-item ${activeShelf === shelf.id ? 'active' : ''}`}
                  onClick={() => onShelfChange(shelf.id)}
                  style={{ flex: 1 }}
                >
                  <div>
                    <span>{shelf.name}</span>
                    <span className="shelf-count">{count}</span>
                  </div>
                </button>
                <button
                  className="shelf-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteShelf(shelf.id)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </nav>}

        {customOpen && showNewShelfForm && (
          <form className="stack" onSubmit={handleCreateShelf}>
            <label className="field">
              <span>Shelf name</span>
              <input
                type="text"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="Favorites, To Buy..."
                autoFocus
              />
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="primary" style={{ fontSize: '0.85rem' }}>
                Create
              </button>
              <button
                type="button"
                className="ghost"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setShowNewShelfForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </aside>
  )
}

export default ShelfSidebar
