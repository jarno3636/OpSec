// lib/opsec/sources.ts
/* Lightweight data fetchers with generous timeouts and diagnostics */

import type { Address } from "viem";

/* ---------- Timeouts ---------- */
const DEFAULT_TIMEOUT_MS =
  Number(process.env.NEXT_PUBLIC_FETCH_TIMEOUT_MS || process.env.FETCH_TIMEOUT_MS) || 45_000;

/* Small helper to fetch JSON with an AbortController timeout */
async function fetchJson<T = any>(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<{ data: T | null; _diagnostics: any[] }> {
  const diag: any[] = [{ ts: Date.now(), url }];
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort("timeout"), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        ...(init.headers || {}),
        "content-type": "application/json",
      },
      next: { revalidate: 0 },
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      diag.push({ warn: "non-json", preview: text?.slice?.(0, 280) });
    }
    if (!res.ok) {
      diag.push({ error: "bad_status", status: res.status, bodyPreview: text?.slice?.(0, 280) });
      return { data: json, _diagnostics: diag };
    }
    return { data: json, _diagnostics: diag };
  } catch (e: any) {
    diag.push({ error: e?.message || "fetch_failed" });
    return { data: null, _diagnostics: diag };
  } finally {
    clearTimeout(id);
  }
}

/* ---------- BaseScan (source + holders + tokeninfo) ---------- */
export async function fetchBaseScan(address: Address) {
  const key = process.env.BASESCAN_API_KEY || process.env.NEXT_PUBLIC_BASESCAN_API_KEY || "";
  const base = "https://api.basescan.org/api";
  const qs = (p: Record<string, string>) =>
    `${base}?${new URLSearchParams({ ...p, apikey: key }).toString()}`;

  const [source, holders, tokeninfo] = await Promise.all([
    fetchJson(qs({ module: "contract", action: "getsourcecode", address })),
    fetchJson(qs({ module: "token", action: "tokenholderlist", contractaddress: address, page: "1", offset: "50" })),
    fetchJson(qs({ module: "token", action: "tokeninfo", contractaddress: address })),
  ]);

  return {
    source: source.data,
    holders: holders.data,
    tokeninfo: tokeninfo.data,
    _diagnostics: [
      ...(source._diagnostics || []),
      ...(holders._diagnostics || []),
      ...(tokeninfo._diagnostics || []),
    ],
  };
}

/* ---------- Markets (DEX Screener first; fallback GeckoTerminal) ---------- */
export async function fetchMarkets(address: Address) {
  // DEX Screener
  const ds = await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
  // GeckoTerminal fallback (Base = chain "base")
  const gt =
    ds?.data?.pairs?.length
      ? { data: null, _diagnostics: [] }
      : await fetchJson(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${address}?include=pools`);

  // Normalize a minimal pairs view
  const pairs =
    (ds.data?.pairs as any[]) ||
    (gt.data?.data?.relationships?.pools?.data || []).map((p: any) => ({
      chainId: "base",
      pairAddress: p?.id,
    })) ||
    [];

  return {
    pairs,
    raw: { dexscreener: ds.data, geckoterminal: gt.data },
    _diagnostics: [...(ds._diagnostics || []), ...(gt._diagnostics || [])],
  };
}

/* ---------- GoPlus ---------- */
export async function fetchGoPlus(address: Address) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`;
  const res = await fetchJson(url);
  return { result: res.data?.result, _diagnostics: res._diagnostics };
}

/* ---------- Honeypot.is ---------- */
export async function fetchHoneypot(address: Address) {
  // Public UI endpoint returns small JSON snippet too
  const url = `https://honeypot.is/api/v2/IsHoneypot?address=${address}&chain=base`;
  const res = await fetchJson(url);
  return { ...res.data, _diagnostics: res._diagnostics };
}

/* ---------- Socials ---------- */
/**
 * Tries multiple public sources for socials:
 *  - BaseScan tokeninfo/source SocialProfiles/Website
 *  - Farcaster search (if/when public)
 *  - Dexscreener metadata (sometimes includes website)
 * You can extend this safely later.
 */
export async function fetchSocials(address: Address) {
  const diags: any[] = [];

  // 1) BaseScan tokeninfo + source
  const bs = await fetchBaseScan(address);
  diags.push(...(bs._diagnostics || []));
  const ti = bs?.tokeninfo?.result?.[0] || {};
  const src = (bs?.source?.result && bs.source.result[0]) || {};

  const fromBaseScan = {
    website:
      ti?.website ||
      src?.Website ||
      (Array.isArray(src?.SocialProfiles) && src.SocialProfiles.find((s: any) => /http/i.test(s))),
    twitter:
      ti?.twitter ||
      (Array.isArray(src?.SocialProfiles) && src.SocialProfiles.find((s: any) => /twitter\.com/i.test(s))),
    telegram:
      ti?.telegram ||
      (Array.isArray(src?.SocialProfiles) && src.SocialProfiles.find((s: any) => /t\.me|telegram\.me/i.test(s))),
    github:
      ti?.github ||
      (Array.isArray(src?.SocialProfiles) && src.SocialProfiles.find((s: any) => /github\.com/i.test(s))),
    email: src?.Email,
  };

  // 2) Dexscreener enhanced token info may include website/url
  const ds = await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
  diags.push(...(ds._diagnostics || []));
  const dsMeta = (ds.data?.pairs || [])[0]?.info || (ds.data?.info as any) || {};
  const fromDex = {
    website: dsMeta?.website || dsMeta?.web || dsMeta?.url,
    twitter: dsMeta?.twitter,
    telegram: dsMeta?.telegram,
  };

  // normalize
  const uniq = (arr: (string | undefined)[]) =>
    [...new Set(arr.filter((x): x is string => !!x))];

  const links = uniq([
    fromBaseScan.website,
    fromBaseScan.twitter,
    fromBaseScan.telegram,
    fromBaseScan.github,
    fromDex.website,
    fromDex.twitter,
    fromDex.telegram,
  ]);

  return {
    links,
    basescan: fromBaseScan,
    dexscreener: fromDex,
    _diagnostics: diags,
  };
}
