// lib/opsec/score.aggregate.ts
import type { Address } from "viem";
import type { OpSecReport, SourceStatus, RiskBadge } from "./types";
import { computeReport as computeV2 } from "./score"; // your current v2
import { clamp } from "./math";

const COVERAGE_MIN_FOR_GRADE = 70; // only show letter grade when coverage ≥ 70%

// Decide coverage buckets → confidence
function coverageToConfidence(cov: number): "low" | "med" | "high" {
  if (cov >= 85) return "high";
  if (cov >= 60) return "med";
  return "low";
}

export async function computeAggregator(address: Address, raw: any): Promise<OpSecReport> {
  // 1) Run your existing v2 logic
  const base = await computeV2(address, raw);

  // 2) Build a source status table from what we attempted to fetch
  const attempted: SourceStatus[] = [
    { key: "basescan",      label: "BaseScan",       ok: !!raw?.bs,        note: raw?.bs?._note },
    { key: "dexscreener",   label: "DEX Screener",   ok: !!raw?.dx,        note: raw?.dx?._note },
    { key: "geckoterminal", label: "GeckoTerminal",  ok: !!raw?.markets,   note: raw?.markets?._note },
    { key: "goplus",        label: "GoPlus",         ok: !!raw?.gp,        note: raw?.gp?._note },
    { key: "honeypot",      label: "Honeypot.is",    ok: !!raw?.hp,        note: raw?.hp?._note },
    { key: "coingecko",     label: "CoinGecko",      ok: !!raw?.cg,        note: raw?.cg?._note },
    { key: "twitter",       label: "Twitter",        ok: !!raw?.socials?.twitter, note: raw?.socials?._note },
    { key: "github",        label: "GitHub",         ok: !!raw?.socials?.github,  note: raw?.socials?._note },
    { key: "website",       label: "Website",        ok: !!raw?.socials?.website, note: raw?.socials?._note },
  ];

  const considered = attempted.filter(s => s.ok !== null && s.ok !== undefined);
  const okCount = considered.filter(s => s.ok === true || s.ok === false).length;
  const planned = attempted.length; // what “full” looks like for us
  const coverage = planned > 0 ? Math.round((okCount / planned) * 100) : 0;

  // 3) Compute confidence
  const confidence = coverageToConfidence(coverage);

  // 4) Risk badges (opinionated but softer than red X everywhere)
  const badges: RiskBadge[] = [];

  const note = (k: string) => base.findings.find(f => f.key === k)?.note || "";

  // Examples:
  if (base.findings.some(f => f.key === "owner" && !f.ok)) {
    badges.push({ key: "owner_privs", level: "warn", text: `Owner retains privileges. ${note("owner")}` });
  }
  if (base.findings.some(f => f.key === "verified" && !f.ok)) {
    badges.push({ key: "unverified", level: "info", text: "Contract not verified on explorer." });
  }
  if (typeof base.metrics?.liquidityUSD === "number" && base.metrics.liquidityUSD < 50000) {
    badges.push({ key: "thin_liquidity", level: "warn", text: "Liquidity appears thin (< $50k)." });
  }
  if (typeof base.metrics?.topHolderPct === "number" && base.metrics.topHolderPct >= 20) {
    badges.push({ key: "holder_concentration", level: "warn", text: `Top holder ${base.metrics.topHolderPct.toFixed(1)}%` });
  }
  if (base.findings.some(f => f.key === "honeypot" && !f.ok)) {
    badges.push({ key: "honeypot_flags", level: "high", text: "Honeypot risk flagged by at least one source." });
  }
  if (base.findings.some(f => f.key === "blacklist" && !f.ok)) {
    badges.push({ key: "transfer_controls", level: "warn", text: "Restrictive transfer controls detected." });
  }

  // 5) Conditional grade: only show when coverage is decent
  const showGrade = coverage >= COVERAGE_MIN_FOR_GRADE;
  const grade = showGrade ? base.grade : ("N/A" as any);
  const score = showGrade ? base.score : clamp(Math.round(base.score * 0.9), 0, 100); // soften presentation when coverage low

  return {
    ...base,
    grade,
    score,
    coverage,
    confidence,
    sourcesTable: attempted,
    riskBadges: badges,
  };
}
