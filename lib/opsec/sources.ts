import type { Address } from "viem";

const TIMEOUT = Number(process.env.FETCH_TIMEOUT_MS || 12000);

async function j(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.json();
  } finally { clearTimeout(id); }
}

/* ---------- BaseScan (Etherscan-compatible) ---------- */
export async function fetchBaseScan(addr: Address) {
  const key = process.env.BASESCAN_KEY || "";
  const base = "https://api.basescan.org/api";
  const q = (p: Record<string,string>) => base + "?" + new URLSearchParams({ ...p, apikey: key }).toString();

  // Contract source + ABI + ownership/proxy hints
  const source = await j(q({ module: "contract", action: "getsourcecode", address: addr }));
  // Top holders (first 100)
  const holders = await j(q({ module: "token", action: "tokenholderlist", contractaddress: addr, page: "1", offset: "100" }));
  // Token info (supply/name/symbol)
  const tokeninfo = await j(q({ module: "token", action: "tokeninfo", contractaddress: addr }));

  return { source, holders, tokeninfo };
}

/* ---------- GoPlus (token security, lockers, taxes, flags) ---------- */
export async function fetchGoPlus(addr: Address) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addr}`;
  const headers: HeadersInit = {};
  if (process.env.GOPLUS_API_KEY) headers["Authorization"] = process.env.GOPLUS_API_KEY!;
  return await j(url, { headers });
}

/* ---------- DEX Screener (pairs/liquidity/txns) ---------- */
export async function fetchDexScreener(addr: Address) {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${addr}`;
  return await j(url, { headers: { "Accept": "application/json" }});
}

/* ---------- Honeypot.is ---------- */
export async function fetchHoneypot(addr: Address) {
  const url = `https://api.honeypot.is/v2/IsHoneypot?chain=base&address=${addr}`;
  return await j(url);
}

/* ---------- Resolve name/symbol → address (Base) ---------- */
export async function resolveName(q: string): Promise<Address> {
  const s = await j(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`);
  const firstBase = s?.pairs?.find((p: any) => p.chainId === "base" && p.baseToken?.address)?.baseToken?.address;
  if (!firstBase) throw new Error("Could not resolve token on Base from search.");
  return firstBase;
}
