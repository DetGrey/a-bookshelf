import * as cheerio from "cheerio";
import type { ParsedMetadata, ParsedLatest } from "./types.ts";
import { toSupabaseIsoString } from "./date-utils.ts";

export function parseComixLatest($: cheerio.CheerioAPI): ParsedLatest {
  let latest_chapter: string | null = null;
  let last_uploaded_at: string | null = null;
  let chapter_count: number | null = null;

  const chapterList = $('ul.chap-list li').toArray();
  
  if (chapterList.length > 0) {
    const firstChapter = $(chapterList[0]);
    const chapterTitle = firstChapter.find('a.title b').text().trim();
    
    if (chapterTitle) {
      latest_chapter = chapterTitle;
      const match = chapterTitle.match(/Ch\.\s*(\d+)/);
      if (match) {
        chapter_count = parseInt(match[1], 10);
      }
    }

    const timeSpan = firstChapter.find('span.meta__time');
    const timeText = timeSpan.text().trim();
    
    if (timeText) {
      try {
        const now = new Date();
        let daysAgo = 0;
        
        const daysMatch = timeText.match(/(\d+)\s*d(?:\s|,|$)/);
        if (daysMatch) {
          daysAgo += parseInt(daysMatch[1], 10);
        }
        
        const monthsMatch = timeText.match(/(\d+)\s*mo/);
        if (monthsMatch) {
          daysAgo += parseInt(monthsMatch[1], 10) * 30;
        }
        
        if (daysAgo > 0) {
          const uploadDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          uploadDate.setUTCHours(12, 0, 0, 0);
          last_uploaded_at = toSupabaseIsoString(uploadDate);
        }
      } catch (e) {
        console.log('[Comix] Date parsing error:', e);
      }
    }
  }

  if (!chapter_count) {
    const paginationText = $('div.mt-3 b').text();
    if (paginationText) {
      const parts = paginationText.match(/of\s+(\d+)/);
      if (parts) {
        const totalCount = parseInt(parts[1], 10);
        if (!isNaN(totalCount)) {
          chapter_count = totalCount;
        }
      }
    }
  }

  return {
    latest_chapter,
    last_uploaded_at,
    chapter_count,
  };
}

export function parseComixMetadata($: cheerio.CheerioAPI): ParsedMetadata {
  const latestInfo = parseComixLatest($);

  // -- Title --
  const title = $('h1.title').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                '';

  // -- Description --
  const description = $('div.description .content').first().text().trim() || 
                        $('meta[property="og:description"]').attr('content') || 
                        '';

  // -- Cover Image --
  const image = $('div.poster img').attr('src') || 
                $('meta[property="og:image"]').attr('content') || 
                '';

  // -- Genres --
  const genresSet = new Set<string>();
  $('ul#metadata li').each((_: any, el: any) => {
    const text = $(el).text();
    if (text.includes('Genres:')) {
      $(el).find('a').each((_: any, genreEl: any) => {
        const genreText = $(genreEl).text().trim();
        if (genreText) genresSet.add(genreText);
      });
    }
  });

  // -- Language & Original Language --
  let original_language: string | null = null;
  $('ul#metadata li').each((_: any, el: any) => {
    const text = $(el).text();
    if (text.includes('Original language:')) {
      const langMatch = text.match(/Original language:\s*(\w+)/);
      if (langMatch) {
        const code = langMatch[1];
        const langMap: Record<string, string> = {
          'ko': 'Korean', 'ja': 'Japanese', 'en': 'English', 
          'zh': 'Chinese', 'es': 'Spanish', 'fr': 'French'
        };
        original_language = langMap[code] || code;
      }
    }
  });

  return {
    title,
    description,
    image,
    genres: Array.from(genresSet),
    language: null,
    original_language,
    latest_chapter: latestInfo.latest_chapter || '',
    last_uploaded_at: latestInfo.last_uploaded_at,
    chapter_count: latestInfo.chapter_count,
  };
}
