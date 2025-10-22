import { Address } from "viem";

/* ------------------------- Honeypot.is ------------------------- */
export async function fetchHoneypot(address: Address) {
  const url = `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chain=base`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    return {
      ok: true,
      source: "Honeypot.is",
      verdict: d.summary?.risk ?? "unknown",
      honeypot: d.honeypotResult?.isHoneypot ?? null,
      reason: d.honeypotResult?.honeypotReason ?? null,
      taxes: {
        buy: d.simulationResult?.buyTax,
        sell: d.simulationResult?.sellTax,
        transfer: d.simulationResult?.transferTax,
      },
      trading: {
        canBuy: d.simulationResult?.canBuy,
        canSell: d.simulationResult?.canSell,
      },
      gas: {
        buy: d.simulationResult?.buyGas,
        sell: d.simulationResult?.sellGas,
      },
    };
  } catch (err) {
    return { ok: false, source: "Honeypot.is", error: String(err) };
  }
}

/* ------------------------- GoPlus ------------------------- */
export async function fetchGoPlus(address: Address) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const info = j.result?.[address.toLowerCase()] ?? {};
    return {
      ok: true,
      source: "GoPlus",
      proxy: info.is_proxy === "1",
      blacklist: info.is_blacklisted === "1",
      mintable: info.is_mintable === "1",
      honeypot: info.is_honeypot === "1",
      owner: info.owner_address,
      taxes: { buy: info.buy_tax, sell: info.sell_tax },
    };
  } catch (err) {
    return { ok: false, source: "GoPlus", error: String(err) };
  }
}

/* ------------------------- DexScreener ------------------------- */
export async function fetchDexscreener(address: Address) {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const p = j.pairs?.[0];
    return {
      ok: true,
      source: "Dexscreener",
      pairUrl: p?.url,
      baseToken: p?.baseToken?.symbol,
      quoteToken: p?.quoteToken?.symbol,
      liquidityUSD: p?.liquidity?.usd ?? 0,
      volume24h: p?.volume?.h24 ?? 0,
      priceUSD: p?.priceUsd ?? 0,
    };
  } catch (err) {
    return { ok: false, source: "Dexscreener", error: String(err) };
  }
}
