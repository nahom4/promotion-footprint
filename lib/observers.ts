import { Observation, Platform } from "./types";

const UA = "PromotionFootprint/0.1 (+public-competitor-research)";

function obs(platform: Platform, kind: Observation["kind"], title: string, description: string, url: string, signals: string[] = [], confidence: Observation["confidence"] = "medium"): Observation {
  return { platform, kind, title, description, url, confidence, observedAt: new Date().toISOString(), signals };
}

export interface Observer { platform: Platform; observe(company: string): Promise<Observation[]>; }

async function safeFetch(url: string, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.8" }, signal: controller.signal, cache: "no-store" });
  } finally { clearTimeout(timer); }
}

function htmlText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function links(html: string, matcher: RegExp) {
  const found = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) if (matcher.test(m[1])) found.add(m[1]);
  return [...found].slice(0, 8);
}

export class WebsiteObserver implements Observer {
  platform: Platform = "Website";
  async observe(company: string) {
    const domain = company.trim().replace(/^https?:\/\//, "").split("/")[0];
    const url = `https://${domain}`;
    try {
      const r = await safeFetch(url);
      if (!r.ok) return [];
      const text = htmlText(await r.text());
      return [obs("Website", "website", `${company} website`, text.slice(0, 700), url, ["public website"], "high")];
    } catch { return []; }
  }
}

export class GoogleSearchObserver implements Observer {
  platform: Platform = "Google";
  async observe(company: string) {
    const q = encodeURIComponent(`"${company}" marketing OR advertising OR campaign`);
    const url = `https://www.google.com/search?q=${q}`;
    try {
      const r = await safeFetch(url);
      const text = htmlText(await r.text());
      const title = text.slice(0, 500);
      return [obs("Google", "search", `Public search footprint for ${company}`, title, url, ["search-result discovery"], "medium")];
    } catch { return []; }
  }
}

export class YouTubeObserver implements Observer {
  platform: Platform = "YouTube";
  async observe(company: string) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(company)}`;
    try {
      const r = await safeFetch(url);
      const text = htmlText(await r.text());
      const signals = ["YouTube public search"].concat(/channel/i.test(text) ? ["channel signal"] : []);
      return [obs("YouTube", "organic", `YouTube search for ${company}`, text.slice(0, 600), url, signals, "medium")];
    } catch { return []; }
  }
}

export class MetaObserver implements Observer {
  platform: Platform = "Meta";
  async observe(company: string) {
    const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(company)}&search_type=keyword_unordered`;
    // Meta's Ad Library is intentionally linked as an evidence surface. Automated access may be restricted;
    // we record the discoverable source rather than claiming an ad was found when the page cannot be fetched.
    try {
      const r = await safeFetch(url);
      const text = htmlText(await r.text());
      if (!r.ok || !text) return [];
      return [obs("Meta", "paid", `Meta Ad Library search: ${company}`, text.slice(0, 500), url, ["Meta Ad Library"], "medium")];
    } catch { return []; }
  }
}

export class LinkedInObserver implements Observer {
  platform: Platform = "LinkedIn";
  async observe(company: string) {
    const url = `https://www.linkedin.com/ad-library/search?accountOwner=${encodeURIComponent(company)}`;
    try {
      const r = await safeFetch(url);
      const text = htmlText(await r.text());
      if (!r.ok || !text) return [];
      return [obs("LinkedIn", "paid", `LinkedIn Ad Library search: ${company}`, text.slice(0, 500), url, ["LinkedIn Ad Library"], "medium")];
    } catch { return []; }
  }
}

export class TikTokObserver implements Observer {
  platform: Platform = "TikTok";
  async observe(company: string) {
    const url = `https://www.tiktok.com/search?q=${encodeURIComponent(company)}`;
    try {
      const r = await safeFetch(url);
      const text = htmlText(await r.text());
      if (!r.ok || !text) return [];
      return [obs("TikTok", "organic", `TikTok public search: ${company}`, text.slice(0, 500), url, ["public TikTok search"], "low")];
    } catch { return []; }
  }
}

export const observers: Observer[] = [
  new GoogleSearchObserver(), new MetaObserver(), new LinkedInObserver(), new YouTubeObserver(), new TikTokObserver(),
];
