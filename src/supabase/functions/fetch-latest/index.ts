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

// Helper to process a single URL
async function processSingleUrl(url: string, baseHeaders: Record<string, string>) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  const fetchHeaders: Record<string, string> = {
    ...baseHeaders,
    'Referer': url,
  };

  let info: any;

  if (hostname.includes('webtoons.com')) {
    info = await parseWebtoonsLatest(url, fetchHeaders);
  } else {
    if (hostname.includes('comix')) {
      fetchHeaders['Referer'] = `https://${hostname}/`;
    }

    const response = await fetch(url, { headers: fetchHeaders });
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

  return {
    latest_chapter: info?.latest_chapter ?? null,
    last_uploaded_at: info?.last_uploaded_at ?? null,
    chapter_count: info?.chapter_count ?? null,
  };
}

// Helper for batch processing with server-side concurrency chunking
async function processBatch(
  items: Array<{ id?: string; url: string }>,
  baseHeaders: Record<string, string>,
  chunkSize = 3
) {
  const results: Array<any> = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          const res = await processSingleUrl(item.url, baseHeaders);
          return {
            id: item.id,
            url: item.url,
            success: true,
            ...res,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return {
            id: item.id,
            url: item.url,
            success: false,
            error: message,
          };
        }
      })
    );

    chunkResults.forEach((res) => {
      if (res.status === 'fulfilled') {
        results.push(res.value);
      } else {
        results.push({ success: false, error: res.reason?.message || 'Failed' });
      }
    });

    if (i + chunkSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const baseHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // 1. Batch Request mode: { urls: ["..."] } or { items: [{ id: "...", url: "..." }] }
    if (Array.isArray(body.urls) || Array.isArray(body.items)) {
      const rawItems: Array<{ id?: string; url: string }> = body.items
        ? body.items
        : body.urls.map((u: string) => ({ url: u }));

      const results = await processBatch(rawItems, baseHeaders, 3);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Single Request mode: { url: "..." }
    const { url } = body;
    if (!url) throw new Error('No URL or URLs provided');

    const singleResult = await processSingleUrl(url, baseHeaders);
    return new Response(JSON.stringify(singleResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});