export type Platform = "Google" | "Meta" | "LinkedIn" | "YouTube" | "TikTok" | "Website";
export type EvidenceKind = "paid" | "organic" | "website" | "search" | "discovery";

export type Observation = {
  platform: Platform;
  kind: EvidenceKind;
  title: string;
  description: string;
  url: string;
  confidence: "high" | "medium" | "low";
  observedAt: string;
  signals: string[];
  metadata?: Record<string, string | number | boolean | null>;
};

export type ChannelResult = {
  platform: Platform;
  score: number;
  observations: number;
  paidSignals: number;
  recentSignals: number;
  confidence: number;
  status: "active" | "limited" | "not_observed" | "not_configured";
  observationsList: Observation[];
};

export type CollectorStatus = {
  name: string;
  platform: Platform;
  mode: "api" | "public" | "disabled";
  configured: boolean;
  produces: string;
};

export type FootprintReport = {
  company: string;
  domain?: string;
  generatedAt: string;
  score: number;
  channels: ChannelResult[];
  themes: { name: string; count: number }[];
  limitations: string[];
  collectorStatus: CollectorStatus[];
};
