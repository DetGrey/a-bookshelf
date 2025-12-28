import * as cheerio from "cheerio";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error('No URL provided');

    // 2. Fetch HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch site: ${response.statusText}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // 3. Extract Info

    // -- Title --
    const title = $('h3.font-bold a').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Unknown Title';

    // -- Description --
    const description = $('.limit-html-p').text().trim() || 
                        $('meta[property="og:description"]').attr('content') || 
                        '';

    // -- Cover Image (Fix Relative URL) --
    let image = $('meta[property="og:image"]').attr('content');
    if (!image) {
      // Fallback to finding the specific image tag
      const imgSrc = $('div.w-24 img').attr('src'); // Based on your HTML structure
      if (imgSrc) {
        image = imgSrc;
      }
    }
    // If we have an image string but it starts with '/', prepend domain
    if (image && image.startsWith('/')) {
      image = `https://bato.ing${image}`;
    }

    // -- Genres (Fix Duplicates) --
    const genresSet = new Set<string>();
    const genreLabel = $('b:contains("Genres:")');
    
    if (genreLabel.length) {
      // We target ONLY the span with class "whitespace-nowrap" inside the container.
      // This ignores the outer wrapper span and the comma span.
      genreLabel.parent().find('span.whitespace-nowrap').each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text) genresSet.add(text);
      });
    }
    const genres = Array.from(genresSet);

    // -- Original Language --
    // Logic: Look for "Tr From" and get the text following it
    let original_language = ''
    const trFromEl = $('span:contains("Tr From")')
    const langText = trFromEl.nextAll('span').last().text().trim()
    if (langText) original_language = langText

    // -- Latest Chapter & Upload Date --
    let latest_chapter = 'Unknown';
    let last_uploaded_at = null;

    // Target the main chapter list container
    const chapterList = $('.group.flex.flex-col').first();
    
    if (chapterList.length) {
      // The first child is the latest chapter row
      const firstRow = chapterList.children().first();

      // 1. Get Chapter Name
      const chapterLink = firstRow.find('a.link-hover').first()
      if (chapterLink.length) {
        latest_chapter = chapterLink.text().trim();
      }

      // 2. Get Upload Date
      // Your HTML has <time data-time="..."> inside the row
      const timeTag = firstRow.find('time'); // Looks for any <time> tag in that row
      const timestamp = timeTag.attr('data-time');

      if (timestamp) {
        // Convert the Unix timestamp (ms) to ISO string
        last_uploaded_at = new Date(parseInt(timestamp)).toISOString();
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
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});