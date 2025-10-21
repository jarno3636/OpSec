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
  buySellRatio?: string;     // ratio rendered as string (e.g. "1.25", "∞")
  volume24hUSD?: number;     // ✅ add
  fdvUSD?: number;           // ✅ add
  lpLockedPct?: number;      // ✅ add
};

export type OpSecReport = {
  address: string;
  chainId: number;
  name?: string;
  symbol?: string;
  score: number;             // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  summary: Finding[];
  findings: Finding[];
  metrics: Metrics;
  imageUrl: string;
  permalink: string;
  sources: {
    basescan: string;
    goplus: string;
    dexscreener: string;
    honeypot: string;
  };
};
