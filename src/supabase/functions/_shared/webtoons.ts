import * as cheerio from "cheerio";
import type { ParsedMetadata, ParsedLatest } from "./types.ts";
import { normalizeLanguageName } from "./language.ts";
import { fetchMangaUpdatesLatest } from "./mangaupdates.ts";
import { mergeAndNormalizeGenres } from "./genre-utils.ts";
import { toSupabaseIsoString } from "./date-utils.ts";

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

function getWebtoonsTitle($: cheerio.CheerioAPI): string {
  return $(`h1.subj, h2.title, h3.subj, .subj._challengeTitle`)
    .first()
    .text()
    .trim() || $('meta[property="og:title"]').attr('content') || '';
}

async function fetchWebtoonsDocument(
  url: string,
  fetchHeaders: Record<string, string>,
  customFetch: typeof fetch
): Promise<cheerio.CheerioAPI> {
  const desktopUrl = url.replace(/:\/\/(m\.)?(www\.)?webtoons\.com/i, '://www.webtoons.com');
  const mobileUrl = url.replace(/:\/\/(m\.)?(www\.)?webtoons\.com/i, '://m.webtoons.com');
  const urls = Array.from(new Set([desktopUrl, mobileUrl]));
  let lastError = 'unknown error';
  let fallbackDocument: cheerio.CheerioAPI | null = null;

  for (const candidateUrl of urls) {
    const isMobile = candidateUrl === mobileUrl;
    const response = await customFetch(candidateUrl, {
      headers: {
        ...fetchHeaders,
        ...(isMobile ? {
          'User-Agent': MOBILE_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        } : {}),
        'Referer': candidateUrl,
      },
    });

    if (!response.ok) {
      lastError = `${response.status} ${response.statusText}`;
      continue;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const hasEpisode = $('ul#_episodeList li, ul.m_episode_list li, ul#_listUl li, li._episodeItem').length > 0;
    if (getWebtoonsTitle($) && hasEpisode) return $;
    if (getWebtoonsTitle($) || hasEpisode) fallbackDocument = $;
  }

  if (fallbackDocument) return fallbackDocument;
  throw new Error(`Failed to find usable Webtoons page: ${lastError}`);
}

function parseWebtoonsEpisodeInfo($: cheerio.CheerioAPI): {
  latestChapter: string | null;
  chapterCount: number | null;
  lastUploadedAt: string | null;
} {
  const episode = $(
    'ul#_episodeList li, ul.m_episode_list li, ul#_listUl li, li._episodeItem'
  ).first();
  if (!episode.length) {
    return { latestChapter: null, chapterCount: null, lastUploadedAt: null };
  }

  const episodeNumber = episode.find('span.tx').first().text().trim();
  const episodeText = episode.find('span.subj, .episode_title').first().text().trim();
  const latestChapter = episodeNumber || episodeText || null;

  const rowNumber = episode.attr('data-episode-no') || episodeNumber;
  const chapterMatch = rowNumber?.match(/\d+(?:\.\d+)?/);
  const chapterCount = chapterMatch ? Math.floor(parseFloat(chapterMatch[0])) : null;

  const dateText = episode.find('.date, time').first().text().trim() ||
    episode.find('time').attr('datetime')?.trim() || '';
  const lastUploadedAt = dateText ? toSupabaseIsoString(new Date(`${dateText} UTC`)) : null;

  return { latestChapter, chapterCount, lastUploadedAt };
}

/**
 * Parses Webtoons latest chapter info using Mobile Webtoons + MangaUpdates API in a single clean pass.
 */
export async function parseWebtoonsLatest(
  url: string,
  fetchHeaders: Record<string, string>,
  customFetch: typeof fetch = fetch
): Promise<ParsedLatest> {
  const $mobile = await fetchWebtoonsDocument(url, fetchHeaders, customFetch);

  const title = getWebtoonsTitle($mobile);

  const mobileInfo = parseWebtoonsMobileGenres($mobile);

  let latest_chapter: string | null = null;
  let chapter_count: number | null = null;
  let last_uploaded_at: string | null = null;

  const webtoonEpisodeInfo = parseWebtoonsEpisodeInfo($mobile);

  if (title) {
    const muData = await fetchMangaUpdatesLatest(title, customFetch);
    if (muData) {
      latest_chapter = muData.latest_chapter;
      chapter_count = muData.chapter_count;
    }
  }

  if (!latest_chapter) latest_chapter = webtoonEpisodeInfo.latestChapter;
  if (!chapter_count) chapter_count = webtoonEpisodeInfo.chapterCount;
  last_uploaded_at = webtoonEpisodeInfo.lastUploadedAt;

  if (mobileInfo.isCompleted && latest_chapter) {
    latest_chapter = formatWebtoonsCompleted(latest_chapter, true);
  }

  return {
    latest_chapter,
    last_uploaded_at,
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
  const $mobile = await fetchWebtoonsDocument(url, fetchHeaders, customFetch);

  // 1. Extract Mobile UI metadata
  const title = getWebtoonsTitle($mobile);

  const description = $mobile('meta[property="og:description"]').attr('content') ||
                        $mobile('p.desc, div.summary, p.summary, p._readingSynopsis').first().text().trim() ||
                        '';

  let image = $mobile('meta[property="og:image"]').attr('content') ||
              $mobile('div.detail_header .thmb img, div.thmb img, div.img_area img').first().attr('src') ||
              '';

  const mobileInfo = parseWebtoonsMobileGenres($mobile);
  const pageGenres = $mobile('.detail_header .genre, .detail_header .info .genre')
    .map((_: any, el: any) => $mobile(el).text().trim())
    .get()
    .filter(Boolean);

  // 2. Extract MangaUpdates release stats & complementary genres
  let latest_chapter: string | null = null;
  let chapter_count: number | null = null;
  let last_uploaded_at: string | null = null;
  let mangaUpdatesGenres: string[] = [];

  const webtoonEpisodeInfo = parseWebtoonsEpisodeInfo($mobile);

  if (title) {
    const muData = await fetchMangaUpdatesLatest(title, customFetch);
    if (muData) {
      latest_chapter = muData.latest_chapter;
      chapter_count = muData.chapter_count;
      mangaUpdatesGenres = muData.genres;
    }
  }

  if (!latest_chapter) latest_chapter = webtoonEpisodeInfo.latestChapter;
  if (!chapter_count) chapter_count = webtoonEpisodeInfo.chapterCount;
  last_uploaded_at = webtoonEpisodeInfo.lastUploadedAt;

  // 3. Combine & normalize genres (High Fantasy + Fantasy -> Fantasy)
  const finalGenres = mergeAndNormalizeGenres(
    [...mobileInfo.genres, ...pageGenres],
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
    last_uploaded_at,
    chapter_count,
  };
}
