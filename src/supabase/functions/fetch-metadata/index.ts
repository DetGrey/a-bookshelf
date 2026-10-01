import * as cheerio from "cheerio";
import { parseWebtoonsMetadata } from "../_shared/webtoons.ts";
import { parseMangagoMetadata } from "../_shared/mangago.ts";
import { parseAsuraMetadata } from "../_shared/asuracomic.ts";
import { parseComixMetadata } from "../_shared/comix.ts";
import { parseDefaultMetadata } from "../_shared/default-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'x-error-stage, x-error-message',
};

Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let stage = 'init';

  try {
    stage = 'parse_body';
    const { url } = await req.json();
    if (!url) throw new Error('No URL provided');

    // 2. Fetch HTML
    stage = 'fetch';
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': url,
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    // 3. Determine website and extract metadata accordingly
    stage = 'select_parser';
    let metadata: any;

    if (hostname.includes('webtoons.com')) {
      stage = 'parse:webtoons';
      metadata = await parseWebtoonsMetadata(url, fetchHeaders);
    } else {
      const response = await fetch(url, { headers: fetchHeaders });
      if (!response.ok) throw new Error(`Failed to fetch site: ${response.status} ${response.statusText}`);

      stage = 'load_html';
      const html = await response.text();
      const $ = cheerio.load(html);

      if (hostname.includes('mangago')) {
        stage = 'parse:mangago';
        metadata = parseMangagoMetadata($);
      } else if (hostname.includes('asuracomic') || hostname.includes('asurascans')) {
        stage = 'parse:asuracomic';
        metadata = parseAsuraMetadata($);
      } else if (hostname.includes('comix')) {
        stage = 'parse:comix';
        metadata = parseComixMetadata($);
      } else {
        stage = 'parse:default';
        metadata = parseDefaultMetadata($, hostname);
      }
    }

    // 4. Return JSON (with trimmed string fields)
    if (metadata && typeof metadata === 'object') {
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
          metadata[key] = value.trim();
        } else if (Array.isArray(value)) {
          metadata[key] = value.map((item) => (typeof item === 'string' ? item.trim() : item));
        }
      }
    }

    return new Response(
      JSON.stringify({ metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const detail = error instanceof Error && error.stack ? error.stack.split('\n')[0] : undefined;

    console.error('fetch-metadata error', { stage, message, detail });

    return new Response(JSON.stringify({ success: false, error: message, stage, detail, httpStatus: 400 }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'x-error-stage': stage,
        'x-error-message': message,
        'x-error-http-status': '400',
      },
      status: 200,
    });
  }
});