import type { Address } from "viem";

/* ---------------- generic fetch with retry/backoff ---------------- */
const UA = "opsec-miniapp/1.2";
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 12_000);
const MAX_RETRIES = 3;

export type Diag = { name: string; url: string; status?: number; ok: boolean; ms: number; note?: string };
export type UpstreamBundle<T> = T & { _diagnostics: Diag[] };

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function backoff(attempt: number) {
  const base = 250 * Math.pow(2, attempt); // 250, 500, 1000
  const jitter = Math.floor(Math.random() * 120);
  return base + jitter;
}

async function getJSON(
  url: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number } = {}
) {
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const maxRetries = opts.retries ?? MAX_RETRIES;

  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const started = Date.now();
    try {
      const r = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": UA, ...(init.headers || {}) },
        cache: "no-store",
      });
      const ms = Date.now() - started;

      // If server replies non-2xx, surface as Error with status info
      if (!r.ok) {
        const note = `${r.status} ${r.statusText}`;
        const err: any = new Error(note);
        (err.__http = { status: r.status, ms });
        throw err;
      }

      const json = await r.json();
      (json as any).__http = { status: r.status, ms };
      clearTimeout(t);
      return json;
    } catch (e: any) {
      lastErr = e;
      clearTimeout(t);
      // quick exit on 404 to allow fallback
      if (e?.__http?.status === 404) break;
      // no retry left?
      if (attempt >= maxRetries) break;
      await sleep(backoff(attempt));
    }
  }
  throw lastErr;
}

/* ---------------- BaseScan (Etherscan-compatible) ---------------- */
export async function fetchBaseScan(
  addr: Address
): Promise<UpstreamBundle<{ source: any; holders: any; tokeninfo: any }>> {
  const key = process.env.BASESCAN_KEY || "";
  const host = process.env.BASESCAN_HOST || "https://api.basescan.org";
  const q2 = (p: Record<string, string>) =>
    `${host}/v2/api?` + new URLSearchParams({ ...p, chainid: "8453", apikey: key }).toString();
  const q1 = (p: Record<string, string>) =>
    `${host}/api?` + new URLSearchParams({ ...p, apikey: key }).toString();

  const diags: Diag[] = [];
  const shortV2 = 1_200; // ms — keep v2 snappy so we can fall back to v1 quickly

  async function callWithDiag(name: string, url: string, exec: () => Promise<any>, note?: string) {
    const t0 = performance.now();
    try {
      const j = await exec();
      const http = j?.__http || {};
      diags.push({ name, url, status: http.status, ms: http.ms ?? Math.round(performance.now() - t0), ok: true, note });
      return j;
    } catch (e: any) {
      const ms = Math.round(performance.now() - t0);
      const status = e?.__http?.status;
      diags.push({ name, url, ok: false, ms, note: e?.message, status });
      return { __failed: true, __status: status, result: [] };
    }
  }

  // getsourcecode: try v2 (short timeout) → if empty/failed, v1
  const source = await (async () => {
    const u2 = q2({ module: "contract", action: "getsourcecode", address: addr });
    const j2 = await callWithDiag("BaseScan:getsourcecode(v2)", u2, () => getJSON(u2, {}, { timeoutMs: shortV2, retries: 0 }));
    if (!j2.__failed && Array.isArray(j2?.result) && j2.result.length) return j2;

    const u1 = q1({ module: "contract", action: "getsourcecode", address: addr });
    return await callWithDiag("BaseScan:getsourcecode(v1)", u1, () => getJSON(u1), "fallback v1");
  })();

  // tokenholderlist: v2 short → v1
  const holders = await (async () => {
    const u2 = q2({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" });
    const j2 = await callWithDiag("BaseScan:tokenholderlist(v2)", u2, () => getJSON(u2, {}, { timeoutMs: shortV2, retries: 0 }));
    if (!j2.__failed && Array.isArray(j2?.result) && j2.result.length) return j2;

    const u1 = q1({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" });
    return await callWithDiag("BaseScan:tokenholderlist(v1)", u1, () => getJSON(u1), "fallback v1");
  })();

  // tokeninfo: v2 short → v1
  const tokeninfo = await (async () => {
    const u2 = q2({ module: "token", action: "tokeninfo", contractaddress: addr });
    const j2 = await callWithDiag("BaseScan:tokeninfo(v2)", u2, () => getJSON(u2, {}, { timeoutMs: shortV2, retries: 0 }));
    if (!j2.__failed && Array.isArray(j2?.result) && j2.result.length) return j2;

    const u1 = q1({ module: "token", action: "tokeninfo", contractaddress: addr });
    return await callWithDiag("BaseScan:tokeninfo(v1)", u1, () => getJSON(u1), "fallback v1");
  })();

  return { source, holders, tokeninfo, _diagnostics: diags };
}

/* ---------------- Markets (DEX Screener first, GeckoTerminal fallback) ---------------- */
export async function fetchMarkets(addr: Address): Promise<UpstreamBundle<{ pairs: any[] }>> {
  const diags: Diag[] = [];
  const add = (d: Diag) => diags.push(d);

  let pairs: any[] = [];
  // DexScreener by token
  {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${addr}`;
    const t0 = performance.now();
    try {
      const j = await getJSON(url);
      const http = j?.__http || {};
      add({ name: "DexScreener:tokens", url, status: http.status, ms: http.ms ?? Math.round(performance.now() - t0), ok: true, note: "fetch completed or failed gracefully" });
      pairs = (j?.pairs || []).filter((p: any) => (p?.chainId || "").toLowerCase() === "base");
    } catch (e: any) {
      add({ name: "DexScreener:tokens", url, ok: false, ms: Math.round(performance.now() - t0), note: e?.message });
    }
  }

  // GeckoTerminal fallback (if DS empty)
  if (!pairs.length) {
    const url = `https://api.geckoterminal.com/api/v2/networks/base/tokens/${addr}?include=top_pools`;
    const t0 = performance.now();
    try {
      const j = await getJSON(url, { headers: { Accept: "application/json" } });
      const http = j?.__http || {};
      add({ name: "GeckoTerminal:token+top_pools", url, status: http.status, ms: http.ms ?? Math.round(performance.now() - t0), ok: true });

      const pools = Array.isArray(j?.included) ? j.included.filter((x: any) => x?.type === "pool") : [];
      pairs = pools.map((p: any) => {
        const attrs = p?.attributes || {};
        return {
          chainId: "base",
          dexId: attrs?.dex || attrs?.dex_slug,
          url: attrs?.url,
          baseToken: {
            address: addr,
            name: j?.data?.attributes?.name,
            symbol: j?.data?.attributes?.symbol,
          },
          liquidity: { usd: Number(attrs?.reserve_in_usd ?? attrs?.liquidity_usd ?? 0) },
          txns: {
            h24: {
              buys: Number(attrs?.buys_24h ?? 0),
              sells: Number(attrs?.sells_24h ?? 0),
            },
          },
        };
      });
    } catch (e: any) {
      add({ name: "GeckoTerminal:token+top_pools", url, ok: false, ms: Math.round(performance.now() - t0), note: e?.message });
    }
  }

  return { pairs, _diagnostics: diags };
}

/* ---------------- GoPlus (token security) ---------------- */
export async function fetchGoPlus(addr: Address): Promise<UpstreamBundle<{ result: any }>> {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  if (process.env.GOPLUS_API_KEY) headers["Authorization"] = process.env.GOPLUS_API_KEY!;
  const diags: Diag[] = [];
  const t0 = performance.now();
  try {
    const j = await getJSON(url, { headers });
    const http = j?.__http || {};
    diags.push({ name: "GoPlus:token_security", url, status: http.status, ms: http.ms ?? Math.round(performance.now() - t0), ok: true, note: "fetch completed or failed gracefully" });
    return { result: j?.result ?? {}, _diagnostics: diags };
  } catch (e: any) {
    diags.push({ name: "GoPlus:token_security", url, ok: false, ms: Math.round(performance.now() - t0), note: e?.message });
    return { result: {}, _diagnostics: diags };
  }
}

/* ---------------- Honeypot.is ---------------- */
export async function fetchHoneypot(addr: Address): Promise<UpstreamBundle<any>> {
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  const diags: Diag[] = [];
  const t0 = performance.now();
  try {
    const j = await getJSON(url);
    const http = j?.__http || {};
    diags.push({ name: "Honeypot:is", url, status: http.status, ms: http.ms ?? Math.round(performance.now() - t0), ok: true, note: "fetch completed or failed gracefully" });
    return Object.assign(j ?? {}, { _diagnostics: diags });
  } catch (e: any) {
    diags.push({ name: "Honeypot:is", url, ok: false, ms: Math.round(performance.now() - t0), note: e?.message });
    return { _diagnostics: diags };
  }
}
