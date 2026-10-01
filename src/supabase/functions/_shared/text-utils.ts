import * as cheerio from "cheerio";

/**
 * Extracts text from a Cheerio element while preserving HTML line breaks (<br>, <p>, <div>, <li>).
 */
export function extractTextWithNewlines($: cheerio.CheerioAPI, selectorOrElem: any): string {
  const elem = typeof selectorOrElem === "string" ? $(selectorOrElem).first() : selectorOrElem;
  if (!elem || !elem.length) return "";

  const clone = elem.clone();
  clone.find("br").replaceWith("\n");
  clone.find("p, div, li").each((_: any, el: any) => {
    $(el).append("\n");
  });

  return clone
    .text()
    .split("\n")
    .map((line: string) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
