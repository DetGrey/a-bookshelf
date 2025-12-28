import * as cheerio from "cheerio"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      throw new Error('No URL provided')
    }

    // 2. Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch site')
    
    const html = await response.text()
    const $ = cheerio.load(html)

    // 3. Extract Info
    
    // -- Title --
    // Try OG tag first, fallback to the H3 header found in your HTML
    let title = $('meta[property="og:title"]').attr('content') || 
                $('h3.font-bold a').first().text().trim() || 
                $('title').text().trim()

    // -- Description --
    // The HTML uses a specific class for the summary
    let description = $('.limit-html-p').text().trim() || 
                      $('meta[property="og:description"]').attr('content') || 
                      ''

    // -- Cover Image --
    // Try OG image, fallback to the specific image container class
    let image = $('meta[property="og:image"]').attr('content')
    if (!image) {
      // Find the image inside the flex container (w-24 md:w-52)
      const imgSrc = $('div.w-24 img').attr('src')
      if (imgSrc) {
        // Fix relative URLs if necessary
        image = imgSrc.startsWith('http') ? imgSrc : `https://bato.ing${imgSrc}`
      }
    }

    // -- Genres --
    // Logic: Find the "Genres:" bold text, then get all spans in that same container
    const genres: string[] = []
    const genreLabel = $('b:contains("Genres:")')
    if (genreLabel.length) {
      // The spans are siblings of the bold tag
      genreLabel.parent().find('span').each((_: any, el: any) => {
        const text = $(el).text().trim()
        // Filter out commas and empty strings
        if (text && text !== ',') {
          genres.push(text)
        }
      })
    }

    // -- Original Language --
    // Logic: Look for "Tr From" and get the text following it
    let original_language = 'Unknown'
    const trFromEl = $('span:contains("Tr From")')
    if (trFromEl.length) {
      // The language name (e.g. "Korean") is usually in a span sibling
      // structure: <span>Tr From</span> <span>Flag</span> <span>Language</span>
      const langText = trFromEl.nextAll('span').last().text().trim()
      if (langText) original_language = langText
    }

    // -- Latest Chapter & Upload Date --
    let latest_chapter = 'Unknown'
    let last_uploaded_at = null

    // Find the chapter list container
    const chapterList = $('.group.flex.flex-col').first()
    if (chapterList.length) {
      // Get the first row (latest chapter)
      const firstRow = chapterList.children().first()
      
      // Extract Chapter Name
      const chapterLink = firstRow.find('a.link-hover').first()
      if (chapterLink.length) {
        latest_chapter = chapterLink.text().trim()
      }

      // Extract Timestamp
      // Your HTML uses <time data-time="1766802134723">
      const timeTag = firstRow.find('time')
      const timestamp = timeTag.attr('data-time')
      
      if (timestamp) {
        // Convert milliseconds timestamp to ISO string
        last_uploaded_at = new Date(parseInt(timestamp)).toISOString()
      }
    }

    // 4. Return JSON
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