import * as cheerio from "cheerio";
import type { ParsedMetadata, ParsedLatest } from "./types.ts";
import { normalizeLanguageName } from "./language.ts";
import { toSupabaseIsoString } from "./date-utils.ts";

export function parseDefaultLatest($: cheerio.CheerioAPI): ParsedLatest {
  let latest_chapter: string | null = null;
  let last_uploaded_at: string | null = null;
  let chapter_count: number | null = null;

  let chapterCandidates = $('[name="chapter-list"] a, .scrollable-panel a, ul.chapter-list a, .chapter-list a, div.chapters a, .wp-manga-chapter a, ul.row-content-chapter a, div.chapter-list a')
    .filter((_: any, el: any) => $(el).text().trim().length > 0)
    .toArray();

  if (chapterCandidates.length === 0) {
    chapterCandidates = $('a[href*="/chapter"], a[href*="/ch-"], a[href*="/read"], a[href*="/title/"], a[href*="/series/"]')
      .filter((_: any, el: any) => $(el).text().trim().length > 0)
      .toArray();
  }

  let best = { text: '', ts: -Infinity } as { text: string; ts: number };

  chapterCandidates.forEach((el: any) => {
    const $el = $(el);
    const row = $el.closest('div, li, tr');
    const timeTag = row.find('time, span.chapter-time, span.date, span.post-on').first();
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
    } else {
      const txt = timeTag.text().trim();
      if (txt) {
        const d = new Date(txt);
        if (!Number.isNaN(d.getTime())) tsNum = d.getTime();
      }
    }

    if (tsNum > best.ts) {
      best = { text: $el.text().trim(), ts: tsNum };
    }
  });

  if (best.text) {
    latest_chapter = best.text;
  } else if (chapterCandidates.length > 0) {
    latest_chapter = $(chapterCandidates[0]).text().trim();
  }

  const uniqueChapterKeys = new Set<string>();
  chapterCandidates.forEach((el: any) => {
    const href = $(el).attr('href') || '';
    const label = $(el).text().trim();
    const key = href || label;
    if (key) uniqueChapterKeys.add(key);
  });
  if (uniqueChapterKeys.size > 0) chapter_count = uniqueChapterKeys.size;

  if (best.ts !== -Infinity) {
    last_uploaded_at = toSupabaseIsoString(best.ts);
  } else {
    const timeTag = $('[name="chapter-list"] time, .scrollable-panel time, time').last();
    if (timeTag.length) {
      const ts = timeTag.attr('time') || timeTag.attr('data-time') || timeTag.attr('datetime');
      if (ts) {
        last_uploaded_at = toSupabaseIsoString(ts);
      }
    }
  }

  if (!chapter_count) {
    const headingCountText = $('b:contains("Chapters"), span:contains("Chapters")').next().text();
    const match = headingCountText.match(/(\d+)/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) chapter_count = parsed;
    }
  }

  return {
    latest_chapter,
    last_uploaded_at,
    chapter_count,
  };
}

export function parseDefaultMetadata($: cheerio.CheerioAPI, hostname: string): ParsedMetadata {
  const latestInfo = parseDefaultLatest($);

  // -- Title --
  const title = $('h3 a').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('title').first().text().trim() || 
                '';

  // -- Description --
  const description = $('div.limit-html-p').first().text().trim() || 
                         $('meta[property="og:description"]').attr('content') || 
                         $('meta[name="description"]').attr('content') || 
                         '';

  // -- Cover Image --
  let image = $('meta[property="og:image"]').attr('content');
  if (!image) {
    image = $('div.w-24 img, div[class*="w-52"] img').first().attr('src') || 
            $('img').first().attr('src') || 
            '';
  }
  if (image && image.startsWith('/')) {
    image = `https://${hostname}${image}`;
  }

  // -- Genres --
  const genresSet = new Set<string>();
  const genresContainer = $('b:contains("Genres")').parent();
  genresContainer.find('span').each((_: any, el: any) => {
    const raw = $(el).text();
    if (!raw) return;
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
    parts.forEach(text => {
      if (!text) return;
      if (/groups|reviews|comments|latest chapters|random comics|docs/i.test(text)) return;
      if (/^[^\w]+$/.test(text)) return;
      genresSet.add(text);
    });
  });

  // -- Language --
  let language: string | null = null;
  const trFromDefault = $('span:contains("Tr From")').first();
  if (trFromDefault.length) {
    let prev = trFromDefault.prev();
    while (prev.length > 0) {
      const txt = prev.text().trim();
      if (/[A-Za-z]/.test(txt)) {
        const cleanLang = txt.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        const normalizedDefault = normalizeLanguageName(cleanLang);
        if (normalizedDefault) {
          language = normalizedDefault;
        }
        break;
      }
      prev = prev.prev();
    }
  }

  // -- Original Language --
  let original_language: string | null = null;
  const trFrom = $('span:contains("Tr From")');
  if (trFrom.length) {
    const afterLabel = trFrom.nextAll('span').filter((_: any, el: any) => {
      const txt = $(el).text().trim();
      return txt && /^\w/.test(txt);
    }).first().text().trim();
    if (afterLabel) {
      original_language = afterLabel;
    }
  }

  if (!hostname.includes('webtoons.com') && !language) {
    language = 'English';
  }

  return {
    title,
    description,
    image: image || '',
    genres: Array.from(genresSet),
    language,
    original_language,
    latest_chapter: latestInfo.latest_chapter || '',
    last_uploaded_at: latestInfo.last_uploaded_at,
    chapter_count: latestInfo.chapter_count,
  };
}
