// lib/opsec/types.ts
import type { Address } from "viem";

/* ---------- Per-check result ---------- */
export type Finding = {
  key: string;
  ok: boolean;           // UI coloring; when neutral is true, ok may still be true
  weight: number;
  note: string;
  neutral?: boolean;     // marks half-credit / unknown checks
};

/* ---------- Social links gathered from explorers/aggregators ---------- */
export type SocialLinks = {
  website?: string;
  twitter?: string;
  telegram?: string;
  github?: string;
  warpcast?: string;
  coingecko?: string;
};

/* ---------- Metrics surfaced to UI ---------- */
export type OpSecMetrics = {
  liquidityUSD?: number;
  topHolderPct?: number;
  buySellRatio?: string;     // e.g. "1.25" or "∞"
  volume24hUSD?: number;
  fdvUSD?: number;
  lpLockedPct?: number;
  [k: string]: any;          // forward-compat for new metrics
};

/* ---------- Source health/coverage table ---------- */
export type SourceKey =
  | "basescan"
  | "dexscreener"
  | "geckoterminal"
  | "goplus"
  | "honeypot"
  | "coingecko"
  | "twitter"
  | "github"
  | "website";

export type SourceStatus = {
  key: SourceKey;
  label: string;
  ok: boolean | null;        // true=good, false=bad, null=unknown/unavailable
  note?: string;
  latencyMs?: number;
};

/* ---------- Risk badges shown in UI ---------- */
export type RiskBadge = {
  key: string;               // e.g. "owner_privs", "unverified", "thin_liquidity"
  level: "info" | "warn" | "high";
  text: string;              // short user-facing sentence
};

/* ---------- Main report shape ---------- */
export interface OpSecReport {
  address: Address | string;
  chainId: number;

  name?: string;
  symbol?: string;

  score: number;                           // 0–100
  grade: "A" | "B" | "C" | "D" | "F";

  summary: Finding[];                      // key highlights
  findings: Finding[];                     // full list (may include neutral)
  metrics: OpSecMetrics;                   // KPIs for pills/cards

  socials?: SocialLinks;                   // optional socials block

  // Sharing / frame preview
  imageUrl?: string;
  permalink?: string;

  // Coverage & diagnostics
  coverage?: number;                       // 0–100 % of planned checks with data
  confidence?: "low" | "med" | "high";
  sourcesTable?: SourceStatus[];
  riskBadges?: RiskBadge[];

  // Data source labels (back-compat required + optional extras)
  sources: (
    { basescan: string; goplus: string; dexscreener: string; honeypot: string } &
    Partial<Record<Exclude<SourceKey, "basescan" | "goplus" | "dexscreener" | "honeypot">, string>>
  );
}
