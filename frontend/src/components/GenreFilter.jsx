import { useState } from 'react'

/**
 * GenreFilter Component
 * 
 * Displays genre filter pills with toggle and filter mode (any/all)
 * Used in Bookshelf to filter by genres
 */
function GenreFilter({
  allGenres,
  activeGenres,
  onGenreChange,
  genreFilterMode,
  onGenreFilterModeChange,
  isOpen = false,
  onOpenChange,
}) {
  const [isOpenLocal, setIsOpenLocal] = useState(isOpen)
  
  const isControlled = onOpenChange !== undefined
  const open = isControlled ? isOpen : isOpenLocal
  const setOpen = isControlled ? onOpenChange : setIsOpenLocal
  
  if (allGenres.length === 0) {
    return null
  }

  return (
    <div className="block" style={{ marginTop: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <p className="eyebrow" style={{ margin: 0 }}>
          Filter by Genre {open ? '▼' : '▶'}
        </p>
        {activeGenres.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={genreFilterMode === 'any' ? 'pill' : 'pill ghost'}
              onClick={() => onGenreFilterModeChange('any')}
              style={{ cursor: 'pointer', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              Any
            </button>
            <button
              className={genreFilterMode === 'all' ? 'pill' : 'pill ghost'}
              onClick={() => onGenreFilterModeChange('all')}
              style={{ cursor: 'pointer', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              All
            </button>
          </div>
        )}
      </div>
      {open && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {activeGenres.length > 0 && (
          <button
            className="pill"
            onClick={() => onGenreChange([])}
            style={{ cursor: 'pointer', borderRadius: '8px' }}
          >
            ✕ Clear
          </button>
        )}
        {allGenres.map((genre) => {
          const isActive = activeGenres.includes(genre)
          return (
            <button
              key={genre}
              className={isActive ? 'pill' : 'pill ghost'}
              onClick={() => {
                onGenreChange(
                  isActive ? activeGenres.filter((g) => g !== genre) : [...activeGenres, genre]
                )
              }}
              style={{ cursor: 'pointer', borderRadius: '8px' }}
            >
              {genre}
            </button>
          )
        })}
      </div>}
    </div>
  )
}

export default GenreFilter
