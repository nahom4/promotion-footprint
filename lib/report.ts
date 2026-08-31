import { ChannelResult, FootprintReport, Observation, Platform } from "./types";
import { WebsiteObserver } from "./observers";
import { observeGoogle, observeMetaAds, observeYouTube, collectorStatuses } from "./api-observers";

const platforms: Platform[] = ["Google", "Meta", "LinkedIn", "YouTube", "TikTok", "Website"];

function scoreChannel(items: Observation[]): ChannelResult {
  const paid = items.filter(x => x.kind === "paid").length;
  const recent = items.filter(x => Date.now() - Date.parse(x.observedAt) < 1000 * 60 * 60 * 24 * 30).length;
  const confidence = items.length ? Math.round(items.reduce((s, x) => s + (x.confidence === "high" ? 1 : x.confidence === "medium" ? .7 : .4), 0) / items.length * 100) : 0;
  const score = items.length ? Math.min(100, Math.round(Math.min(60, items.length * 5) + Math.min(20, paid * 10) + Math.min(10, recent * 2) + confidence * .1)) : 0;
  return { platform: items[0]?.platform ?? "Website", score, observations: items.length, paidSignals: paid, recentSignals: recent, confidence, status: items.length ? (confidence >= 70 ? "active" : "limited") : "not_observed", observationsList: items };
}

export async function analyze(company: string): Promise<FootprintReport> {
  const isUrl = /^https?:\/\//i.test(company);
  const results = await Promise.allSettled([
    observeGoogle(company), observeMetaAds(company), observeYouTube(company),
    ...(isUrl ? [new WebsiteObserver().observe(company)] : [])
  ]);
  const all: Observation[] = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  const channels = platforms.map(platform => scoreChannel(all.filter(x => x.platform === platform))).sort((a,b) => b.score - a.score);
  const keywordGroups: Record<string,string[]> = { product: ["product", "platform", "software", "app", "solution"], promotion: ["sale", "discount", "offer", "campaign", "promo"], partnership: ["partner", "partnership", "bank", "telecom"], education: ["guide", "how", "learn", "webinar", "education"], brand: ["brand", "story", "founder", "company", "launch"] };
  const themes = Object.entries(keywordGroups).map(([name, words]) => ({ name, count: all.filter(o => words.some(w => `${o.title} ${o.description}`.toLowerCase().includes(w))).length })).filter(x => x.count).sort((a,b) => b.count-a.count);
  const observed = channels.filter(c => c.observations > 0);
  const score = observed.length ? Math.round(observed.reduce((s,c) => s + c.score, 0) / observed.length) : 0;
  return { company, domain: isUrl ? company : undefined, generatedAt: new Date().toISOString(), score, channels, themes, collectorStatus: collectorStatuses(), limitations: ["Only actual collected evidence contributes to the score.", "No evidence is never interpreted as proof that a company does not use a channel.", "Paid-ad coverage depends on the platform's public API/transparency access and configured credentials."] };
}
