// lib/opsec/types.ts

export type Grade = "A" | "B" | "C" | "D" | "F";

export type Finding = {
  key: string;       // stable machine key (e.g., "verified", "lp_lock")
  ok: boolean;       // pass/fail for this check
  weight: number;    // contribution to total score
  note: string;      // human-readable explanation shown in UI
};

export type Metrics = {
  liquidityUSD?: number;   // from DexScreener main pair
  topHolderPct?: number;   // computed from BaseScan holder list
  buySellRatio?: string;   // "∞" or fixed(2) string (e.g., "1.25")
};

export type OpSecReport = {
  address: `0x${string}`;
  chainId: number;         // 8453 for Base
  symbol?: string;
  name?: string;
  score: number;           // 0–100
  grade: Grade;            // A–F
  summary: Finding[];      // top few highlights
  findings: Finding[];     // full list of checks
  metrics: Metrics;        // numeric/context metrics
  imageUrl: string;        // OG image for sharing
  permalink: string;       // canonical detail page URL
  sources: Record<string, string>; // label map of data sources
};
