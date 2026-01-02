import { supabase } from './supabaseClient.js'

// Helpers for status mapping (DB uses lowercase snake_case)
export const STATUS = {
  reading: 'Reading',
  plan_to_read: 'Plan to Read',
  waiting: 'Waiting',
  completed: 'Completed',
  dropped: 'Dropped',
  on_hold: 'On Hold',
}
export const STATUS_KEYS = Object.keys(STATUS)

export const SCORE_OPTIONS = [
  { value: 10, label: '10 — Masterpiece' },
  { value: 9, label: '9 — Great' },
  { value: 8, label: '8 — Pretty Good' },
  { value: 7, label: '7 — Good' },
  { value: 6, label: '6 — Fine' },
  { value: 5, label: '5 — Average' },
  { value: 4, label: '4 — Bad' },
  { value: 3, label: '3 — Pretty Bad' },
  { value: 2, label: '2 — Horrible' },
  { value: 1, label: '1 — Appalling' },
  { value: 0, label: '0 — N/A' },
]

export function scoreToLabel(score) {
  if (score === null || score === undefined) return null
  const option = SCORE_OPTIONS.find((o) => o.value === Number(score))
  return option ? option.label : null
}

// Helper to truncate text to first N words
export function truncateText(text, maxWords = 15) {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...'
  }
  return text
}

export async function getBooks(userId) {
  const { data, error } = await supabase
    .from('books')
    .select(
      'id,user_id,title,description,cover_url,genres,original_language,score,status,last_read,notes,latest_chapter,last_fetched_at,last_uploaded_at,created_at,updated_at,book_links(id,site_name,url,created_at),shelf_books(shelf_id)'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((b) => ({
    id: b.id,
    user_id: b.user_id,
    title: b.title,
    description: b.description ?? '',
    cover_url: b.cover_url ?? '',
    genres: b.genres ?? [],
    original_language: b.original_language ?? '',
    score: b.score ?? null,
    status: b.status, // lowercase key
    last_read: b.last_read ?? '',
    notes: b.notes ?? '',
    latest_chapter: b.latest_chapter ?? '',
    last_fetched_at: b.last_fetched_at ?? null,
    last_uploaded_at: b.last_uploaded_at ?? null,
    created_at: b.created_at,
    updated_at: b.updated_at,
    sources: (b.book_links ?? []).map((l) => ({ id: l.id, label: l.site_name ?? 'Source', url: l.url })),
    shelves: (b.shelf_books ?? []).map((s) => s.shelf_id),
  }))
}

export async function getBook(bookId) {
  const { data, error } = await supabase
    .from('books')
    .select(
      'id,user_id,title,description,cover_url,genres,original_language,score,status,last_read,notes,latest_chapter,last_fetched_at,last_uploaded_at,created_at,updated_at,book_links(id,site_name,url,created_at),shelf_books(shelf_id)'
    )
    .eq('id', bookId)
    .single()
  if (error) throw error
  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description ?? '',
    cover_url: data.cover_url ?? '',
    genres: data.genres ?? [],
    original_language: data.original_language ?? '',
    score: data.score ?? null,
    status: data.status,
    last_read: data.last_read ?? '',
    notes: data.notes ?? '',
    latest_chapter: data.latest_chapter ?? '',
    last_fetched_at: data.last_fetched_at ?? null,
    last_uploaded_at: data.last_uploaded_at ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    sources: (data.book_links ?? []).map((l) => ({ id: l.id, label: l.site_name ?? 'Source', url: l.url })),
    shelves: (data.shelf_books ?? []).map((s) => s.shelf_id),
  }
}

export async function updateBook(bookId, patch) {
  const payload = {
    title: patch.title,
    description: patch.description,
    cover_url: patch.cover_url,
    genres: patch.genres,
    original_language: patch.original_language,
    score: patch.score,
    status: patch.status, // expect lowercase key
    last_read: patch.last_read,
    notes: patch.notes,
    latest_chapter: patch.latest_chapter,
    last_fetched_at: patch.last_fetched_at,
    last_uploaded_at: patch.last_uploaded_at,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('books').update(payload).eq('id', bookId)
  if (error) throw error
}

export async function createBook(userId, book) {
  const payload = {
    user_id: userId,
    title: book.title,
    description: book.description ?? '',
    cover_url: book.cover_url ?? book.image ?? '',
    genres: book.genres ?? [],
    original_language: book.original_language ?? '',
    score: book.score ?? null,
    status: book.status ?? 'reading',
    last_read: book.last_read ?? '',
    notes: book.notes ?? '',
    latest_chapter: book.latest_chapter ?? '',
    last_fetched_at: book.last_fetched_at ?? null,
    last_uploaded_at: book.last_uploaded_at ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('books').insert(payload).select('id').single()
  if (error) throw error
  return data?.id
}

export async function deleteBook(bookId) {
  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) throw error
}

export async function addLink(bookId, siteName, url) {
  const { error } = await supabase.from('book_links').insert({ book_id: bookId, site_name: siteName, url })
  if (error) throw error
}

export async function deleteLink(linkId) {
  const { error } = await supabase.from('book_links').delete().eq('id', linkId)
  if (error) throw error
}

export async function getShelves(userId) {
  const { data, error } = await supabase
    .from('shelves')
    .select('id,name,created_at')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createShelf(userId, name) {
  const { data, error } = await supabase
    .from('shelves')
    .insert({ user_id: userId, name })
    .select('id,name,created_at')
    .single()
  if (error) throw error
  return data
}

export async function deleteShelf(shelfId) {
  const { error } = await supabase.from('shelves').delete().eq('id', shelfId)
  if (error) throw error
}

export async function getBookShelvesForBooks(bookIds) {
  if (!bookIds?.length) return []
  const { data, error } = await supabase
    .from('shelf_books')
    .select('book_id,shelf_id')
    .in('book_id', bookIds)
  if (error) throw error
  return data ?? []
}

export async function toggleBookShelf(bookId, shelfId) {
  const { data, error } = await supabase
    .from('shelf_books')
    .select('book_id,shelf_id')
    .eq('book_id', bookId)
    .eq('shelf_id', shelfId)
    .maybeSingle()
  if (error) throw error
  if (data) {
    const { error: delErr } = await supabase
      .from('shelf_books')
      .delete()
      .eq('book_id', bookId)
      .eq('shelf_id', shelfId)
    if (delErr) throw delErr
    return { added: false }
  }
  const { error: insErr } = await supabase.from('shelf_books').insert({ book_id: bookId, shelf_id: shelfId })
  if (insErr) throw insErr
  return { added: true }
}