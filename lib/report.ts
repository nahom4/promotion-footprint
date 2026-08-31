import { ChannelResult, FootprintReport, Observation, Platform } from "./types";
import { WebsiteObserver, observers } from "./observers";

const platforms: Platform[] = ["Google", "Meta", "LinkedIn", "YouTube", "TikTok", "Website"];

function scoreChannel(items: Observation[]): ChannelResult {
  const paid = items.filter(x => x.kind === "paid").length;
  const recent = items.filter(x => Date.now() - Date.parse(x.observedAt) < 1000 * 60 * 60 * 24 * 30).length;
  const confidence = items.length ? Math.round(items.reduce((s, x) => s + (x.confidence === "high" ? 1 : x.confidence === "medium" ? .7 : .4), 0) / items.length * 100) : 0;
  const score = Math.min(100, Math.round(items.length * 12 + paid * 18 + recent * 8 + confidence * .15));
  return { platform: items[0]?.platform ?? "Website", score, observations: items.length, paidSignals: paid, recentSignals: recent, confidence, status: items.length ? (confidence >= 70 ? "active" : "limited") : "not_observed", observationsList: items };
}

export async function analyze(company: string): Promise<FootprintReport> {
  const results = await Promise.allSettled(observers.map(o => o.observe(company)));
  const all: Observation[] = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  if (/^https?:\/\//i.test(company)) {
    try { all.push(...await new WebsiteObserver().observe(company)); } catch {}
  }
  const channels = platforms.map(platform => scoreChannel(all.filter(x => x.platform === platform))).sort((a,b) => b.score - a.score);
  const keywordGroups: Record<string,string[]> = {
    product: ["product", "platform", "software", "app", "solution"],
    promotion: ["sale", "discount", "offer", "campaign", "promo"],
    partnership: ["partner", "partnership", "bank", "telecom"],
    education: ["guide", "how", "learn", "webinar", "education"],
    brand: ["brand", "story", "founder", "company", "launch"]
  };
  const themes = Object.entries(keywordGroups).map(([name, words]) => ({ name, count: all.filter(o => words.some(w => `${o.title} ${o.description}`.toLowerCase().includes(w))).length })).filter(x => x.count).sort((a,b) => b.count-a.count);
  const score = Math.round(channels.reduce((s,c) => s + c.score, 0) / channels.length);
  const limitations = [
    "Public transparency surfaces are incomplete; absence of an observation does not prove a channel is unused.",
    "Some platforms restrict automated access. Those observers record evidence only when the public page can be fetched.",
    "The current MVP measures observable promotional footprint, not advertising spend or conversion impact."
  ];
  return { company, domain: /^https?:\/\//i.test(company) ? company : undefined, generatedAt: new Date().toISOString(), score, channels, themes, limitations };
}
