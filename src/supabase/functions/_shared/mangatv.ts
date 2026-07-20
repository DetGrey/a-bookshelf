import * as cheerio from "cheerio";
import type { ParsedLatest } from "./types.ts";
import { toSupabaseIsoString } from "./date-utils.ts";

export function parseMangaTVLatest($: cheerio.CheerioAPI): ParsedLatest {
  let latest_chapter: string | null = null;
  let last_uploaded_at: string | null = null;
  let chapter_count: number | null = null;

  const chapterItems = $('ul.clstyle li').toArray();
  
  if (chapterItems.length > 0) {
    chapter_count = chapterItems.length;

    let highestChapterNum = 0;
    let latestChapterText = '';
    let latestChapterDate = '';

    chapterItems.forEach((item: any) => {
      const $item = $(item);
      const chapterNums = $item.find('span.chapternum');
      const chapterText = chapterNums.first().text().trim();
      const dateText = $item.find('span.chapterdate').text().trim();

      const match = chapterText.match(/Cap[íi]tulo\s+(\d+(?:\.\d+)?)/i);
      if (match) {
        const num = parseFloat(match[1]);
        if (num > highestChapterNum) {
          highestChapterNum = num;
          latestChapterText = chapterText;
          latestChapterDate = dateText;
        }
      }
    });

    if (latestChapterText) {
      latest_chapter = latestChapterText;
      chapter_count = Math.floor(highestChapterNum);
    }

    if (latestChapterDate) {
      try {
        const dateObj = new Date(latestChapterDate + 'T12:00:00.000Z');
        last_uploaded_at = toSupabaseIsoString(dateObj);
      } catch (e) {
        console.log('[MangaTV] Date parsing error:', e);
      }
    }
  }

  return {
    latest_chapter,
    last_uploaded_at,
    chapter_count,
  };
}
