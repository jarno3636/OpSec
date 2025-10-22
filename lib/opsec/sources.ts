// lib/opsec/sources.ts
import { Address } from "viem";

export interface SourceResult {
  source: string;
  data: Record<string, any>;
  error?: string;
}

/** GoPlus API fetcher */
export async function fetchGoPlus(address: Address): Promise<SourceResult> {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`;
    const r = await fetch(url);
    const j = await r.json();
    const info = j.result?.[address.toLowerCase()] ?? {};

    return {
      source: "GoPlus",
      data: {
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
      }
    };
  } catch (e: any) {
    console.error("[fetchGoPlus] error", e);
    return { source: "GoPlus", data: {}, error: e?.message };
  }
}

/** Honeypot.is API fetcher */
export async function fetchHoneypot(address: Address): Promise<SourceResult> {
  try {
    const url = `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chain=base`;
    const r = await fetch(url);
    const d = await r.json();

    return {
      source: "Honeypot.is",
      data: {
        verdict: d.summary?.risk ?? null,
        honeypot: d.honeypotResult?.isHoneypot ?? null,
        reason: d.honeypotResult?.honeypotReason ?? null,
        buyTax: d.simulationResult?.buyTax ?? null,
        sellTax: d.simulationResult?.sellTax ?? null,
        transferTax: d.simulationResult?.transferTax ?? null,
        canBuy: d.simulationResult?.canBuy ?? null,
        canSell: d.simulationResult?.canSell ?? null,
        gas: {
          buy: d.simulationResult?.buyGas ?? null,
          sell: d.simulationResult?.sellGas ?? null,
        },
        holderStats: d.holderAnalysis ?? null,
        contractCode: d.contractCode ?? null,
      }
    };
  } catch (e: any) {
    console.error("[fetchHoneypot] error", e);
    return { source: "Honeypot.is", data: {}, error: e?.message };
  }
}

/** Additional generic risk source placeholder */
export async function fetchAdditionalRisk(address: Address): Promise<SourceResult> {
  try {
    // placeholder URL — insert real API as required
    const url = `https://api.example.com/token_risk?address=${address}&chain=base`;
    const r = await fetch(url);
    const d = await r.json();

    return {
      source: "AdditionalRisk",
      data: {
        riskLevel: d.riskLevel ?? null,
        flagged: d.flagged ?? null,
        details: d.details ?? null,
      }
    };
  } catch (e: any) {
    console.error("[fetchAdditionalRisk] error", e);
    return { source: "AdditionalRisk", data: {}, error: e?.message };
  }
}
