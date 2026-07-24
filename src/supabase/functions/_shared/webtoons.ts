import * as cheerio from "cheerio";
import type { ParsedMetadata, ParsedLatest } from "./types.ts";
import { normalizeLanguageName } from "./language.ts";
import { fetchMangaUpdatesLatest } from "./mangaupdates.ts";
import { mergeAndNormalizeGenres } from "./genre-utils.ts";

const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

/**
 * Extracts sub-genres and completed status from Webtoons mobile Cheerio object ($).
 */
export function parseWebtoonsMobileGenres($: cheerio.CheerioAPI): { genres: string[]; isCompleted: boolean } {
  const genresSet = new Set<string>();
  let isCompleted = false;

  $('ul.tag_box li.tag, ul.tag_area li.tag').each((_: any, el: any) => {
    const text = $(el).text().trim();
    if (!text) return;
    if (text.toLowerCase() === 'completed') {
      isCompleted = true;
    } else {
      genresSet.add(text);
    }
  });

  $('dl.details_area dd.value').each((_: any, el: any) => {
    const text = $(el).text().trim();
    if (text.toLowerCase() === 'completed') {
      isCompleted = true;
    }
  });

  return {
    genres: Array.from(genresSet),
    isCompleted,
  };
}

/**
 * Appends (End) to latest chapter string if series is completed, stripping any existing (end) markers first.
 */
export function formatWebtoonsCompleted(latestChapter: string | null, isCompleted: boolean): string | null {
  if (!latestChapter) return null;
  if (!isCompleted) return latestChapter;

  const clean = latestChapter.replace(/\s*[\(\[]?\s*end\s*[\)\]]?/gi, '').trim();
  return `${clean} (End)`;
}

/**
 * Parses Webtoons latest chapter info using Mobile Webtoons + MangaUpdates API in a single clean pass.
 */
export async function parseWebtoonsLatest(
  url: string,
  fetchHeaders: Record<string, string>,
  customFetch: typeof fetch = fetch
): Promise<ParsedLatest> {
  const mobileUrl = url.replace(/:\/\/(www\.)?webtoons\.com/i, '://m.webtoons.com');
  const response = await customFetch(mobileUrl, {
    headers: {
      'User-Agent': MOBILE_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://m.webtoons.com/',
    }
  });

  if (!response.ok) throw new Error(`Failed to fetch Webtoons mobile site: ${response.status} ${response.statusText}`);

  const html = await response.text();
  const $mobile = cheerio.load(html);

  const title = $mobile('h1.subj, h2.title').first().text().trim() || 
                $mobile('meta[property="og:title"]').attr('content') || 
                '';

  const mobileInfo = parseWebtoonsMobileGenres($mobile);

  let latest_chapter: string | null = null;
  let chapter_count: number | null = null;

  if (title) {
    const muData = await fetchMangaUpdatesLatest(title, customFetch);
    if (muData) {
      latest_chapter = muData.latest_chapter;
      chapter_count = muData.chapter_count;
    }
  }

  // Fallback: extract latest episode directly from Webtoons mobile DOM if MangaUpdates API returned empty
  if (!latest_chapter) {
    const topEpisodeText = $mobile('ul#_episodeList li span.subj, ul.m_episode_list li span.subj, div.episode_title').first().text().trim();
    const topEpisodeNum = $mobile('ul#_episodeList li span.tx, ul.m_episode_list li span.tx').first().text().trim();
    if (topEpisodeNum) {
      latest_chapter = topEpisodeNum;
    } else if (topEpisodeText) {
      latest_chapter = topEpisodeText;
    }
  }

  if (mobileInfo.isCompleted && latest_chapter) {
    latest_chapter = formatWebtoonsCompleted(latest_chapter, true);
  }

  return {
    latest_chapter,
    last_uploaded_at: null,
    chapter_count,
  };
}

/**
 * Parses Webtoons full metadata using Mobile Webtoons for rich tags/UI + MangaUpdates API for un-paywalled chapter stats.
 */
export async function parseWebtoonsMetadata(
  url: string,
  fetchHeaders: Record<string, string>,
  customFetch: typeof fetch = fetch
): Promise<ParsedMetadata> {
  const mobileUrl = url.replace(/:\/\/(www\.)?webtoons\.com/i, '://m.webtoons.com');
  const response = await customFetch(mobileUrl, {
    headers: {
      'User-Agent': MOBILE_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://m.webtoons.com/',
    }
  });

  if (!response.ok) throw new Error(`Failed to fetch Webtoons mobile site: ${response.status} ${response.statusText}`);

  const html = await response.text();
  const $mobile = cheerio.load(html);

  // 1. Extract Mobile UI metadata
  const title = $mobile('h1.subj, h2.title').first().text().trim() || 
                $mobile('meta[property="og:title"]').attr('content') || 
                '';

  const description = $mobile('meta[property="og:description"]').attr('content') || 
                        $mobile('p.desc, div.summary').first().text().trim() || 
                        '';

  let image = $mobile('meta[property="og:image"]').attr('content') || 
              $mobile('div.thmb img, div.img_area img').first().attr('src') || 
              '';

  const mobileInfo = parseWebtoonsMobileGenres($mobile);

  // 2. Extract MangaUpdates release stats & complementary genres
  let latest_chapter: string | null = null;
  let chapter_count: number | null = null;
  let mangaUpdatesGenres: string[] = [];

  if (title) {
    const muData = await fetchMangaUpdatesLatest(title, customFetch);
    if (muData) {
      latest_chapter = muData.latest_chapter;
      chapter_count = muData.chapter_count;
      mangaUpdatesGenres = muData.genres;
    }
  }

  // 3. Combine & normalize genres (High Fantasy + Fantasy -> Fantasy)
  const finalGenres = mergeAndNormalizeGenres(
    mobileInfo.genres,
    mangaUpdatesGenres
  );

  const finalLatestChapter = formatWebtoonsCompleted(latest_chapter, mobileInfo.isCompleted) || '';

  const htmlLang = normalizeLanguageName($mobile('html').attr('lang') ?? null);
  const ogLocale = normalizeLanguageName($mobile('meta[property="og:locale"]').attr('content') ?? null);
  const language = htmlLang || ogLocale || null;

  return {
    title,
    description,
    image: image || '',
    genres: finalGenres,
    language,
    original_language: null,
    latest_chapter: finalLatestChapter,
    last_uploaded_at: null,
    chapter_count,
  };
}
