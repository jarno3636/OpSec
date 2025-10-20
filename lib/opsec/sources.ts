// lib/opsec/sources.ts
import type { Address } from "viem";

const TIMEOUT = Number(process.env.FETCH_TIMEOUT_MS || 12_000);
const RETRIES = 2; // total attempts = 1 + RETRIES

/* ---------------- core HTTP helpers ---------------- */
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

function shouldRetry(status: number) {
  // retry on timeouts (status 0), 429, and 5xx
  return status === 0 || status === 429 || (status >= 500 && status <= 599);
}

/** Soft JSON fetch with retries + jitter. Never throws. */
async function jSoft<T = any>(
  url: string,
  init?: RequestInit,
  label?: string,
  retries: number = RETRIES
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fetchWithTimeout(url, init);
      const status = res.status;
      let data: any = undefined;
      try {
        data = await res.json();
      } catch {
        const txt = await res.text().catch(() => "");
        if (txt) data = { raw: txt };
      }
      if (!res.ok) {
        const error = (label ? `${label}: ` : "") + `HTTP ${status}`;
        if (attempt <= retries + 1 && shouldRetry(status)) {
          const jitter = Math.random() * 250;
          await sleep(300 * attempt + jitter);
          continue;
        }
        return { ok: false, status, data, error };
      }
      return { ok: true, status, data };
    } catch (e: any) {
      const error = (label ? `${label}: ` : "") + (e?.name === "AbortError" ? "timeout" : (e?.message || "fetch failed"));
      if (attempt <= retries + 1) {
        const jitter = Math.random() * 250;
        await sleep(300 * attempt + jitter);
        continue;
      }
      return { ok: false, status: 0, error };
    }
  }
}

/* ---------------- BaseScan (Etherscan-compatible) ---------------- */
export async function fetchBaseScan(addr: Address) {
  const key = process.env.BASESCAN_KEY || process.env.BASESCAN_API_KEY || "";
  const base = "https://api.basescan.org/api";
  const q = (p: Record<string, string>) =>
    base + "?" + new URLSearchParams({ ...p, apikey: key }).toString();

  const [sourceR, tokeninfoR] = await Promise.all([
    jSoft(q({ module: "contract", action: "getsourcecode", address: addr }), undefined, "BaseScan:source"),
    jSoft(q({ module: "token", action: "tokeninfo", contractaddress: addr }), undefined, "BaseScan:tokeninfo"),
  ]);

  // Holders: some explorers gate this; try BaseScan first, then Covalent (if key provided)
  let holders: any = { result: [] };
  const holdersR = await jSoft(q({
    module: "token",
    action: "tokenholderlist",
    contractaddress: addr,
    page: "1",
    offset: "100",
  }), undefined, "BaseScan:holders");

  if (holdersR.ok && (holdersR.data as any)?.result) {
    holders = holdersR.data;
  } else {
    const cov = await covalentHoldersFallback(addr);
    if (cov) holders = cov;
  }

  return {
    source: sourceR.data ?? null,
    holders,
    tokeninfo: tokeninfoR.data ?? null,
    _errors: [sourceR, holdersR].filter(x => !x.ok).map(x => x.error).filter(Boolean) as string[],
  };
}

/* ---- Covalent fallback for holders (optional) ----
   Set COVALENT_API_KEY to enable this. */
async function covalentHoldersFallback(addr: Address) {
  const key = process.env.COVALENT_API_KEY;
  if (!key) return null;
  const url = `https://api.covalenthq.com/v1/8453/tokens/${addr}/token_holders/?page-size=200&key=${encodeURIComponent(key)}`;
  const r = await jSoft(url, undefined, "Covalent:holders");
  if (!r.ok) return null;
  // Normalize into BaseScan-like { result: [{ TokenHolderAddress, TokenHolderQuantity }] }
  const items = (r.data as any)?.data?.items ?? [];
  const result = items.map((it: any) => ({
    TokenHolderAddress: it.address,
    TokenHolderQuantity: `${it.balance || it.balance_wei || 0}`,
  }));
  return { result };
}

/* ---------------- DEX Screener (+ GeckoTerminal fallback) ---------------- */
export async function fetchDexScreener(addr: Address) {
  // Primary
  const ds = await jSoft(`https://api.dexscreener.com/latest/dex/tokens/${addr}`, { headers: { Accept: "application/json" } }, "DEXScreener");
  if (ds.ok) {
    const pairs = (ds.data as any)?.pairs ?? [];
    return { pairs, _errors: [] as string[] };
  }

  // Fallback: GeckoTerminal (public, rate-limited). Try to include top pools.
  const gt = await jSoft(
    `https://api.geckoterminal.com/api/v2/networks/base/tokens/${addr}?include=top_pools`,
    { headers: { Accept: "application/json" } },
    "GeckoTerminal"
  );

  if (gt.ok) {
    // Normalize into DexScreener-like {pairs: [{ liquidity: {usd}, txns:{h24:{buys,sells}}, baseToken:{name,symbol} }]}
    const data = (gt.data as any)?.data;
    const included = (gt.data as any)?.included ?? [];
    const tokenAttrs = data?.attributes || {};
    const pools = included.filter((i: any) => i.type === "pool");
    const pairs = pools.map((p: any) => {
      const la = p.attributes || {};
      return {
        chainId: "base",
        liquidity: { usd: Number(la.reserve_in_usd || 0) },
        txns: { h24: { buys: Number(la.transactions_24h?.buy_count || 0), sells: Number(la.transactions_24h?.sell_count || 0) } },
        baseToken: { name: tokenAttrs?.name, symbol: tokenAttrs?.symbol },
      };
    });
    return { pairs, _errors: [ds.error!].filter(Boolean) as string[] };
  }

  return { pairs: [], _errors: [ds.error!, gt.error!].filter(Boolean) as string[] };
}

/* ---------------- GoPlus (token security, taxes, flags) ---------------- */
export async function fetchGoPlus(addr: Address) {
  const key = process.env.GOPLUS_API_KEY || "";
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  if (key) { headers["Authorization"] = key; headers["X-API-KEY"] = key; }
  const r = await jSoft(url, { headers }, "GoPlus");
  return r.ok ? (r.data as any) : { result: {}, _errors: [r.error].filter(Boolean) };
}

/* ---------------- Honeypot.is (no key needed) ---------------- */
export async function fetchHoneypot(addr: Address) {
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  const r = await jSoft(url, undefined, "Honeypot.is");
  return r.ok ? (r.data as any) : { ok: false, _errors: [r.error].filter(Boolean) };
}

/* ---------------- Resolve name/symbol → address (Base) ---------------- */
export async function resolveName(qStr: string): Promise<Address> {
  const r = await jSoft(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(qStr)}`, undefined, "DEXScreener:search");
  const firstBase =
    (r.data as any)?.pairs?.find((p: any) => p?.chainId === "base" && p?.baseToken?.address)?.baseToken?.address;
  if (!firstBase) throw new Error("Could not resolve a Base token from that query.");
  return firstBase as Address;
}
