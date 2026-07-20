import * as cheerio from "cheerio";
import type { ParsedMetadata, ParsedLatest } from "./types.ts";
import { toSupabaseIsoString } from "./date-utils.ts";

/**
 * Parses chapter listing, total unique chapter count, and latest upload date from Mangago HTML.
 */
export function parseMangagoLatest($: cheerio.CheerioAPI): ParsedLatest {
  const chaptersTable = $('#chapter_table, table.listing');
  let latest_chapter: string | null = null;
  let chapter_count: number | null = null;
  let last_uploaded_at: string | null = null;

  const firstLink = chaptersTable.find('td a.chico').first();
  if (firstLink.length) {
    latest_chapter = firstLink.text().trim().replace(/\s+/g, ' ');
  } else {
    const fallbackLink = chaptersTable.find('a.chico, a').first();
    if (fallbackLink.length) {
      latest_chapter = fallbackLink.text().trim().replace(/\s+/g, ' ');
    }
  }

  // Extract total unique chapter count by normalizing chapter titles and deduplicating
  const uniqueChapterKeys = new Set<string>();
  chaptersTable.find('td a.chico, a.chico').each((_: any, el: any) => {
    const titleText = $(el).text().trim().replace(/\s+/g, ' ');
    if (!titleText) return;

    // Skip pure bonus/notice/promo entries without an explicit chapter number
    const isPureBonus = /^(notice|announcement|promo|preview|author'?s?\s*note)\b/i.test(titleText) &&
                        !/\b(ch|chapter|side|vol|volume|ep|episode)\.?\s*\d+/i.test(titleText);
    if (isPureBonus) return;

    // Extract normalized chapter key
    let key: string | null = null;
    
    // 1. Try matching Vol X Ch Y
    const volChMatch = titleText.match(/\bvol(?:ume)?\.?\s*(\d+)\s*ch(?:apter)?\.?\s*(\d+(?:\.\d+)?)/i);
    if (volChMatch) {
      key = `v${volChMatch[1]}_ch${volChMatch[2]}`;
    }
    
    // 2. Try matching Ch X or Chapter X
    if (!key) {
      const chMatch = titleText.match(/\bch(?:apter)?\.?\s*(\d+(?:\.\d+)?)/i);
      if (chMatch) {
        key = `ch_${chMatch[1]}`;
      }
    }

    // 3. Try matching Side X
    if (!key) {
      const sideMatch = titleText.match(/\bside\.?\s*(\d+(?:\.\d+)?)/i);
      if (sideMatch) {
        key = `side_${sideMatch[1]}`;
      }
    }

    // 4. Try matching Ep X or Episode X
    if (!key) {
      const epMatch = titleText.match(/\bep(?:isode)?\.?\s*(\d+(?:\.\d+)?)/i);
      if (epMatch) {
        key = `ep_${epMatch[1]}`;
      }
    }

    // 5. Try matching Part X
    if (!key) {
      const partMatch = titleText.match(/\bpart\.?\s*(\d+(?:\.\d+)?)/i);
      if (partMatch) {
        key = `part_${partMatch[1]}`;
      }
    }

    // Fallback key for titles with no standard prefix
    if (!key) {
      key = titleText.toLowerCase().replace(/[^\w\s]/g, '').trim();
    }

    if (key) {
      uniqueChapterKeys.add(key);
    }
  });

  if (uniqueChapterKeys.size > 0) {
    chapter_count = uniqueChapterKeys.size;
  } else {
    // Fallback 1: Extract count from #chapter_tab, e.g. "Chapters(362)"
    const chapterTabText = $('#chapter_tab').text() || $('h4:contains("Chapters")').text();
    const countMatch = chapterTabText.match(/Chapters\s*\((\d+)\)/i);
    if (countMatch) {
      chapter_count = parseInt(countMatch[1], 10);
    } else {
      // Fallback 2: Total raw chico links
      const totalRows = chaptersTable.find('td a.chico').length;
      chapter_count = totalRows > 0 ? totalRows : null;
    }
  }

  // -- Upload Date --
  const firstRow = chaptersTable.find('tr').first();
  if (firstRow.length) {
    const dateCells = firstRow.find('td.no');
    const dateText = dateCells.last().text().trim();
    
    if (dateText) {
      const dateMatch = dateText.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})|(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (dateMatch) {
        try {
          let month = '', day = '', year = '';
          if (dateMatch[1]) {
            month = dateMatch[1];
            day = dateMatch[2];
            year = dateMatch[3];
          } else {
            day = dateMatch[4];
            month = dateMatch[5];
            year = dateMatch[6];
          }
          
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
          const monthIndex = monthNames.findIndex((m) => m.toLowerCase().startsWith(month.toLowerCase()));
          
          if (monthIndex !== -1) {
            const dateObj = new Date(Date.UTC(parseInt(year, 10), monthIndex, parseInt(day, 10), 12, 0, 0, 0));
            last_uploaded_at = toSupabaseIsoString(dateObj);
          }
        } catch (e) {
          console.log('[Mangago] Date parsing error:', e);
        }
      }
    }
  }

  return {
    latest_chapter,
    chapter_count,
    last_uploaded_at,
  };
}

export function parseMangagoMetadata($: cheerio.CheerioAPI): ParsedMetadata {
  const latestInfo = parseMangagoLatest($);

  // -- Title -- (removes "(Yaoi)" or "(yaoi)" suffix if present)
  const rawTitle = $('div.w-title h1').first().text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   '';
  const title = rawTitle.replace(/\s*\(yaoi\)$/i, '').trim();

  // -- Description --
  const rawDescription = $('div.manga_summary').first().text() || 
                         $('meta[property="og:description"]').attr('content') || 
                         '';
  const description = rawDescription
    .replaceAll('The following content is intended for mature audiences and may contain sexual themes, gore, violence and/or strong language. Discretion is advised.', '')
    .replaceAll('not found...', '')
    .trim();

  // -- Cover Image --
  const image = $('div.left.cover img').attr('src') || 
                $('meta[property="og:image"]').attr('content') || 
                '';

  // -- Genres --
  const genresSet = new Set<string>();
  const genreLabel = $('label:contains("Genre")').parent();
  genreLabel.find('a').each((_: any, el: any) => {
    const text = $(el).text().trim();
    if (text && text !== '/') genresSet.add(text);
  });

  return {
    title,
    description,
    image,
    genres: Array.from(genresSet),
    language: null,
    original_language: null,
    latest_chapter: latestInfo.latest_chapter || '',
    last_uploaded_at: latestInfo.last_uploaded_at,
    chapter_count: latestInfo.chapter_count,
  };
}

// Keep backward compatibility export
export const parseMangagoChapterInfo = parseMangagoLatest;
