// lib/opsec/sources.ts
import type { Address } from "viem";

/** ---------- Small resilient fetch (timeout + retries + jitter) ---------- */
const UA = "opsec-miniapp/1.0";
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 12000);
const MAX_RETRIES = 3;

type Jsonish = Record<string, any> | any[];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function backoffDelay(attempt: number) {
  // 250ms, 500ms, 1000ms (+ jitter 0–100ms)
  const base = 250 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 100);
  return base + jitter;
}

export type FetchResult<T extends Jsonish = any> = {
  ok: boolean;
  status: number;
  ms: number;
  data?: T;
  error?: string;
};

async function getJSON<T extends Jsonish = any>(
  url: string,
  init: RequestInit = {},
  { retries = MAX_RETRIES, timeout = TIMEOUT_MS }: { retries?: number; timeout?: number } = {}
): Promise<FetchResult<T>> {
  let lastErr: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t0 = Date.now();
    const timer = setTimeout(() => ctrl.abort(), timeout);

    try {
      const r = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": UA, ...(init.headers || {}) },
      });

      const ms = Date.now() - t0;
      clearTimeout(timer);

      const text = await r.text();
      let data: any;
      try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }

      // Treat Etherscan-style NOTOK as non-ok
      const etherscanNotOK = typeof data === "object" && data?.status === "0" && data?.message === "NOTOK";

      return {
        ok: r.ok && !etherscanNotOK,
        status: r.status,
        ms,
        data,
        error: r.ok ? (etherscanNotOK ? data?.result || "NOTOK" : undefined) : `${r.status} ${r.statusText}`,
      };
    } catch (e: any) {
      clearTimeout(timer);
      lastErr = e?.name === "AbortError" ? "timeout" : (e?.message || "request_failed");
      if (attempt < retries) await sleep(backoffDelay(attempt));
    }
  }

  return { ok: false, status: 0, ms: 0, error: lastErr || "request_failed" };
}

/** ---------- Diagnostics types (optional, used when ?debug=1) ---------- */
export type UpstreamDiag = {
  name: "BaseScan" | "GoPlus" | "DexScreener" | "Honeypot";
  url: string;
  ok: boolean;
  status: number;
  ms: number;
  note?: string;
};

const redact = (obj: any, bytes = 1200) => {
  try {
    const s = JSON.stringify(obj);
    return s.length > bytes ? JSON.parse(s.slice(0, bytes)) : obj;
  } catch {
    return obj;
  }
};

/** ---------- BaseScan (try v2 then v1) ---------- */
export async function fetchBaseScan(addr: Address, debug = false) {
  const key = process.env.BASESCAN_KEY || "";
  const host = "https://api.basescan.org";
  const q2 = (p: Record<string, string>) =>
    `${host}/v2/api?` + new URLSearchParams({ ...p, chainid: "8453", apikey: key }).toString();
  const q1 = (p: Record<string, string>) =>
    `${host}/api?` + new URLSearchParams({ ...p, apikey: key }).toString();

  const diags: UpstreamDiag[] = [];

  async function call(label: string, v2: string, v1: string) {
    let res = await getJSON(v2);
    diags.push({ name: "BaseScan", url: v2, ok: res.ok, status: res.status, ms: res.ms, note: res.error });
    if (!res.ok) {
      const res2 = await getJSON(v1);
      diags.push({ name: "BaseScan", url: v1, ok: res2.ok, status: res2.status, ms: res2.ms, note: res2.error });
      res = res2;
    }
    return res.data ?? {};
  }

  const [source, holders, tokeninfo] = await Promise.all([
    call("getsourcecode",
      q2({ module: "contract", action: "getsourcecode", address: addr }),
      q1({ module: "contract", action: "getsourcecode", address: addr })
    ).catch(() => ({ result: [] })),
    call("tokenholderlist",
      q2({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" }),
      q1({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" })
    ).catch(() => ({ result: [] })),
    call("tokeninfo",
      q2({ module: "token", action: "tokeninfo", contractaddress: addr }),
      q1({ module: "token", action: "tokeninfo", contractaddress: addr })
    ).catch(() => ({ result: [] })),
  ]);

  return {
    source,
    holders,
    tokeninfo,
    _diag: debug ? diags.map(d => ({ ...d, sample: undefined })) : undefined,
  };
}

/** ---------- DEX Screener (token → search fallback; Base only) ---------- */
export async function fetchDexScreener(addr: Address, debug = false) {
  const urlToken = `https://api.dexscreener.com/latest/dex/tokens/${addr}`;
  const r1 = await getJSON(urlToken);
  const pairs1 = Array.isArray((r1.data as any)?.pairs) ? (r1.data as any).pairs : [];
  let basePairs = pairs1.filter((p: any) => (p?.chainId || "").toLowerCase() === "base");

  const diags: UpstreamDiag[] = [{ name: "DexScreener", url: urlToken, ok: r1.ok, status: r1.status, ms: r1.ms, note: r1.error }];

  if (!basePairs.length) {
    const urlSearch = `https://api.dexscreener.com/latest/dex/search?q=${addr}`;
    const r2 = await getJSON(urlSearch);
    diags.push({ name: "DexScreener", url: urlSearch, ok: r2.ok, status: r2.status, ms: r2.ms, note: r2.error });
    const pairs2 = Array.isArray((r2.data as any)?.pairs) ? (r2.data as any).pairs : [];
    basePairs = pairs2.filter((p: any) => (p?.chainId || "").toLowerCase() === "base");
  }

  return { pairs: basePairs, _diag: debug ? diags : undefined };
}

/** ---------- GoPlus (token security) ---------- */
export async function fetchGoPlus(addr: Address, debug = false) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  if (process.env.GOPLUS_API_KEY) headers["Authorization"] = process.env.GOPLUS_API_KEY!;

  const r = await getJSON(url, { headers });
  return {
    result: r.data ?? { result: {} },
    _diag: debug ? [{ name: "GoPlus", url, ok: r.ok, status: r.status, ms: r.ms, note: r.error }] : undefined,
  };
}

/** ---------- Honeypot.is (no key needed) ---------- */
export async function fetchHoneypot(addr: Address, debug = false) {
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  const r = await getJSON(url);

  const ok = !!r.data && (r.status === 200);
  const IsHoneypot = (r.data as any)?.IsHoneypot;
  const honeypotResult = (r.data as any)?.honeypotResult;

  return {
    ok,
    IsHoneypot,
    honeypotResult,
    _diag: debug ? [{ name: "Honeypot", url, ok: r.ok, status: r.status, ms: r.ms, note: r.error }] : undefined,
  };
}

/** ---------- Optional: name → address (kept for tools/tests) ---------- */
export async function resolveName(q: string): Promise<Address> {
  const s = await getJSON(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`);
  const firstBase = (s.data as any)?.pairs?.find(
    (p: any) => (p.chainId || "").toLowerCase() === "base" && p.baseToken?.address
  )?.baseToken?.address;
  if (!firstBase) throw new Error("Could not resolve token on Base from search.");
  return firstBase as Address;
}
