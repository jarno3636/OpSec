import { Address } from "viem";

/* ---------------------------- Honeypot.is ---------------------------- */
export async function fetchHoneypot(address: Address) {
  try {
    const url = `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chain=base`;
    const r = await fetch(url, { headers: { "User-Agent": "OpSec-Aggregator" } });
    const data = await r.json();

    return {
      source: "Honeypot.is",
      verdict: data.summary?.risk ?? "unknown",
      honeypot: data.honeypotResult?.isHoneypot ?? null,
      reason: data.honeypotResult?.honeypotReason ?? null,
      buyTax: data.simulationResult?.buyTax,
      sellTax: data.simulationResult?.sellTax,
      transferTax: data.simulationResult?.transferTax,
      canBuy: data.simulationResult?.canBuy,
      canSell: data.simulationResult?.canSell,
      gas: {
        buy: data.simulationResult?.buyGas,
        sell: data.simulationResult?.sellGas,
      },
      holderStats: data.holderAnalysis ?? {},
      contractCode: data.contractCode ?? {},
    };
  } catch (e) {
    console.error("[fetchHoneypot] error", e);
    return { source: "Honeypot.is", verdict: "error", error: e?.message };
  }
}

/* ---------------------------- GoPlus ---------------------------- */
export async function fetchGoPlus(address: Address) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`;
    const r = await fetch(url);
    const data = await r.json();
    const info = data.result?.[address.toLowerCase()] ?? {};

    return {
      source: "GoPlus",
      isHoneypot: info.is_honeypot ?? null,
      isProxy: info.is_proxy ?? null,
      canTakeBackOwnership: info.can_take_back_ownership ?? null,
      cannotBuy: info.cannot_buy ?? null,
      cannotSellAll: info.cannot_sell_all ?? null,
      isMintable: info.is_mintable ?? null,
      isBlacklist: info.is_blacklisted ?? null,
      tax: {
        buy: info.buy_tax ?? null,
        sell: info.sell_tax ?? null,
      },
      ownership: info.owner_address ?? null,
      slippageModifiable: info.slippage_modifiable ?? null,
    };
  } catch (e) {
    console.error("[fetchGoPlus] error", e);
    return { source: "GoPlus", verdict: "error", error: e?.message };
  }
}
