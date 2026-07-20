/**
 * Shared utility for querying the MangaUpdates public REST API.
 * Uses series metadata + release archive API (search_type=series, orderby=date, asc=desc) to get exact chapter names & numbers.
 */

export interface MangaUpdatesInfo {
  latest_chapter: string | null;
  chapter_count: number | null;
  status: string | null;
  genres: string[];
}

/**
 * Queries MangaUpdates public API to find the newest release chapter name, number, total count, and genres.
 */
export async function fetchMangaUpdatesLatest(
  title: string,
  customFetch: typeof fetch = fetch
): Promise<MangaUpdatesInfo | null> {
  if (!title || title.trim().length === 0) return null;
  try {
    const cleanTitle = title.trim();

    // 1. Search for series by title to get series_id
    const searchRes = await customFetch('https://api.mangaupdates.com/v1/series/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: cleanTitle, perpage: 5 })
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) return null;

    const record = searchData.results[0].record;
    if (!record || !record.series_id) return null;

    const seriesId = record.series_id;

    // 2. Fetch main series details (for genres, completion status, and total count)
    const detailsRes = await customFetch(`https://api.mangaupdates.com/v1/series/${seriesId}`);
    const details = detailsRes.ok ? await detailsRes.json() : {};

    const genres: string[] = [];
    if (Array.isArray(details.genres)) {
      details.genres.forEach((g: any) => {
        if (g && typeof g.genre === 'string' && g.genre.trim()) {
          genres.push(g.genre.trim());
        }
      });
    }

    let isCompleted = Boolean(details.completed);
    if (details.status && /complete/i.test(details.status)) {
      isCompleted = true;
    }

    let chapter_count: number | null = null;
    if (details.latest_chapter !== undefined && details.latest_chapter !== null) {
      const numVal = parseInt(String(details.latest_chapter), 10);
      if (!Number.isNaN(numVal) && numVal > 0) {
        chapter_count = numVal;
      }
    }
    if (details.status) {
      const statusMatch = details.status.match(/(\d+)\s*Chapters/i);
      if (statusMatch) {
        const parsedCount = parseInt(statusMatch[1], 10);
        if (parsedCount > 0) {
          chapter_count = Math.max(chapter_count || 0, parsedCount);
        }
      }
    }

    // 3. Query Release Archive API with exact parameters (search=series_id, search_type=series, orderby=date, asc=desc)
    let releaseChapterName: string | null = null;
    try {
      const relRes = await customFetch('https://api.mangaupdates.com/v1/releases/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: String(seriesId),
          search_type: 'series',
          orderby: 'date',
          asc: 'desc',
          perpage: 10
        })
      });

      if (relRes.ok) {
        const relData = await relRes.json();
        if (Array.isArray(relData.results) && relData.results.length > 0) {
          // Top result in date desc order is the absolute newest release
          const topRel = relData.results[0].record;
          if (topRel) {
            const relCh = topRel.chapter ? String(topRel.chapter).trim() : '';
            const relTitle = topRel.title ? String(topRel.title).trim() : '';

            // Extract numerical chapter to update chapter_count
            const numMatch = relCh.match(/(?:c\.?|ch(?:apter)?\.?|ep(?:isode)?\.?|^)\s*(\d+(?:\.\d+)?)/i);
            if (numMatch) {
              const numVal = Math.floor(parseFloat(numMatch[1]));
              chapter_count = numVal;
            }

            if (/\b(end|complete|afterword)\b/i.test(relCh) || /\b(end|complete|afterword)\b/i.test(relTitle)) {
              isCompleted = true;
            }

            // Clean chapter string by removing any existing (end)/(complete) variations
            if (relCh) {
              let cleanCh = relCh.replace(/\s*[\(\[]?\s*(?:end|complete)\s*[\)\]]?/gi, '').trim();
              if (/^c\.?\s*/i.test(cleanCh)) {
                cleanCh = `Episode ${cleanCh.replace(/^c\.?\s*/i, '')}`;
              } else if (!/^episode/i.test(cleanCh) && !/^ep/i.test(cleanCh) && /^\d+/.test(cleanCh)) {
                cleanCh = `Episode ${cleanCh}`;
              }

              // Only append relTitle if it is a unique chapter subtitle (not equal to the series title or chapter string)
              const cleanRelTitle = relTitle.replace(/\s*[\(\[]?\s*(?:end|complete)\s*[\)\]]?/gi, '').trim();
              const isSeriesTitle = cleanRelTitle.toLowerCase() === cleanTitle.toLowerCase() ||
                                   cleanRelTitle.toLowerCase() === (record.title || '').toLowerCase();
              const isDuplicateCh = cleanRelTitle.toLowerCase().includes(relCh.toLowerCase());

              if (cleanRelTitle && !isSeriesTitle && !isDuplicateCh) {
                releaseChapterName = `${cleanCh}: ${cleanRelTitle}`;
              } else {
                releaseChapterName = cleanCh;
              }
            } else if (relTitle) {
              const cleanRelTitle = relTitle.replace(/\s*[\(\[]?\s*(?:end|complete)\s*[\)\]]?/gi, '').trim();
              if (cleanRelTitle.toLowerCase() !== cleanTitle.toLowerCase()) {
                releaseChapterName = cleanRelTitle;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('[MangaUpdates] Release archive fetch error:', e);
    }

    // 4. Formulate final latest_chapter
    let latest_chapter: string | null = releaseChapterName;

    if (!latest_chapter && chapter_count && chapter_count > 0) {
      latest_chapter = `Episode ${chapter_count}`;
    }

    if (latest_chapter && isCompleted) {
      const clean = latest_chapter.replace(/\s*[\(\[]?\s*end\s*[\)\]]?/gi, '').trim();
      latest_chapter = `${clean} (End)`;
    }

    return {
      latest_chapter,
      chapter_count,
      status: details.status || null,
      genres,
    };
  } catch (err) {
    console.log('[MangaUpdates] Fetch error:', err);
    return null;
  }
}
