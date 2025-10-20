// lib/opsec/score.ts
import type { Address } from "viem";
import { baseClient } from "@/lib/rpc";
import { ERC20 } from "./abi";
import { clamp, pct } from "./math";
import type { OpSecReport, Finding } from "./types";

type Raw = { bs: any; dx: any; gp: any; hp: any };

const P = (ok: boolean, weight: number, note: string, key: string): Finding => ({ key, ok, weight, note });

export async function computeReport(address: Address, raw: Raw): Promise<OpSecReport> {
  const findings: Finding[] = [];
  const metrics: OpSecReport["metrics"] = {};

  /* ---------- CONTRACT & PRIVILEGES ---------- */
  const srcRec = raw.bs?.source?.result?.[0] ?? {};
  const verified = !!srcRec?.SourceCode && srcRec.SourceCode.length > 0;
  findings.push(P(verified, 10, verified ? "Source verified on BaseScan" : "Source not verified", "verified"));

  const isProxy = /proxy/i.test(srcRec?.Proxy ?? "") || /proxy/i.test(srcRec?.ContractName ?? "");
  const hasImpl = !!srcRec?.Implementation;
  const proxyOk = !isProxy || (isProxy && !srcRec?.Implementation?.startsWith("0x000000"));
  findings.push(P(proxyOk, 6, isProxy ? (hasImpl ? "Upgradeable proxy detected" : "Proxy w/out impl") : "No proxy risk detected", "proxy"));

  const ownerAddr = await guessOwner(address);
  const renounced = isZeroAddress(ownerAddr) || isDeadAddress(ownerAddr);
  findings.push(P(renounced, 8, renounced ? "Ownership renounced/0xdead" : `Owner retains privileges: ${ownerAddr}`, "owner"));

  // GoPlus flags
  const gpRec = first(gpToArr(raw.gp));
  if (gpRec) {
    const hasBlacklist = anyTrue([gpRec?.can_blacklist, gpRec?.is_blacklisted, gpRec?.is_anti_whale, gpRec?.is_whitelisted]);
    findings.push(P(!hasBlacklist, 6, hasBlacklist ? "Blacklist/whitelist/anti-whale controls present" : "No restrictive transfer controls", "blacklist"));
  }

  /* ---------- SUPPLY & HOLDERS ---------- */
  const holderList: any[] = raw.bs?.holders?.result ?? [];
  const holderDataOk = Array.isArray(holderList) && holderList.length > 0;

  if (holderDataOk) {
    const total = sum(holderList.map((h: any) => Number(hTokenQty(h))));
    const top = Number(hTokenQty(holderList?.[0]) || 0);
    const topPct = total > 0 ? pct(top, total) : undefined;
    if (typeof topPct === "number") {
      metrics.topHolderPct = topPct;
      findings.push(P(topPct < 20, 8, `Top holder ${topPct.toFixed(1)}%`, "holder_concentration"));
    }

    const teamLike = approxTeamPct(holderList);
    findings.push(P(teamLike < 10, 6, `Team/contract-like balances ~${teamLike.toFixed(1)}%`, "team_balance"));

    const airdropNoise = suspiciousAirdrop(holderList);
    findings.push(P(!airdropNoise, 6, airdropNoise ? "Suspicious airdrop pattern" : "No suspicious airdrop concentration", "airdrops"));
  }

  /* ---------- LIQUIDITY ---------- */
  const mainPair = pickMainPair(raw.dx);
  if (mainPair) {
    const liqUSD = mainPair?.liquidity?.usd ?? 0;
    metrics.liquidityUSD = liqUSD;
    // Only grade liquidity if we have a numeric value (0 is allowed; it’s just a low score)
    if (typeof liqUSD === "number") {
      findings.push(P(liqUSD >= 50_000, 10, `Liquidity ~$${Math.round(liqUSD).toLocaleString()}`, "liquidity_depth"));
    }

    // LP lock signal (requires GoPlus)
    if (gpRec) {
      const lpLocked =
        parseBool(gpRec?.is_in_dex) &&
        (gpRec?.lp_holders ?? []).some((h: any) => /unicrypt|team\.finance|pinklock|mudra|goplus/i.test(`${h?.name || ""} ${h?.address || ""}`));
      findings.push(P(lpLocked, 6, lpLocked ? "LP tokens locked/burned" : "LP lock unknown", "lp_lock"));

      const recentPulls = Boolean(gpRec?.is_recent_honeypot ?? false) || (gpRec?.is_mintable === "1" && Number(gpRec?.owner_balance) > 0);
      findings.push(P(!recentPulls, 4, recentPulls ? "Recent LP pull / mint risk flags" : "No recent LP pulls detected", "lp_pulls"));
    }
  }

  /* ---------- MARKET BEHAVIOR ---------- */
  if (mainPair && mainPair?.txns?.h24) {
    const buy = Number(mainPair?.txns?.h24?.buys ?? 0);
    const sell = Number(mainPair?.txns?.h24?.sells ?? 0);

    if (buy || sell) {
      const ratioOk = sell === 0 ? buy > 0 : buy / sell >= 0.5 && buy / sell <= 2.0;
      metrics.buySellRatio = sell === 0 ? "∞" : (buy / sell).toFixed(2);
      findings.push(P(ratioOk, 6, ratioOk ? "Balanced 24h buy/sell" : "Skewed 24h order flow", "buy_sell_ratio"));
    }
  }

  if (gpRec) {
    const taxSwing = Number(gpRec?.sell_tax ?? 0) - Number(gpRec?.buy_tax ?? 0);
    const taxSwingOk = Math.abs(taxSwing) <= 10;
    findings.push(P(taxSwingOk, 4, `Tax swing Δ ${taxSwing}%`, "tax_swing"));
  }

  /* ---------- SECURITY SIGNALS ---------- */
  if (raw.hp) {
    const hpOK = raw.hp?.IsHoneypot === false || raw.hp?.honeypotResult === "NOT_HONEYPOT" || raw.hp?.ok === true;
    findings.push(P(!!hpOK, 6, hpOK ? "Honeypot check passed" : "Honeypot risk detected", "honeypot"));
  }
  if (gpRec) {
    const gpSafe = gpOK(gpRec);
    findings.push(P(gpSafe, 6, gpSafe ? "GoPlus: OK" : "GoPlus flags raised", "goplus"));
  }

  const socialsOk = !!(srcRec?.SocialProfiles || srcRec?.Email);
  findings.push(P(socialsOk, 3, socialsOk ? "Socials present on explorer" : "Missing socials on explorer", "socials"));

  /* ---------- SCORE/grade ---------- */
  const score = scoreFromFindings(findings);
  const grade = scoreToGrade(score);

  // top 6 most weighty
  const summary = findings.slice().sort((a, b) => b.weight - a.weight).slice(0, 6);

  // Name/symbol
  const name = srcRec?.ContractName || mainPair?.baseToken?.name;
  const symbol = srcRec?.Symbol || mainPair?.baseToken?.symbol;

  return {
    address,
    chainId: 8453,
    name,
    symbol,
    score,
    grade,
    summary,
    findings,
    metrics,
    imageUrl: "",
    permalink: "",
    sources: {
      basescan: "BaseScan contract + holder + tokeninfo",
      goplus: "GoPlus token security",
      dexscreener: "DEX Screener pairs + liquidity + txns",
      honeypot: "Honeypot.is",
    },
  };
}

/* ---------------- helpers ---------------- */
function scoreFromFindings(f: Finding[]) {
  const sumScore = f.reduce((a, i) => a + (i.ok ? i.weight : 0), 0);
  const max = f.reduce((a, i) => a + i.weight, 0);
  if (max === 0) return 0;
  return Math.round(clamp((sumScore / max) * 100, 0, 100));
}
function scoreToGrade(s: number) { return s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F"; }

function first<T>(x: any): T | undefined {
  return Array.isArray(x?.result) ? x.result[0] : Array.isArray(x) ? x[0] : x?.result ?? x;
}
function gpToArr(gp: any) { return gp?.result && typeof gp.result === "object" ? Object.values(gp.result) : []; }
function anyTrue(v: any[]) { return v.some((x) => x === true || x === 1 || x === "1"); }
function sum(a: number[]) { return a.reduce((x, y) => x + y, 0); }

function pickMainPair(dx: any) {
  const pairs = dx?.pairs ?? [];
  if (!pairs.length) return undefined;
  return (
    pairs
      .filter((p: any) => (p?.chainId ?? "").toString().toLowerCase() === "base")
      .sort((a: any, b: any) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0))[0] ?? pairs[0]
  );
}

async function guessOwner(addr: Address): Promise<string> {
  try {
    const owner: string = await (baseClient as any).readContract({ address: addr, abi: ERC20 as any, functionName: "owner" });
    return owner;
  } catch {
    try {
      const owner2: string = await (baseClient as any).readContract({ address: addr, abi: ERC20 as any, functionName: "getOwner" });
      return owner2;
    } catch {
      return "0x0000000000000000000000000000000000000000";
    }
  }
}
const DEAD = "0x000000000000000000000000000000000000dEaD";
function isZeroAddress(a?: string) { return (a || "").toLowerCase() === "0x0000000000000000000000000000000000000000"; }
function isDeadAddress(a?: string) { return (a || "").toLowerCase() === DEAD.toLowerCase(); }

function hTokenQty(h: any): number | string | undefined {
  return h?.TokenHolderQuantity ?? h?.Balance ?? 0;
}
function approxTeamPct(holders: any[]): number {
  const interesting = holders.filter((h: any) => /owner|team|marketing|deployer|contract/i.test(h?.TokenHolderAddress || ""));
  const tot = sum(holders.map((h: any) => Number(hTokenQty(h))));
  const team = sum(interesting.map((h: any) => Number(hTokenQty(h))));
  return tot > 0 ? pct(team, tot) : 0;
}
function suspiciousAirdrop(holders: any[]): boolean {
  const q = holders.map((h: any) => Number(hTokenQty(h))).filter(Boolean).sort((a, b) => a - b);
  if (q.length < 20) return false;
  let equalRuns = 0;
  for (let i = 1; i < q.length; i++) if (Math.abs(q[i] - q[i - 1]) < 1e-9) equalRuns++;
  return equalRuns > 20;
}
function parseBool(v: any) { return `${v}` === "1" || v === true; }
function gpOK(g: any) {
  if (!g) return false;
  const bad = anyTrue([
    g.is_honeypot, g.is_blacklisted, g.trading_cooldown,
    Number(g.sell_tax) > 20, Number(g.buy_tax) > 20,
    g.is_mintable, g.is_proxy && !g.proxy_implementation,
  ]);
  return !bad;
}
