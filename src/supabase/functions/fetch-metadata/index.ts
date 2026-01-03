import * as cheerio from "cheerio";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'x-error-stage, x-error-message',
};

const normalizeLanguageName = (value: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const key = trimmed.toLowerCase().replace(/[_-]/g, '')

  const map: Record<string, string> = {
    en: 'English', enus: 'English', eng: 'English',
    es: 'Spanish', esp: 'Spanish', spa: 'Spanish',
    ja: 'Japanese', jp: 'Japanese', jpn: 'Japanese',
    ko: 'Korean', kr: 'Korean', kor: 'Korean',
    zh: 'Chinese', chi: 'Chinese', cn: 'Chinese', zhtw: 'Chinese', zhcn: 'Chinese',
    fr: 'French', fra: 'French', fre: 'French',
    de: 'German', deu: 'German', ger: 'German',
    it: 'Italian', ita: 'Italian',
    pt: 'Portuguese', prt: 'Portuguese', ptbr: 'Portuguese',
    ru: 'Russian', rus: 'Russian',
    vi: 'Vietnamese', vie: 'Vietnamese',
    id: 'Indonesian', ind: 'Indonesian',
    th: 'Thai', tha: 'Thai',
  }

  if (map[key]) return map[key]
  // If value is a short code (2-3 letters) we prefer not to surface it; return null to allow fallbacks
  if (/^[a-z]{2,3}$/i.test(key)) return null
  return trimmed
}



Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let stage = 'init';

  try {
    stage = 'parse_body';
    const { url } = await req.json();
    if (!url) throw new Error('No URL provided');

    // 2. Fetch HTML
    stage = 'fetch';
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });

    // Special handling: if dto.to returns 404, try bato.ing instead
    if (!response.ok && response.status === 404 && hostname === 'dto.to') {
      const fallbackUrl = url.replace('dto.to', 'bato.ing');
      response = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });
      // Update hostname to use bato.ing parser if fallback succeeded
      if (response.ok) {
        hostname = 'bato.ing';
      }
    }

    if (!response.ok) throw new Error(`Failed to fetch site: ${response.status} ${response.statusText}`);

    stage = 'load_html';
    const html = await response.text();
    const $ = cheerio.load(html);

    // 3. Determine website and extract metadata accordingly
    stage = 'select_parser';

    let metadata: any = {
      title: '',
      description: '',
      image: '',
      genres: [],
      language: null,
      original_language: null,
      latest_chapter: '',
      last_uploaded_at: null
    };

    // --------------------------------------------- WEBTOONS
    if (hostname.includes('webtoons.com')) {
      stage = 'parse:webtoons';

      // -- Title --
      metadata.title = $('h1.subj').first().text().trim() || 
                       $('meta[property="og:title"]').attr('content') || 
                       '';

      // -- Description --
      metadata.description = $('meta[property="og:description"]').attr('content') || '';

      // -- Cover Image --
      let image = $('meta[property="og:image"]').attr('content');
      if (!image) {
        image = $('div.detail_header span.thmb img').attr('src') || '';
      }
      metadata.image = image;

      // -- Genres --
      let genres: string[] = [];
      const h2Genre = $('div.detail_header h2.genre').first().text().trim();
      if (h2Genre) {
        genres = [h2Genre];
      } else {
        $('div.detail_header p.genre').each((_: any, el: any) => {
          const text = $(el).text().trim();
          const clean = text.replace(/^[\s|\.—–-]+|[\s|\.—–-]+$/g, '').trim();
          if (clean) genres.push(clean);
        });
      }
      metadata.genres = genres;

      // -- Language (Webtoons-specific detection)
      // Webtoons typically doesn't use "Tr From" pattern; check lang/meta attributes
      const htmlLang = normalizeLanguageName($('html').attr('lang') ?? null);
      const ogLocale = normalizeLanguageName($('meta[property="og:locale"]').attr('content') ?? null);
      const metaLang = normalizeLanguageName($('meta[name="language"]').attr('content') ?? null);
      metadata.language = htmlLang || ogLocale || metaLang || null;

      // -- Latest Episode & Date --
      // SUPPORT BOTH DESKTOP (ul#_listUl) AND MOBILE (ul#_episodeList)
      let latestEpisode = $('ul#_listUl li._episodeItem').first();
      if (latestEpisode.length === 0) {
        // Fallback for mobile site structure
        latestEpisode = $('ul#_episodeList li.item').first();
      }

      if (latestEpisode.length) {
        // Desktop uses span.subj, Mobile might use different structure, but usually span.subj exists
        const episodeText = latestEpisode.find('span.subj span, span.subj').first().text().trim();
        if (episodeText) {
          metadata.latest_chapter = episodeText;
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

                metadata.last_uploaded_at = dateObj.toISOString();
              }
            }
          } catch (e) {
            console.log('[Webtoons] Date parsing error:', e);
          }
        }
      }
    }
    // --------------------------------------------- BATO.SI / BATO.ING
    else if (hostname === 'bato.ing' || hostname === 'bato.si') {
      stage = 'parse:bato';
      
      // -- Title --
      metadata.title = $('h3.font-bold a').first().text().trim() || 
                       $('meta[property="og:title"]').attr('content') || 
                       '';

      // -- Description --
      metadata.description = $('.limit-html-p').first().text().trim() || 
                             $('meta[property="og:description"]').attr('content') || 
                             '';

      // -- Cover Image (Fix Relative URL) --
      let image = $('meta[property="og:image"]').attr('content');
      if (!image) {
        // Fallback to finding the specific image tag
        const imgSrc = $('div.w-24 img').attr('src');
        if (imgSrc) {
          image = imgSrc;
        }
      }
      // If we have an image string but it starts with '/', prepend domain
      if (image && image.startsWith('/')) {
        image = `https://${hostname}${image}`;
      }
      metadata.image = image;

      // -- Language (Bato-specific: "Tr From" pattern)
      const trFromLang = $('span:contains("Tr From")').first();
      if (trFromLang.length) {
        // Get the immediate previous sibling and keep going back until we find one with letters
        let prev = trFromLang.prev();
        while (prev.length > 0) {
          const txt = prev.text().trim();
          if (/[A-Za-z]/.test(txt)) {
            // Found a span with letters
            const cleanLang = txt.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
            const normalized = normalizeLanguageName(cleanLang);
            if (normalized) {
              metadata.language = normalized;
            }
            break;
          }
          prev = prev.prev();
        }
      }
      if (!metadata.language) metadata.language = null;

      // -- Genres (Fix Duplicates) --
      const genresSet = new Set<string>();
      const genreLabel = $('b:contains("Genres:")');
      
      if (genreLabel.length) {
        genreLabel.parent().find('span.whitespace-nowrap').each((_: any, el: any) => {
          const text = $(el).text().trim();
          if (text) genresSet.add(text);
        });
      }
      metadata.genres = Array.from(genresSet);

      // -- Original Language --
      const trFromEl = $('span:contains("Tr From")')
      const langText = trFromEl.nextAll('span').last().text().trim()
      if (langText) {
        metadata.original_language = langText
      }

      // -- Latest Chapter & Upload Date --
      const chapterList = $('.group.flex.flex-col').first();
      
      if (chapterList.length) {
        const firstRow = chapterList.children().first();

        // 1. Get Chapter Name
        const chapterLink = firstRow.find('a.link-hover').first()
        if (chapterLink.length) {
          metadata.latest_chapter = chapterLink.text().trim();
        }

        // 2. Get Upload Date
        const timeTag = firstRow.find('time');
        const timestamp = timeTag.attr('data-time');

        if (timestamp) {
          metadata.last_uploaded_at = new Date(parseInt(timestamp)).toISOString();
        }
      }
    // --------------------------------------------- BATO V3 AS DEFAULT
    } else {      
      stage = 'parse:default';
      // Default parsing tailored for Bato v3 style pages

      // -- Title --
      // Prefer the main h3 link title; fall back to OG title
      metadata.title = $('h3 a').first().text().trim() || 
                       $('meta[property="og:title"]').attr('content') || 
                       $('title').first().text().trim() || 
                       '';

      // -- Description --
      metadata.description = $('div.limit-html-p').first().text().trim() || 
                             $('meta[property="og:description"]').attr('content') || 
                             $('meta[name="description"]').attr('content') || 
                             '';

      // -- Cover Image --
      let image = $('meta[property="og:image"]').attr('content');
      if (!image) {
        // Avoid Tailwind breakpoint pseudo-class issues by matching class substring
        image = $('div.w-24 img, div[class*="w-52"] img').first().attr('src') || 
                $('img').first().attr('src') || 
                '';
      }
      if (image && image.startsWith('/')) {
        image = `https://${hostname}${image}`;
      }
      metadata.image = image;

      // -- Genres --
      const genresSet = new Set<string>();
      const genresContainer = $('b:contains("Genres")').parent();
      genresContainer.find('span').each((_: any, el: any) => {
        const raw = $(el).text();
        if (!raw) return;
        const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
        parts.forEach(text => {
          if (!text) return;
          // Skip utility labels
          if (/groups|reviews|comments|latest chapters|random comics|docs/i.test(text)) return;
          // Skip flag/emoji-only spans
          if (/^[^\w]+$/.test(text)) return;
          genresSet.add(text);
        });
      });
      metadata.genres = Array.from(genresSet);

      // -- Language (v3/Default-specific: "Tr From" pattern) --
      const trFromDefault = $('span:contains("Tr From")').first();
      if (trFromDefault.length) {
        // Get the immediate previous sibling and keep going back until we find one with letters
        let prev = trFromDefault.prev();
        while (prev.length > 0) {
          const txt = prev.text().trim();
          if (/[A-Za-z]/.test(txt)) {
            // Found a span with letters
            const cleanLang = txt.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
            const normalizedDefault = normalizeLanguageName(cleanLang);
            if (normalizedDefault) {
              metadata.language = normalizedDefault;
            }
            break;
          }
          prev = prev.prev();
        }
      }
      if (!metadata.language) metadata.language = null;

      // -- Original Language --
      const trFrom = $('span:contains("Tr From")');
      if (trFrom.length) {
        const afterLabel = trFrom.nextAll('span').filter((_: any, el: any) => {
          const txt = $(el).text().trim();
          return txt && /^\w/.test(txt); // only non-emoji spans
        }).first().text().trim();
        if (afterLabel) {
          metadata.original_language = afterLabel;
        }
      }

      // -- Latest Chapter --
      // Find chapter rows (including side stories / creator notes) and pick the one with the newest timestamp; fall back to last link if no timestamps
      const chapterCandidates = $('[name="chapter-list"] a, .scrollable-panel a')
        .filter((_: any, el: any) => {
          const text = $(el).text().trim();
          const href = $(el).attr('href') || '';
          return text.length > 0 && /\/title\//.test(href);
        })
        .toArray();

      let best = { text: '', ts: -Infinity } as { text: string; ts: number };

      chapterCandidates.forEach((el: any) => {
        const $el = $(el);
        const row = $el.closest('div');
        const timeTag = row.find('time').first();
        // Check time attribute first (epoch ms preferred), then data-time, then datetime/ISO
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
        metadata.latest_chapter = best.text;
      } else if (chapterCandidates.length) {
        // If no timestamps, take the last link (often the newest in reversed lists)
        const lastLink = chapterCandidates[chapterCandidates.length - 1];
        metadata.latest_chapter = $(lastLink).text().trim();
      }

      // -- Upload Date --
      if (best.ts !== -Infinity) {
        metadata.last_uploaded_at = new Date(best.ts).toISOString();
      } else {
        // Fallback: try any time tag
        const timeTag = $('[name="chapter-list"] time, .scrollable-panel time, time').last();
        if (timeTag.length) {
          const ts = timeTag.attr('time') || timeTag.attr('data-time') || timeTag.attr('datetime');
          if (ts) {
            const millis = Number(ts);
            if (!Number.isNaN(millis)) {
              metadata.last_uploaded_at = new Date(millis).toISOString();
            } else {
              const iso = new Date(ts);
              if (!Number.isNaN(iso.getTime())) metadata.last_uploaded_at = iso.toISOString();
            }
          }
        }
      }
    }

    // 4. Return JSON
    return new Response(
      JSON.stringify({ metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const detail = error instanceof Error && error.stack ? error.stack.split('\n')[0] : undefined;

    console.error('fetch-metadata error', { stage, message, detail });

    // Return 200 so Supabase client does not swallow the body with a generic non-2xx error
    // Include the real httpStatus to preserve context for callers
    return new Response(JSON.stringify({ success: false, error: message, stage, detail, httpStatus: 400 }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'x-error-stage': stage,
        'x-error-message': message,
        'x-error-http-status': '400',
      },
      status: 200,
    });
  }
});