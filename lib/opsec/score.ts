// lib/opsec/score.ts
import type { Address } from "viem";
import { clamp, pct } from "./math";
import type { OpSecReport, Finding } from "./types";
import {
  readOwner,
  readEip1967Implementation,
  readErc20Meta,
  readTotalSupply,
  readBalanceOf,
} from "./onchain";

type Raw = {
  bs: any;
  dx?: any;
  markets?: any;
  gp: any;
  hp: any;
};

const P = (ok: boolean, weight: number, note: string, key: string): Finding => ({
  key,
  ok,
  weight,
  note,
});

const DEAD = "0x000000000000000000000000000000000000dEaD";
const ZERO = "0x0000000000000000000000000000000000000000";

/** Optional: comma-separated list of known locker addresses via env */
const KNOWN_LOCKERS: string[] = (process.env.NEXT_PUBLIC_KNOWN_LOCKERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export async function computeReport(address: Address, raw: Raw): Promise<OpSecReport> {
  const findings: Finding[] = [];
  const metrics: OpSecReport["metrics"] = {};

  /* ---------- ERC-20 PROBE ---------- */
  const erc = await readErc20Meta(address);
  if (!erc?.isErc20) {
    findings.push(P(false, 12, "Not an ERC-20 (no decimals/name/symbol)", "erc20"));
  }

  /* ---------- CONTRACT & PRIVILEGES ---------- */
  const srcRec = raw.bs?.source?.result?.[0] ?? {};
  const verified = !!srcRec?.SourceCode && srcRec.SourceCode.length > 0;
  findings.push(
    P(verified, 10, verified ? "Source verified on BaseScan" : "Source not verified", "verified")
  );

  const impl = await readEip1967Implementation(address);
  const isProxyHint =
    /proxy/i.test(srcRec?.Proxy ?? "") || /proxy/i.test(srcRec?.ContractName ?? "");
  const proxyDetected = !!impl || isProxyHint || !!srcRec?.Implementation;
  const hasImpl =
    !!impl || (!!srcRec?.Implementation && !String(srcRec?.Implementation).startsWith("0x000000"));
  findings.push(
    P(
      !proxyDetected || hasImpl,
      6,
      proxyDetected ? (hasImpl ? "Upgradeable proxy detected" : "Proxy w/out impl") : "No proxy risk detected",
      "proxy"
    )
  );

  const ownerAddr = String((await readOwner(address)) || ZERO);
  const renounced = isZero(ownerAddr) || isDead(ownerAddr);
  findings.push(
    P(
      renounced,
      8,
      renounced ? "Ownership renounced/0xdead" : `Owner retains privileges: ${ownerAddr}`,
      "owner"
    )
  );

  /* ---------- SUPPLY & HOLDERS ---------- */
  const holderList: any[] = Array.isArray(raw.bs?.holders?.result) ? raw.bs.holders.result : [];
  if (holderList.length > 0) {
    const total = sum(holderList.map((h) => num(hTokenQty(h))));
    const top = num(hTokenQty(holderList[0]));
    if (total > 0) {
      const topPct = pct(top, total);
      metrics.topHolderPct = topPct;
      findings.push(
        P(topPct < 20, 8, `Top holder ${topPct.toFixed(1)}%`, "holder_concentration")
      );
    }

    const teamLike = approxTeamPct(holderList);
    findings.push(
      P(
        teamLike < 10,
        5,
        `Team/contract-like balances ~${teamLike.toFixed(1)}%`,
        "team_balance"
      )
    );

    const airdropNoise = suspiciousAirdrop(holderList);
    findings.push(
      P(
        !airdropNoise,
        4,
        airdropNoise ? "Suspicious airdrop pattern" : "No suspicious airdrop concentration",
        "airdrops"
      )
    );
  } else {
    findings.push(
      P(true, 2, "Holder list unavailable — limited scoring on concentration", "holders_fallback")
    );
  }

  /* ---------- MARKETS, LP LOCK, VOLUME/FDV ---------- */
  const pairs = (raw.dx?.pairs ?? raw.markets?.pairs ?? []) as any[];
  const mainPair = pickMainPair(pairs);

  if (mainPair) {
    const liqUSD = num(mainPair?.liquidity?.usd);
    if (isFinite(liqUSD)) {
      metrics.liquidityUSD = liqUSD;
      findings.push(
        P(
          liqUSD >= 50_000,
          10,
          `Liquidity ~$${Math.round(liqUSD).toLocaleString()}`,
          "liquidity_depth"
        )
      );
    }

    // Buy/Sell ratio (ignore thin markets)
    const buy = num(mainPair?.txns?.h24?.buys);
    const sell = num(mainPair?.txns?.h24?.sells);
    const trades = buy + sell;
    if (isFinite(buy) && isFinite(sell)) {
      const MIN_TRADES = 30;
      const ratioOk =
        trades < MIN_TRADES
          ? true
          : sell === 0
          ? buy > 0
          : buy / sell >= 0.5 && buy / sell <= 2.0;
      metrics.buySellRatio = sell === 0 ? (buy > 0 ? "∞" : "0") : (buy / sell).toFixed(2);
      findings.push(
        P(
          ratioOk,
          5,
          trades < MIN_TRADES
            ? "Order flow ~thin market"
            : ratioOk
            ? "Balanced 24h buy/sell"
            : "Skewed 24h order flow",
          "buy_sell_ratio"
        )
      );
    }

    // Volume / FDV sanity
    const vol24h = num(mainPair?.volume?.h24 ?? mainPair?.h24Volume ?? mainPair?.volume24h);
    const fdv = num(
      mainPair?.fdv ?? mainPair?.fullyDilutedValuation ?? mainPair?.marketCap ?? 0
    );
    if (isFinite(vol24h) && vol24h > 0) (metrics as any)["volume24hUSD"] = vol24h;
    if (isFinite(fdv) && fdv > 0) (metrics as any)["fdvUSD"] = fdv;
    if (liqUSD > 0 && fdv > 0) {
      const liqPctFDV = (liqUSD / fdv) * 100;
      findings.push(
        P(liqPctFDV >= 0.25, 4, `Liquidity/FDV ${liqPctFDV.toFixed(2)}%`, "liq_fdv_ratio")
      );
    }

    // LP lock % (on-chain) — using LP token address from DS/GT when present
    const lpAddr: Address | undefined = (mainPair?.pairAddress ?? mainPair?.lpAddress) as
      | Address
      | undefined;
    if (lpAddr) {
      const [ts, deadBal, zeroBal, ...lockers] = await Promise.all([
        readTotalSupply(lpAddr), // bigint | undefined
        readBalanceOf(lpAddr, DEAD as Address), // bigint | undefined
        readBalanceOf(lpAddr, ZERO as Address), // bigint | undefined
        ...KNOWN_LOCKERS.map((a) => readBalanceOf(lpAddr, a as Address)), // (bigint|undefined)[]
      ]);

      const tsN = num(ts);
      if (tsN > 0) {
        const lockedRaw =
          num(deadBal) + num(zeroBal) + (lockers as (bigint | undefined)[]).reduce((s, b) => s + num(b), 0);
        const lockedPct = pct(lockedRaw, tsN);
        (metrics as any)["lpLockedPct"] = lockedPct;
        findings.push(
          P(
            lockedPct >= 50,
            6,
            lockedPct ? `LP locked/burned ~${lockedPct.toFixed(1)}%` : "LP lock unknown",
            "lp_lock"
          )
        );
      }
    }
  } else {
    findings.push(P(false, 6, "No Base DEX pairs found", "markets"));
  }

  /* ---------- SECURITY SIGNALS ---------- */
  const gpRec: any = first(gpToArr(raw.gp));

  // Honeypot consensus & soften on healthy activity
  let honeypotFlag = false;
  if (raw.hp) {
    const hpOK =
      raw.hp?.IsHoneypot === false ||
      raw.hp?.honeypotResult === "NOT_HONEYPOT" ||
      raw.hp?.ok === true;
    honeypotFlag = !hpOK;
  }
  if (gpRec?.is_honeypot === "1" || gpRec?.is_honeypot === 1 || gpRec?.is_honeypot === true)
    honeypotFlag = true;

  const active = num(mainPair?.txns?.h24?.buys) + num(mainPair?.txns?.h24?.sells) >= 50;
  findings.push(
    P(
      !honeypotFlag,
      active ? 4 : 6,
      honeypotFlag ? "Honeypot risk detected" : "Honeypot check passed",
      "honeypot"
    )
  );

  if (gpRec) {
    const hasRestrictive = anyTrue([
      gpRec?.can_blacklist,
      gpRec?.is_blacklisted,
      gpRec?.is_anti_whale,
      gpRec?.is_whitelisted,
    ]);
    findings.push(
      P(
        !hasRestrictive,
        6,
        hasRestrictive
          ? "Blacklist/whitelist/anti-whale controls present"
          : "No restrictive transfer controls",
        "blacklist"
      )
    );

    const taxSwing = Number(gpRec?.sell_tax ?? 0) - Number(gpRec?.buy_tax ?? 0);
    if (isFinite(taxSwing))
      findings.push(P(Math.abs(taxSwing) <= 10, 3, `Tax swing Δ ${taxSwing}%`, "tax_swing"));

    const gpSafe = gpOK(gpRec);
    findings.push(P(gpSafe, 5, gpSafe ? "GoPlus: OK" : "GoPlus flags raised", "goplus"));
  }

  const socialsOk = !!(srcRec?.SocialProfiles || srcRec?.Email);
  findings.push(
    P(
      socialsOk,
      3,
      socialsOk ? "Socials present on explorer" : "Missing socials on explorer",
      "socials"
    )
  );

  /* ---------- SCORE ---------- */
  const score = scoreFromFindings(findings);
  const grade = scoreToGrade(score);

  const summary = findings.slice().sort((a, b) => b.weight - a.weight).slice(0, 6);

  // Identity preference: BaseScan tokeninfo → explorer source → on-chain → market
  const ti = raw.bs?.tokeninfo?.result?.[0] ?? {};
  const name =
    ti?.tokenName || srcRec?.ContractName || erc?.name || mainPair?.baseToken?.name;
  const symbol =
    ti?.tokenSymbol || srcRec?.Symbol || erc?.symbol || mainPair?.baseToken?.symbol;

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
      dexscreener: "DEX Screener / GeckoTerminal pairs + liquidity + txns",
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
function scoreToGrade(s: number) {
  return s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F";
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
function num(v: any): number {
  // handles number | string | bigint | undefined safely
  if (typeof v === "bigint") return Number(v);
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pickMainPair(pairs: any[]) {
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
function suspiciousAirdrop(holders: any[]): boolean {
  const q = holders
    .map((h: any) => num(hTokenQty(h)))
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (q.length < 20) return false;
  let equalRuns = 0;
  for (let i = 1; i < q.length; i++) if (Math.abs(q[i] - q[i - 1]) < 1e-9) equalRuns++;
  return equalRuns > 20;
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
