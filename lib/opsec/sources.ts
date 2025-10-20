// lib/opsec/sources.ts
import type { Address } from "viem";

const TIMEOUT = Number(process.env.FETCH_TIMEOUT_MS || 12_000);

/** Strict JSON fetch (throws on !ok). Keep if you want hard-fail in some places. */
async function j(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.json();
  } finally {
    clearTimeout(id);
  }
}

/** Soft JSON fetch: never throws. Returns {ok, data?, status, error?}. */
async function jSoft<T = any>(url: string, init?: RequestInit, label?: string): Promise<{
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    const status = r.status;
    let data: any = undefined;
    try {
      data = await r.json();
    } catch {
      // Some APIs return text on error; swallow parsing error gracefully
      const txt = await r.text().catch(() => "");
      if (txt) data = { raw: txt };
    }
    if (!r.ok) {
      return { ok: false, status, data, error: (label ? `${label}: ` : "") + `HTTP ${status}` };
    }
    return { ok: true, status, data };
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "timeout" : (e?.message || "fetch failed");
    return { ok: false, status: 0, error: (label ? `${label}: ` : "") + msg };
  } finally {
    clearTimeout(id);
  }
}

/* ---------- BaseScan (Etherscan-compatible) ---------- */
export async function fetchBaseScan(addr: Address) {
  // Accept either BASESCAN_KEY or BASESCAN_API_KEY for convenience
  const key = process.env.BASESCAN_KEY || process.env.BASESCAN_API_KEY || "";
  const base = "https://api.basescan.org/api";
  const q = (p: Record<string, string>) =>
    base + "?" + new URLSearchParams({ ...p, apikey: key }).toString();

  // Endpoints (soft-fail)
  const sourceP = jSoft(q({ module: "contract", action: "getsourcecode", address: addr }), undefined, "BaseScan:source");
  // Note: some explorers gate holders; we guard and fallback to empty result
  const holdersP = jSoft(q({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" }), undefined, "BaseScan:holders");
  const tokeninfoP = jSoft(q({ module: "token", action: "tokeninfo", contractaddress: addr }), undefined, "BaseScan:tokeninfo");

  const [sourceR, holdersR, tokeninfoR] = await Promise.all([sourceP, holdersP, tokeninfoP]);

  return {
    source: sourceR.data ?? null,
    holders: holdersR.data ?? { result: [] },
    tokeninfo: tokeninfoR.data ?? null,
    _errors: [sourceR, holdersR, tokeninfoR].filter(x => !x.ok).map(x => x.error).filter(Boolean) as string[],
  };
}

/* ---------- GoPlus (token security, lockers, taxes, flags) ---------- */
export async function fetchGoPlus(addr: Address) {
  const key = process.env.GOPLUS_API_KEY || "";
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  // Different deployments use different headers; support a couple
  if (key) {
    headers["Authorization"] = key;
    headers["X-API-KEY"] = key;
  }
  const r = await jSoft(url, { headers }, "GoPlus");
  return r.ok ? (r.data as any) : { result: {}, _errors: [r.error].filter(Boolean) };
}

/* ---------- DEX Screener (pairs/liquidity/txns) ---------- */
export async function fetchDexScreener(addr: Address) {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${addr}`;
  const r = await jSoft(url, { headers: { Accept: "application/json" } }, "DEXScreener");
  const pairs = (r.data as any)?.pairs ?? [];
  return { pairs, _errors: r.ok ? [] : [r.error].filter(Boolean) };
}

/* ---------- Honeypot.is ---------- */
export async function fetchHoneypot(addr: Address) {
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  const r = await jSoft(url, undefined, "Honeypot.is");
  return r.ok ? (r.data as any) : { ok: false, _errors: [r.error].filter(Boolean) };
}

/* ---------- Resolve name/symbol → address (Base) ---------- */
export async function resolveName(qStr: string): Promise<Address> {
  // Use DEX Screener search to find the most relevant Base token by name/symbol
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(qStr)}`;
  const r = await jSoft(url, undefined, "DEXScreener:search");
  const firstBase =
    (r.data as any)?.pairs?.find((p: any) => p?.chainId === "base" && p?.baseToken?.address)?.baseToken?.address;

  if (!firstBase) {
    throw new Error("Could not resolve a Base token from that query.");
  }
  return firstBase as Address;
}
