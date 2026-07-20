import * as cheerio from "cheerio";
import { parseWebtoonsLatest } from "../_shared/webtoons.ts";
import { parseMangagoLatest } from "../_shared/mangago.ts";
import { parseAsuraLatest } from "../_shared/asuracomic.ts";
import { parseComixLatest } from "../_shared/comix.ts";
import { parseMangaTVLatest } from "../_shared/mangatv.ts";
import { parseDefaultLatest } from "../_shared/default-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry helper with exponential backoff
const fetchWithRetry = async (url: string, headers: Record<string, string>, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers,
        redirect: 'follow',
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.log(`[fetchWithRetry] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms for status ${response.status}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`[fetchWithRetry] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms for error:`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error('No URL provided');

    const urlObj = new URL(url);
    let hostname = urlObj.hostname;

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': url,
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    let info: any;

    if (hostname.includes('webtoons.com')) {
      info = await parseWebtoonsLatest(url, fetchHeaders, fetchWithRetry);
    } else {
      if (hostname.includes('comix')) {
        fetchHeaders['Referer'] = `https://${hostname}/`;
      }

      const response = await fetchWithRetry(url, fetchHeaders, 3);
      if (!response.ok) throw new Error(`Failed to fetch site: ${response.status} ${response.statusText}`);

      const html = await response.text();
      const $ = cheerio.load(html);

      if (hostname.includes('mangago')) {
        info = parseMangagoLatest($);
      } else if (hostname.includes('comix')) {
        info = parseComixLatest($);
      } else if (hostname.includes('asuracomic') || hostname.includes('asurascans')) {
        info = parseAsuraLatest($);
      } else if (hostname.includes('mangatv')) {
        info = parseMangaTVLatest($);
      } else {
        info = parseDefaultLatest($);
      }
    }

    return new Response(
      JSON.stringify({
        latest_chapter: info.latest_chapter,
        last_uploaded_at: info.last_uploaded_at,
        chapter_count: info.chapter_count,
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