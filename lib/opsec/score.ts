// lib/opsec/score.ts
import type { Address } from "viem";
import { clamp, pct, num } from "./math";
import type { OpSecReport, Finding } from "./types";
import {
  readOwner,
  readEip1967Implementation,
  readErc20Meta,
  readTotalSupply,
  readBalanceOf,
} from "./onchain";

/* ---------- Raw envelope expected from your fetch pipeline ---------- */
type Raw = {
  bs: any;         // BaseScan responses you already gather (source, holders, tokeninfo)
  dx?: any;        // DEXScreener (preferred)
  markets?: any;   // GeckoTerminal fallback
  gp: any;         // GoPlus token_security
  hp: any;         // Honeypot.is response
};

/* ---------- Finding helper with neutral support ---------- */
type FindingV2 = Finding & { neutral?: boolean };
const P = (ok: boolean | null, weight: number, note: string, key: string): FindingV2 => ({
  key,
  ok: ok === null ? true : !!ok,  // treat neutral as "ok" for UI coloring
  neutral: ok === null,
  weight,
  note,
});

/* ---------- Constants ---------- */
const DEAD = "0x000000000000000000000000000000000000dEaD";
const ZERO = "0x0000000000000000000000000000000000000000";

/** Optional: comma-separated list of known locker addresses via env */
const KNOWN_LOCKERS: string[] = (process.env.NEXT_PUBLIC_KNOWN_LOCKERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ---------- Public: main entry ---------- */
export async function computeReport(address: Address, raw: Raw): Promise<OpSecReport> {
  const findings: FindingV2[] = [];
  const metrics: OpSecReport["metrics"] = {};

  /* ===== 1) ERC-20 probe ===== */
  const erc = await readErc20Meta(address);
  if (!erc?.isErc20) findings.push(P(false, 12, "Not an ERC-20 (no decimals/name/symbol)", "erc20"));

  /* ===== 2) Contract & privileges ===== */
  const srcRec = raw.bs?.source?.result?.[0] ?? {};
  const verified = !!srcRec?.SourceCode && srcRec.SourceCode.length > 0;

  // Social presence (from BaseScan tokeninfo or explorer fields)
  const ti = raw.bs?.tokeninfo?.result?.[0] ?? {};
  const socialsPresent =
    !!(ti?.OfficialSite || ti?.Website || ti?.Twitter || ti?.Telegram || ti?.Github ||
       srcRec?.SocialProfiles || srcRec?.Email);

  // Large project heuristic (holderCount or liquidity)
  const holderCount = num(raw.bs?.holders?.result?.length);
  const largeProject = holderCount >= 5000 || num(bestPair(raw)?.liquidity?.usd) >= 1_000_000;

  // v2: partial credit for big unverified projects
  findings.push(
    P(
      verified ? true : largeProject ? true : false,
      8,
      verified ? "Source verified on BaseScan" : (largeProject ? "Source not verified (large project — partial credit)" : "Source not verified"),
      "verified"
    )
  );

  const impl = await readEip1967Implementation(address);
  const isProxyHint =
    /proxy/i.test(srcRec?.Proxy ?? "") || /proxy/i.test(srcRec?.ContractName ?? "");
  const proxyDetected = !!impl || isProxyHint || !!srcRec?.Implementation;
  const hasImpl =
    !!impl || (!!srcRec?.Implementation && !String(srcRec?.Implementation).startsWith("0x000000"));
  findings.push(
    P(!proxyDetected || hasImpl, 5, proxyDetected ? (hasImpl ? "Upgradeable proxy detected" : "Proxy w/out impl") : "No proxy risk detected", "proxy")
  );

  const ownerAddr = String((await readOwner(address)) || ZERO);
  const renounced = isZero(ownerAddr) || isDead(ownerAddr);
  findings.push(
    P(renounced, 8, renounced ? "Ownership renounced/0xdead" : `Owner retains privileges: ${ownerAddr}`, "owner")
  );

  /* ===== 3) Markets / liquidity / LP lock / order flow ===== */
  const mainPair = bestPair(raw); // DEXScreener first, fallback to markets

  if (mainPair) {
    const liqUSD = num(mainPair?.liquidity?.usd);
    if (Number.isFinite(liqUSD)) {
      (metrics as any).liquidityUSD = liqUSD;

      // stronger weight; bonus for ≥ $1M
      const basePass = liqUSD >= 50_000;
      const bonus = liqUSD >= 1_000_000 ? 2 : 0;
      findings.push(P(basePass, 12 + bonus, `Liquidity ~$${Math.round(liqUSD).toLocaleString()}`, "liquidity_depth"));
    }

    // Buy/Sell ratio
    const buy = num(mainPair?.txns?.h24?.buys);
    const sell = num(mainPair?.txns?.h24?.sells);
    const trades = buy + sell;
    if (Number.isFinite(buy) && Number.isFinite(sell)) {
      const MIN_TRADES = 30;
      const ratio = sell === 0 ? (buy > 0 ? Infinity : 0) : buy / sell;
      (metrics as any).buySellRatio = !Number.isFinite(ratio) ? "∞" : ratio.toFixed(2);

      let ok = true;
      if (trades >= MIN_TRADES) ok = ratio >= 0.5 && ratio <= 2.0;
      findings.push(
        P(ok, 5, trades < MIN_TRADES ? "Order flow ~thin market" : ok ? "Balanced 24h buy/sell" : "Skewed 24h order flow", "buy_sell_ratio")
      );
    }

    // Volume / FDV
    const vol24h = num(mainPair?.volume?.h24 ?? mainPair?.h24Volume ?? mainPair?.volume24h);
    const fdv = num(mainPair?.fdv ?? mainPair?.fullyDilutedValuation ?? mainPair?.marketCap ?? 0);
    if (Number.isFinite(vol24h) && vol24h > 0) (metrics as any).volume24hUSD = vol24h;
    if (Number.isFinite(fdv) && fdv > 0) (metrics as any).fdvUSD = fdv;

    if (liqUSD > 0 && fdv > 0) {
      const liqPctFDV = (liqUSD / fdv) * 100;
      findings.push(P(liqPctFDV >= 0.25, 4, `Liquidity/FDV ${liqPctFDV.toFixed(2)}%`, "liq_fdv_ratio"));
    }

    // LP lock (on-chain): read LP token balances for lockers/zero/dead
    const lpAddr: Address | undefined = (mainPair?.pairAddress ?? mainPair?.lpAddress) as Address | undefined;
    if (lpAddr) {
      const [ts, deadBal, zeroBal, ...lockers] = await Promise.all([
        readTotalSupply(lpAddr),
        readBalanceOf(lpAddr, DEAD as Address),
        readBalanceOf(lpAddr, ZERO as Address),
        ...KNOWN_LOCKERS.map((a) => readBalanceOf(lpAddr, a as Address)),
      ]);

      const tsN = num(ts);
      if (tsN > 0) {
        const lockedRaw =
          num(deadBal) + num(zeroBal) + (lockers as (bigint | undefined)[]).reduce((s, b) => s + num(b), 0);
        const lockedPct = pct(lockedRaw, tsN);
        (metrics as any).lpLockedPct = lockedPct;
        findings.push(P(lockedPct >= 50, 6, lockedPct ? `LP locked/burned ~${lockedPct.toFixed(1)}%` : "LP lock unknown", "lp_lock"));
      } else {
        // unknown supply → neutral
        findings.push(P(null, 3, "LP lock unknown (no LP token totalSupply)", "lp_lock"));
      }
    } else {
      findings.push(P(null, 3, "LP address unknown", "lp_lock"));
    }
  } else {
    findings.push(P(false, 6, "No Base DEX pairs found", "markets"));
  }

  /* ===== 4) Holders / distribution ===== */
  const holderList: any[] = Array.isArray(raw.bs?.holders?.result) ? raw.bs.holders.result : [];
  if (holderList.length > 0) {
    const total = sum(holderList.map((h) => num(hTokenQty(h))));
    const topBal = num(hTokenQty(holderList[0]));
    if (total > 0) {
      const topPct = pct(topBal, total);
      (metrics as any).topHolderPct = topPct;
      findings.push(P(topPct < 20, 6, `Top holder ${topPct.toFixed(1)}%`, "holder_concentration"));
    } else {
      findings.push(P(null, 3, "Holder totals unavailable", "holder_concentration"));
    }

    const teamLike = approxTeamPct(holderList);
    findings.push(P(teamLike < 10, 3, `Team/contract-like balances ~${teamLike.toFixed(1)}%`, "team_balance"));
  } else {
    findings.push(P(null, 3, "Holder list unavailable", "holders_fallback"));
  }

  /* ===== 5) Security signals ===== */
  const gpRec: any = first(gpToArr(raw.gp));

  // Honeypot consensus with activity softening
  let honeypotFlag = false;
  if (raw.hp) {
    const hpOK =
      raw.hp?.IsHoneypot === false ||
      raw.hp?.honeypotResult === "NOT_HONEYPOT" ||
      raw.hp?.ok === true;
    honeypotFlag = !hpOK;
  }
  if (gpRec?.is_honeypot === "1" || gpRec?.is_honeypot === 1 || gpRec?.is_honeypot === true) honeypotFlag = true;

  const active = num(mainPair?.txns?.h24?.buys) + num(mainPair?.txns?.h24?.sells) >= 50;
  findings.push(P(!honeypotFlag, active ? 6 : 8, honeypotFlag ? "Honeypot risk detected" : "Honeypot check passed", "honeypot"));

  if (gpRec) {
    const hasRestrictive = anyTrue([
      gpRec?.can_blacklist,
      gpRec?.is_blacklisted,
      gpRec?.is_anti_whale,
      gpRec?.is_whitelisted,
    ]);
    findings.push(P(!hasRestrictive, 6, hasRestrictive ? "Blacklist/whitelist/anti-whale controls present" : "No restrictive transfer controls", "blacklist"));

    const taxSwing = Number(gpRec?.sell_tax ?? 0) - Number(gpRec?.buy_tax ?? 0);
    if (Number.isFinite(taxSwing)) findings.push(P(Math.abs(taxSwing) <= 10, 3, `Tax swing Δ ${taxSwing}%`, "tax_swing"));

    const gpSafe = gpOK(gpRec);
    findings.push(P(gpSafe, 5, gpSafe ? "GoPlus: OK" : "GoPlus flags raised", "goplus"));
  } else {
    findings.push(P(null, 3, "GoPlus data unavailable", "goplus"));
  }

  // Social / transparency presence (new)
  findings.push(
    P(socialsPresent ? true : null, 6, socialsPresent ? "Socials/website present" : "Missing socials on explorer", "socials")
  );

  // Community momentum (new, simple heuristic)
  const socialFollowers = num(ti?.TwitterFollowers ?? ti?.twitter_followers ?? 0);
  const momentum = holderCount >= 5000 || socialFollowers >= 5000;
  findings.push(P(momentum ? true : null, 4, momentum ? "Community momentum detected" : "Momentum data unavailable/low", "momentum"));

  /* ===== 6) Score & identity ===== */
  const score = scoreFromFindingsV2(findings);
  const grade = scoreToGrade(score);

  const summary = findings
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  // Identity preference
  const name = (ti?.tokenName || srcRec?.ContractName || erc?.name || mainPair?.baseToken?.name || "").toString();
  const symbol = (ti?.tokenSymbol || srcRec?.Symbol || erc?.symbol || mainPair?.baseToken?.symbol || "").toString();

  return {
    address,
    chainId: 8453,
    name,
    symbol,
    score,
    grade,
    summary,
    findings,     // includes .neutral flags (harmless to existing UI)
    metrics,      // includes liquidityUSD, topHolderPct, buySellRatio, volume24hUSD, fdvUSD, lpLockedPct
    imageUrl: "",
    permalink: "",
    sources: {
      basescan: "BaseScan: source/holders/tokeninfo",
      goplus: "GoPlus: token_security",
      dexscreener: "DEX Screener/GeckoTerminal: pairs + liquidity + txns",
      honeypot: "Honeypot.is",
      coingecko: "Optional: socials fallback",
    },
  };
}

/* ---------------- helpers ---------------- */

function scoreFromFindingsV2(f: FindingV2[]) {
  let earned = 0;
  let max = 0;
  for (const i of f) {
    max += i.weight;
    if (i.neutral) earned += i.weight * 0.5;  // unknown → half credit
    else if (i.ok) earned += i.weight;        // pass → full credit
  }
  if (max === 0) return 0;
  return Math.round(clamp((earned / max) * 100, 0, 100));
}

function scoreToGrade(s: number) {
  if (s >= 90) return "A";
  if (s >= 80) return "B";
  if (s >= 70) return "C";
  if (s >= 55) return "D";
  return "F";
}

function bestPair(raw: Raw) {
  const pairs = (raw.dx?.pairs ?? raw.markets?.pairs ?? []) as any[];
  if (!Array.isArray(pairs) || !pairs.length) return undefined;
  return pairs
    .slice()
    .sort((a: any, b: any) => {
      const ab = (a?.chainId || "").toString().toLowerCase() === "base" ? 1 : 0;
      const bb = (b?.chainId || "").toString().toLowerCase() === "base" ? 1 : 0;
      if (ab !== bb) return bb - ab;
      return (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0);
    })[0];
}

function first<T>(x: any): T | undefined {
  return Array.isArray(x?.result)
    ? x.result[0]
    : Array.isArray(x)
    ? x[0]
    : x?.result ?? x;
}
function gpToArr(gp: any) {
  return gp?.result && typeof gp.result === "object" ? Object.values(gp.result) : [];
}
function anyTrue(v: any[]) {
  return v.some((x) => x === true || x === 1 || x === "1");
}
function sum(a: number[]) {
  return a.reduce((x, y) => x + y, 0);
}
function isZero(a?: any) {
  return String(a || "").toLowerCase() === "0x0000000000000000000000000000000000000000";
}
function isDead(a?: any) {
  return String(a || "").toLowerCase() === DEAD.toLowerCase();
}
function hTokenQty(h: any): number | string | undefined {
  return h?.TokenHolderQuantity ?? h?.Balance ?? 0;
}
function approxTeamPct(holders: any[]): number {
  const interesting = holders.filter((h: any) =>
    /owner|team|marketing|deployer|contract/i.test(h?.TokenHolderAddress || "")
  );
  const tot = sum(holders.map((h: any) => num(hTokenQty(h))));
  const team = sum(interesting.map((h: any) => num(hTokenQty(h))));
  return tot > 0 ? pct(team, tot) : 0;
}
function gpOK(g: any) {
  if (!g) return false;
  const bad = anyTrue([
    g.is_honeypot,
    g.is_blacklisted,
    g.trading_cooldown,
    Number(g.sell_tax) > 20,
    Number(g.buy_tax) > 20,
    g.is_mintable,
    g.is_proxy && !g.proxy_implementation,
  ]);
  return !bad;
}
