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
    // specific load check to prevent import compatibility issues
    const load = cheerio.load || (cheerio.default && cheerio.default.load);
    const $ = load(html);

    // 3. Extract ONLY Latest Chapter & Upload Date
    let latest_chapter = 'Unknown';
    let last_uploaded_at = null;

    // Target the main chapter list container
    const chapterList = $('.group.flex.flex-col').first();
    
    if (chapterList.length) {
      // The first child is the latest chapter row
      const firstRow = chapterList.children().first();

      // Get Chapter Name
      // Use the specific selector looking for chapter links
      const chapterLink = firstRow.find('a[href*="/chapter/"]').first();
      if (chapterLink.length) {
        latest_chapter = chapterLink.text().trim();
      }

      // Get Upload Date
      // The HTML stores the exact timestamp in the data-time attribute
      const timeTag = firstRow.find('time');
      const timestamp = timeTag.attr('data-time');

      if (timestamp) {
        // Convert the Unix timestamp (ms) to ISO string for Supabase
        last_uploaded_at = new Date(parseInt(timestamp)).toISOString();
      }
    }

    // 4. Return simplified JSON
    return new Response(
      JSON.stringify({
        latest_chapter,
        last_uploaded_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});