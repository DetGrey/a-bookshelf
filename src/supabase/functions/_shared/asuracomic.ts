import * as cheerio from "cheerio";
import type { ParsedMetadata, ParsedLatest } from "./types.ts";
import { toSupabaseIsoString } from "./date-utils.ts";

export function parseAsuraDate(dateText: string): string | null {
  const trimmed = dateText.trim();
  if (!trimmed) return null;
  const dateMatch = trimmed.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})/);
  if (!dateMatch) return null;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.findIndex((m) => m.toLowerCase().startsWith(dateMatch[1].toLowerCase()));
  if (monthIndex === -1) return null;
  const day = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);
  return toSupabaseIsoString(new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0)));
}

export function parseAsuraLatest($: cheerio.CheerioAPI): ParsedLatest {
  const chapterRows = $('div.pl-4.py-2.border.rounded-md, div[class*="pl-4"][class*="py-2"][class*="rounded-md"]')
    .filter((_: any, el: any) => $(el).find('a[href*="/chapter/"]').length > 0)
    .toArray();

  let bestChapterNumber = Number.NEGATIVE_INFINITY;
  let bestChapterText = '';
  let bestChapterDateIso: string | null = null;
  const uniqueChapterKeys = new Set<string>();

  chapterRows.forEach((row: any) => {
    const $row = $(row);
    const chapterLink = $row.find('a[href*="/chapter/"]').first();
    const href = chapterLink.attr('href') || '';
    if (href) uniqueChapterKeys.add(href);

    const text = $row.find('h3.text-sm').first().text().trim().replace(/\s+/g, ' ')
      || chapterLink.text().trim().replace(/\s+/g, ' ');
    const chapterMatch = text.match(/chapter\s*(\d+(?:\.\d+)?)/i);
    const chapterNumber = chapterMatch ? parseFloat(chapterMatch[1]) : Number.NEGATIVE_INFINITY;

    const dateText = $row.find('h3.text-xs').first().text().trim();
    const dateIso = parseAsuraDate(dateText);

    if (chapterNumber > bestChapterNumber) {
      bestChapterNumber = chapterNumber;
      bestChapterText = text;
      bestChapterDateIso = dateIso;
    }
  });

  let latest_chapter: string | null = bestChapterText || null;
  let chapter_count: number | null = Number.isFinite(bestChapterNumber) ? Math.floor(bestChapterNumber) : null;
  if ((!chapter_count || chapter_count <= 0) && uniqueChapterKeys.size > 0) {
    chapter_count = uniqueChapterKeys.size;
  }
  let last_uploaded_at: string | null = bestChapterDateIso;

  return {
    latest_chapter,
    chapter_count,
    last_uploaded_at,
  };
}

export function parseAsuraMetadata($: cheerio.CheerioAPI): ParsedMetadata {
  const latestInfo = parseAsuraLatest($);

  // -- Title --
  const title = $('span.text-xl.font-bold').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                '';

  // -- Description --
  let description = '';
  const synopsisLabel = $('h3:contains("Synopsis")').first();
  if (synopsisLabel.length) {
    const synopsisText = synopsisLabel.parent().find('span.font-medium').first().text().trim().replace(/^Synopsis\s+/, '');
    description = synopsisText || '';
  }
  if (!description) {
    description = $('meta[property="og:description"]').attr('content') || '';
  }

  // -- Cover Image --
  let image = $('img[alt="poster"]').first().attr('src');
  if (!image) {
    image = $('img[alt*="poster"]').first().attr('src');
  }
  if (!image) {
    image = $('meta[property="og:image"]').attr('content');
  }

  // -- Genres --
  const genresSet = new Set<string>();
  const genreSection = $('h3:contains("Genres")').first();
  if (genreSection.length) {
    const genreContainer = genreSection.next('.flex');
    genreContainer.find('button').each((_: any, el: any) => {
      const text = $(el).text().trim();
      if (text) genresSet.add(text);
    });
    if (genresSet.size === 0) {
      genreSection.parent().find('button').each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text) genresSet.add(text);
      });
    }
  }

  // -- Language & Original Language --
  let original_language: string | null = null;
  const typeLabel = $('h3:contains("Type")').first();
  if (typeLabel.length) {
    const typeValue = typeLabel.closest('div').find('h3').last().text().trim().toLowerCase();
    if (typeValue.includes('manhwa')) original_language = 'Korean';
    else if (typeValue.includes('manga')) original_language = 'Japanese';
    else if (typeValue.includes('manhua')) original_language = 'Chinese';
  }

  return {
    title,
    description,
    image: image || '',
    genres: Array.from(genresSet),
    language: null,
    original_language,
    latest_chapter: latestInfo.latest_chapter || '',
    last_uploaded_at: latestInfo.last_uploaded_at,
    chapter_count: latestInfo.chapter_count,
  };
}
