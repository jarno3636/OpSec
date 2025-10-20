// lib/opsec/sources.ts
import type { Address } from "viem";

/** -------- generic fetch helpers with retry/backoff -------- */
const UA = "opsec-miniapp/1.0";
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 12000);
const MAX_RETRIES = 3;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function backoffDelay(attempt: number) {
  // 250ms, 500ms, 1000ms + small jitter
  const base = 250 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 100);
  return base + jitter;
}

async function getJSON(url: string, init: RequestInit = {}) {
  let lastErr: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        headers: { "Accept": "application/json", "User-Agent": UA, ...(init.headers || {}) },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.json();
    } catch (e: any) {
      lastErr = e;
      if (attempt < MAX_RETRIES) await sleep(backoffDelay(attempt));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

/** -------- BaseScan (Etherscan-compatible) --------
 * Use v2 first (documented in Etherscan docs) then fall back to classic /api
 */
export async function fetchBaseScan(addr: Address) {
  const key = process.env.BASESCAN_KEY || "";
  const host = "https://api.basescan.org";
  // v2 style
  const q2 = (p: Record<string, string>) =>
    `${host}/v2/api?` + new URLSearchParams({ ...p, chainid: "8453", apikey: key }).toString();
  // v1 style
  const q1 = (p: Record<string, string>) =>
    `${host}/api?` + new URLSearchParams({ ...p, apikey: key }).toString();

  async function getSource() {
    // try v2, then v1
    try { return await getJSON(q2({ module: "contract", action: "getsourcecode", address: addr })); }
    catch { return await getJSON(q1({ module: "contract", action: "getsourcecode", address: addr })); }
  }
  async function getHolders() {
    try { return await getJSON(q2({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" })); }
    catch { return await getJSON(q1({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" })); }
  }
  async function getTokenInfo() {
    try { return await getJSON(q2({ module: "token", action: "tokeninfo", contractaddress: addr })); }
    catch { return await getJSON(q1({ module: "token", action: "tokeninfo", contractaddress: addr })); }
  }

  const [source, holders, tokeninfo] = await Promise.all([
    getSource().catch(() => ({ result: [] })),
    getHolders().catch(() => ({ result: [] })),
    getTokenInfo().catch(() => ({ result: [] })),
  ]);

  return { source, holders, tokeninfo };
}

/** -------- DEX Screener (pairs/liquidity/txns) --------
 * If /tokens/:address doesn’t include Base pairs, fall back to /search?q=
 */
export async function fetchDexScreener(addr: Address) {
  const byToken = await getJSON(`https://api.dexscreener.com/latest/dex/tokens/${addr}`)
    .catch(() => ({ pairs: [] }));

  let pairs = Array.isArray(byToken?.pairs) ? byToken.pairs : [];

  // Filter for Base; if not found, try search
  let basePairs = pairs.filter((p: any) => (p?.chainId || "").toLowerCase() === "base");

  if (!basePairs.length) {
    const s = await getJSON(`https://api.dexscreener.com/latest/dex/search?q=${addr}`)
      .catch(() => ({ pairs: [] }));
    const spairs = Array.isArray(s?.pairs) ? s.pairs : [];
    basePairs = spairs.filter((p: any) => (p?.chainId || "").toLowerCase() === "base");
  }

  return { pairs: basePairs };
}

/** -------- GoPlus (token security) --------
 * 8453 is Base. Authorization header is optional; many endpoints work without.
 */
export async function fetchGoPlus(addr: Address) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  if (process.env.GOPLUS_API_KEY) headers["Authorization"] = process.env.GOPLUS_API_KEY!;
  const r = await getJSON(url, { headers }).catch(() => null);
  return r ?? { result: {} };
}

/** -------- Honeypot.is --------
 * Per docs, API key is **not required** right now.
 */
export async function fetchHoneypot(addr: Address) {
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  const r = await getJSON(url).catch(() => null);
  return r ?? {};
}

/** -------- Resolve name/symbol → address on Base (via DEXScreener search) -------- */
export async function resolveName(q: string): Promise<Address> {
  const s = await getJSON(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`);
  const firstBase = s?.pairs?.find((p: any) => (p.chainId || "").toLowerCase() === "base" && p.baseToken?.address)?.baseToken?.address;
  if (!firstBase) throw new Error("Could not resolve token on Base from search.");
  return firstBase as Address;
}
