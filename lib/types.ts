export type Platform = "Google" | "Meta" | "LinkedIn" | "YouTube" | "TikTok" | "Website";
export type EvidenceKind = "paid" | "organic" | "website" | "search";

export type Observation = {
  platform: Platform;
  kind: EvidenceKind;
  title: string;
  description: string;
  url: string;
  confidence: "high" | "medium" | "low";
  observedAt: string;
  signals: string[];
};

export type ChannelResult = {
  platform: Platform;
  score: number;
  observations: number;
  paidSignals: number;
  recentSignals: number;
  confidence: number;
  status: "active" | "limited" | "not_observed";
  observationsList: Observation[];
};

export type FootprintReport = {
  company: string;
  domain?: string;
  generatedAt: string;
  score: number;
  channels: ChannelResult[];
  themes: { name: string; count: number }[];
  limitations: string[];
};
