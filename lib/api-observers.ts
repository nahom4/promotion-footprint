import { Observation } from "./types";

const now = () => new Date().toISOString();

export async function observeMetaAds(company: string): Promise<Observation[]> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return [];
  const countries = process.env.META_AD_COUNTRIES || "US";
  const params = new URLSearchParams({
    access_token: token,
    search_terms: company,
    ad_reached_countries: JSON.stringify(countries.split(",").map(x => x.trim()).filter(Boolean)),
    fields: "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name,ad_snapshot_url",
    limit: "25"
  });
  try {
    const r = await fetch(`https://graph.facebook.com/v23.0/ads_archive?${params}`, { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json() as { data?: Array<Record<string, unknown>> };
    return (data.data || []).map(ad => ({
      platform: "Meta" as const,
      kind: "paid" as const,
      title: String(ad.page_name || company),
      description: `Meta Ad Library record ${String(ad.id || "")}`,
      url: String(ad.ad_snapshot_url || `https://www.facebook.com/ads/library/?q=${encodeURIComponent(company)}`),
      confidence: "high" as const,
      observedAt: String(ad.ad_creation_time || now()),
      signals: ["Meta Ads Archive API"]
    }));
  } catch { return []; }
}

export async function observeYouTube(company: string): Promise<Observation[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ part: "snippet", q: company, type: "channel,video", maxResults: "25", key });
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json() as { items?: Array<{ id?: { videoId?: string; channelId?: string }, snippet?: { title?: string, description?: string, publishedAt?: string } }> };
    return (data.items || []).map(item => {
      const id = item.id?.videoId || item.id?.channelId || "";
      const isVideo = Boolean(item.id?.videoId);
      return {
        platform: "YouTube" as const,
        kind: "organic" as const,
        title: item.snippet?.title || company,
        description: item.snippet?.description || "",
        url: isVideo ? `https://www.youtube.com/watch?v=${id}` : `https://www.youtube.com/channel/${id}`,
        confidence: "high" as const,
        observedAt: item.snippet?.publishedAt || now(),
        signals: ["YouTube Data API"]
      };
    });
  } catch { return []; }
}
