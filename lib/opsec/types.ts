// lib/opsec/types.ts
export type Finding = {
  key: string;
  ok: boolean;
  weight: number;
  note: string;
};

export type Metrics = {
  liquidityUSD?: number;
  topHolderPct?: number;
  buySellRatio?: string;    // "∞" or "0.85" etc
  volume24hUSD?: number;
  fdvUSD?: number;
  lpLockedPct?: number;
};

export type Sources = {
  basescan: string;
  goplus: string;
  dexscreener: string;
  honeypot: string;
  coingecko?: string;       // NEW (optional)
};

export type Socials = {
  website?: string;
  twitter?: string;
  telegram?: string;
  github?: string;
  warpcast?: string;
  coingecko?: string;
};

export type OpSecReport = {
  address: string;
  chainId: number;
  name?: string;
  symbol?: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: Finding[];
  findings: Finding[];
  metrics: Metrics;
  imageUrl: string;
  permalink: string;
  sources: Sources;
  socials?: Socials;        // NEW (optional)
};
