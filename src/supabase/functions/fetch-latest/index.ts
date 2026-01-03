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

    if (!response.ok) throw new Error(`Failed to fetch site: ${response.status} ${response.statusText}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // 3. Determine website and extract accordingly
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    let latest_chapter = '';
    let last_uploaded_at: string | null = null;

    // --------------------------------------------- WEBTOONS
    if (hostname === 'www.webtoons.com') {
      const latestEpisode = $('ul#_listUl li._episodeItem').first();
      if (latestEpisode.length) {
        const episodeText = latestEpisode.find('span.subj span, span.subj').first().text().trim();
        if (episodeText) {
          latest_chapter = episodeText;
        }

        // -- Upload Date: Add +1 Day Hack --
        const dateText = latestEpisode.find('span.date').text().trim();
        if (dateText) {
          try {
            const parts = dateText.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
            if (parts) {
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
              const monthIndex = monthNames.findIndex((m) => m.toLowerCase().startsWith(parts[1].toLowerCase()));
              
              if (monthIndex !== -1) {
                const day = parseInt(parts[2], 10);
                const year = parseInt(parts[3], 10);

                // 1. Create the date object in UTC
                const dateObj = new Date(Date.UTC(year, monthIndex, day));

                // 2. Add +1 Day (The Hack)
                // This pushes "Jan 1" to "Jan 2". 
                // When your frontend subtracts hours for your timezone, "Jan 2" rolls back to "Jan 1".
                dateObj.setUTCDate(dateObj.getUTCDate() + 1);

                // 3. Set to Noon UTC for maximum stability
                dateObj.setUTCHours(12, 0, 0, 0);

                last_uploaded_at = dateObj.toISOString();
              }
            }
          } catch {
            // Date parsing failed, skip
          }
        }
      }
    }
    // --------------------------------------------- BATO.SI / BATO.ING
    else if (hostname === 'bato.ing' || hostname === 'bato.si') {
      const chapterList = $('.group.flex.flex-col').first();

      if (chapterList.length) {
        const firstRow = chapterList.children().first();

        // 1. Get Chapter Name
        const chapterLink = firstRow.find('a.link-hover').first();
        if (chapterLink.length) {
          latest_chapter = chapterLink.text().trim();
        }

        // 2. Get Upload Date - check time attribute first (ISO format), then data-time
        const timeTag = firstRow.find('time').first();
        const ts = timeTag.attr('time') || timeTag.attr('data-time') || timeTag.attr('datetime');

        if (ts) {
          const millis = Number(ts);
          if (!Number.isNaN(millis)) {
            last_uploaded_at = new Date(millis).toISOString();
          } else {
            const iso = new Date(ts);
            if (!Number.isNaN(iso.getTime())) {
              last_uploaded_at = iso.toISOString();
            }
          }
        }
      }
    }
    // --------------------------------------------- DEFAULT (BATO V3 STYLE)
    else {
      // Find all chapter links (include side stories/creator notes) and pick the newest by timestamp
      const chapterCandidates = $('[name="chapter-list"] a, .scrollable-panel a')
        .filter((_: any, el: any) => {
          const text = $(el).text().trim();
          const href = $(el).attr('href') || '';
          // Must have text and look like a title link (avoid nav/utility links)
          return text.length > 0 && /\/title\//.test(href);
        })
        .toArray();

      let best = { text: '', ts: -Infinity } as { text: string; ts: number };

      chapterCandidates.forEach((el: any) => {
        const $el = $(el);
        const row = $el.closest('div');
        const timeTag = row.find('time').first();
        // Prefer explicit attributes: time (epoch ms), data-time, then datetime/ISO
        const tsAttr = timeTag.attr('time') || timeTag.attr('data-time') || timeTag.attr('datetime');
        let tsNum = Number.NEGATIVE_INFINITY;
        if (tsAttr) {
          const maybeNum = Number(tsAttr);
          if (!Number.isNaN(maybeNum)) {
            tsNum = maybeNum;
          } else {
            const d = new Date(tsAttr);
            if (!Number.isNaN(d.getTime())) tsNum = d.getTime();
          }
        }

        if (tsNum > best.ts) {
          best = { text: $el.text().trim(), ts: tsNum };
        }
      });

      if (best.text) {
        latest_chapter = best.text;
      } else if (chapterCandidates.length) {
        // If no timestamps, take the last link (often the newest in reversed lists)
        const lastLink = chapterCandidates[chapterCandidates.length - 1];
        latest_chapter = $(lastLink).text().trim();
      }

      // -- Upload Date --
      if (best.ts !== -Infinity) {
        last_uploaded_at = new Date(best.ts).toISOString();
      } else {
        // Fallback: try any time tag
        const timeTag = $('[name="chapter-list"] time, .scrollable-panel time, time').last();
        if (timeTag.length) {
          const ts = timeTag.attr('time') || timeTag.attr('data-time') || timeTag.attr('datetime');
          if (ts) {
            const millis = Number(ts);
            if (!Number.isNaN(millis)) {
              last_uploaded_at = new Date(millis).toISOString();
            } else {
              const iso = new Date(ts);
              if (!Number.isNaN(iso.getTime())) last_uploaded_at = iso.toISOString();
            }
          }
        }
      }
    }

    // 4. Return JSON
    return new Response(
      JSON.stringify({
        latest_chapter,
        last_uploaded_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});