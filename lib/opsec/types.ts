// lib/opsec/types.ts (additions)
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
  ok: boolean | null;         // true=good, false=bad, null=unknown/unavailable
  note?: string;              // brief explanation
  latencyMs?: number;         // optional, for debug/UX
};

export type RiskBadge = {
  key: string;                // e.g. "owner_privs", "unverified", "thin_liquidity"
  level: "info" | "warn" | "high";
  text: string;               // short user-facing sentence
};

export interface OpSecReport {
  // ... existing fields ...
  coverage?: number;          // 0–100: how much of the planned checks had data
  confidence?: "low" | "med" | "high";
  sourcesTable?: SourceStatus[];
  riskBadges?: RiskBadge[];
}
