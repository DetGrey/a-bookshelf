import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { usePageTitle } from '../lib/usePageTitle.js'

/**
 * TEMPORARY ADMIN PAGE
 * One-time backfill of chapter_count for existing books
 * DELETE THIS FILE AFTER RUNNING ONCE
 */
function AdminBackfill() {
  usePageTitle('Admin Backfill')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState([])
  const [summary, setSummary] = useState('')

  const handleBackfill = async () => {
    setRunning(true)
    setProgress({ current: 0, total: 0 })
    setResults([])
    setSummary('')

    try {
      // Fetch ALL books (admin query, no RLS filter)
      const { data: allBooks, error: fetchError } = await supabase
        .from('books')
        .select('id, title, chapter_count, book_links(url)')
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const booksToUpdate = allBooks.filter(
        (b) => !b.chapter_count && b.book_links?.length > 0
      )

      setProgress({ current: 0, total: booksToUpdate.length })

      if (booksToUpdate.length === 0) {
        setSummary('No books need chapter count backfill.')
        setRunning(false)
        return
      }

      let updated = 0
      let skipped = 0
      let errors = 0
      const resultLog = []

      // Process in batches to avoid rate limits
      const batchSize = 3
      const delayMs = 1000

      for (let i = 0; i < booksToUpdate.length; i += batchSize) {
        const batch = booksToUpdate.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (book) => {
            const url = book.book_links[0]?.url
            if (!url) {
              skipped++
              resultLog.push({ title: book.title, status: 'skipped', reason: 'No URL' })
              return
            }

            try {
              const { data: payload, error: fnError } = await supabase.functions.invoke(
                'fetch-metadata',
                { body: { url } }
              )

              if (fnError || payload?.error) {
                errors++
                resultLog.push({
                  title: book.title,
                  status: 'error',
                  reason: payload?.error || fnError?.message || 'Unknown',
                })
                return
              }

              const chapterCount = payload?.metadata?.chapter_count
              if (chapterCount && chapterCount > 0) {
                const { error: updateError } = await supabase
                  .from('books')
                  .update({ chapter_count: chapterCount })
                  .eq('id', book.id)

                if (updateError) {
                  errors++
                  resultLog.push({
                    title: book.title,
                    status: 'error',
                    reason: updateError.message,
                  })
                } else {
                  updated++
                  resultLog.push({
                    title: book.title,
                    status: 'updated',
                    chapterCount,
                  })
                }
              } else {
                skipped++
                resultLog.push({
                  title: book.title,
                  status: 'skipped',
                  reason: 'No chapter count in metadata',
                })
              }
            } catch (err) {
              errors++
              resultLog.push({
                title: book.title,
                status: 'error',
                reason: err.message,
              })
            }
          })
        )

        setProgress({ current: Math.min(booksToUpdate.length, i + batch.length), total: booksToUpdate.length })

        // Throttle between batches
        if (i + batchSize < booksToUpdate.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }

      setResults(resultLog)
      setSummary(
        `Processed ${booksToUpdate.length} books: ${updated} updated, ${skipped} skipped, ${errors} errors.`
      )
    } catch (err) {
      setSummary(`Fatal error: ${err.message}`)
    } finally {
      setRunning(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin Tool</p>
          <h1>Backfill Chapter Counts</h1>
          <p className="muted">
            One-time operation to fetch chapter counts for existing books. Delete this page after
            running.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="stack">
          <button
            className="primary"
            onClick={handleBackfill}
            disabled={running}
            style={{ width: '100%' }}
          >
            {running ? 'Running...' : 'Start Backfill'}
          </button>

          {running && progress.total > 0 && (
            <div>
              <p className="muted">
                Processing {progress.current}/{progress.total} books...
              </p>
              <div
                style={{
                  marginTop: '8px',
                  height: '8px',
                  background: 'var(--panel)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round((progress.current / progress.total) * 100)}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          {summary && (
            <p className={summary.includes('error') ? 'error' : 'success'}>{summary}</p>
          )}

          {results.length > 0 && (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <h3>Results</h3>
              <ul style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                {results.map((r, idx) => (
                  <li key={idx}>
                    <strong>{r.title}</strong> —{' '}
                    {r.status === 'updated' && (
                      <span className="success">Updated (Ch: {r.chapterCount})</span>
                    )}
                    {r.status === 'skipped' && (
                      <span className="muted">Skipped ({r.reason})</span>
                    )}
                    {r.status === 'error' && <span className="error">Error: {r.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="notice" style={{ marginTop: '16px', padding: '12px', background: 'var(--panel)', borderRadius: '12px' }}>
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          ⚠️ <strong>Remember:</strong> Delete this page and route after running once.
        </p>
      </div>
    </div>
  )
}

export default AdminBackfill
