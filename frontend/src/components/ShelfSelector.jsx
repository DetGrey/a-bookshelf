/**
 * ShelfSelector Component
 * 
 * Allows users to select custom shelves for a book
 * Used in AddBook when adding a new book
 */
function ShelfSelector({ customShelves, selectedShelves, onToggleShelf }) {
  if (customShelves.length === 0) {
    return null
  }

  return (
    <label className="field">
      <span>Add to Shelves (optional)</span>
      <div className="pill-row" style={{ marginTop: '4px' }}>
        {customShelves.map((shelf) => {
          const isSelected = selectedShelves.includes(shelf.id)
          return (
            <button
              key={shelf.id}
              type="button"
              className={isSelected ? 'pill' : 'pill ghost'}
              onClick={() => onToggleShelf(shelf.id)}
              style={{ cursor: 'pointer' }}
            >
              {isSelected ? '✓ ' : ''}{shelf.name}
            </button>
          )
        })}
      </div>
    </label>
  )
}

export default ShelfSelector
