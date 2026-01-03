/**
 * ChapterCountFilter Component
 * 
 * Filter books by chapter count with predefined ranges
 * Supports min/max filtering
 */
function ChapterCountFilter({ 
  chapterFilter, 
  onChapterFilterChange, 
  isOpen, 
  onOpenChange 
}) {
  const presetOptions = [
    { value: 10, label: '10 chapters' },
    { value: 20, label: '20 chapters' },
    { value: 50, label: '50 chapters' },
    { value: 100, label: '100 chapters' },
    { value: 200, label: '200 chapters' },
  ]

  const handlePresetClick = (value) => {
    if (chapterFilter.value === value) {
      // Toggle off if already selected
      onChapterFilterChange({ mode: 'all', value: null })
    } else {
      // Set new value, keep existing mode or default to 'max'
      onChapterFilterChange({ 
        mode: chapterFilter.mode || 'max', 
        value 
      })
    }
  }

  const handleModeChange = (newMode) => {
    if (chapterFilter.value !== null) {
      onChapterFilterChange({ mode: newMode, value: chapterFilter.value })
    }
  }

  const handleClear = () => {
    onChapterFilterChange({ mode: 'all', value: null })
    onOpenChange(false)
  }

  const activeCount = chapterFilter.value !== null ? 1 : 0

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
        onClick={() => onOpenChange(!isOpen)}
      >
        <p className="eyebrow" style={{ margin: 0 }}>
          Filter by Chapter Count {isOpen ? '▼' : '▶'}
        </p>
        {chapterFilter.value !== null && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={chapterFilter.mode === 'max' ? 'pill' : 'pill ghost'}
              onClick={(e) => {
                e.stopPropagation()
                handleModeChange('max')
              }}
              style={{ cursor: 'pointer', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              Max
            </button>
            <button
              className={chapterFilter.mode === 'min' ? 'pill' : 'pill ghost'}
              onClick={(e) => {
                e.stopPropagation()
                handleModeChange('min')
              }}
              style={{ cursor: 'pointer', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              Min
            </button>
          </div>
        )}
      </div>
      {isOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {activeCount > 0 && (
            <button
              className="pill"
              onClick={handleClear}
              style={{ cursor: 'pointer', borderRadius: '8px' }}
            >
              ✕ Clear
            </button>
          )}
          {presetOptions.map((option) => {
            const isActive = chapterFilter.value === option.value
            return (
              <button
                key={option.value}
                className={isActive ? 'pill' : 'pill ghost'}
                onClick={() => handlePresetClick(option.value)}
                style={{ cursor: 'pointer', borderRadius: '8px' }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChapterCountFilter
