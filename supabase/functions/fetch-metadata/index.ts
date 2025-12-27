// supabase/functions/fetch-metadata/index.ts
import * as cheerio from "cheerio"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS (Allow your frontend to call this)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      throw new Error('No URL provided')
    }

    // 2. Fetch the HTML from the external site
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch site')
    
    const html = await response.text()
    const $ = cheerio.load(html)

    // 3. Extract Standard Data (Open Graph)
    let title = $('meta[property="og:title"]').attr('content') || $('title').text()
    let description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')
    let image = $('meta[property="og:image"]').attr('content')

    // CLEANUP: Remove common suffixes like " - Read Free Manga"
    title = title?.replace(/ - Read Free.*$/, '').trim()

    // 4. Extract "Bato-Specific" Data
    // These selectors work for Bato.ing as of today.
    
    // Genres
    const genres: string[] = []
    $('.attr-item:contains("Genres") span').each((_: number, el: any) => {
      genres.push($(el).text().trim())
    })

    // Original Language (Guessing based on Type)
    let original_language = 'Unknown'
    const typeText = $('.attr-item:contains("Type") span').text().trim().toLowerCase()
    if (typeText.includes('manga')) original_language = 'Japanese'
    if (typeText.includes('manhwa')) original_language = 'Korean'
    if (typeText.includes('manhua')) original_language = 'Chinese'

    // Latest Chapter
    const latestChapterElement = $('.main .item:first-child')
    const latest_chapter = latestChapterElement.find('b').first().text().trim() || 'Unknown'
    
    // Upload Date (Rough approximation)
    // If we found a chapter, we mark "now" as the last upload time for sorting purposes
    const last_uploaded_at = latest_chapter !== 'Unknown' ? new Date().toISOString() : null

    // 5. Return JSON
    return new Response(
      JSON.stringify({
        metadata: {
          title,
          description,
          image,
          genres,
          original_language,
          latest_chapter,
          last_uploaded_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})