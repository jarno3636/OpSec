// lib/opsec/sources.ts
import type { Address } from "viem";

const TIMEOUT = Number(process.env.FETCH_TIMEOUT_MS || 12000);

async function j(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "Accept": "application/json",
        ...(init?.headers ?? {}),
      },
      // Avoid caching on the edge for freshness
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.json();
  } finally {
    clearTimeout(id);
  }
}

/* ---------- BaseScan (Etherscan-compatible) ---------- */
export async function fetchBaseScan(addr: Address) {
  const key = process.env.BASESCAN_KEY || "";
  const base = "https://api.basescan.org/api";
  const q = (p: Record<string, string>) =>
    base + "?" + new URLSearchParams({ ...p, apikey: key }).toString();

  // Contract source / ABI / proxy meta
  const source = await j(
    q({ module: "contract", action: "getsourcecode", address: addr })
  ).catch(() => undefined);

  // Top 100 holders (some plans return empty; we handle gracefully)
  const holders = await j(
    q({
      module: "token",
      action: "tokenholderlist",
      contractaddress: addr,
      page: "1",
      offset: "100",
    })
  ).catch(() => ({ result: [] }));

  // Token info (very reliable for name & symbol)
  const tokeninfo = await j(
    q({ module: "token", action: "tokeninfo", contractaddress: addr })
  ).catch(() => undefined);

  return { source, holders, tokeninfo };
}

/* ---------- DEX Screener (pairs/liquidity/txns) ---------- */
export async function fetchDexScreener(addr: Address) {
  // 1) Try the token endpoint
  const primary = await j(
    `https://api.dexscreener.com/latest/dex/tokens/${addr}`
  ).catch(() => undefined);

  // 2) If no pairs or no Base pair, fall back to search
  let pairs: any[] = primary?.pairs ?? [];
  if (!Array.isArray(pairs) || !pairs.length || !pairs.some((p) => p?.chainId === "base")) {
    const search = await j(
      `https://api.dexscreener.com/latest/dex/search?q=${addr}`
    ).catch(() => undefined);
    const spairs: any[] = search?.pairs ?? [];
    // keep only Base pairs if present, else keep all
    const basePairs = spairs.filter((p: any) => p?.chainId === "base");
    pairs = basePairs.length ? basePairs : spairs;
  }
  return { pairs };
}

/* ---------- GoPlus (token security, lockers, taxes, flags) ---------- */
export async function fetchGoPlus(addr: Address) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  if (process.env.GOPLUS_API_KEY) headers["Authorization"] = process.env.GOPLUS_API_KEY!;
  return await j(url, { headers }).catch(() => undefined);
}

/* ---------- Honeypot.is ---------- */
export async function fetchHoneypot(addr: Address) {
  // Public key is optional; endpoint works without it
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  return await j(url).catch(() => undefined);
}

/* ---------- Resolve name/symbol → address (Base) ---------- */
export async function resolveName(q: string): Promise<Address> {
  const s = await j(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`
  );
  // Prefer Base, then anything
  const basePick =
    s?.pairs?.find((p: any) => p?.chainId === "base" && p?.baseToken?.address)?.baseToken?.address;
  const anyPick = s?.pairs?.[0]?.baseToken?.address;
  const resolved = (basePick || anyPick) as string | undefined;
  if (!resolved) throw new Error("Could not resolve a token on Base from search.");
  // Coerce to Address (Next runtime already validates in route)
  return resolved as Address;
}
