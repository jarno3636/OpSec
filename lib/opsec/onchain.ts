// lib/opsec/onchain.ts
import { baseClient } from "@/lib/rpc";
import type { Address } from "viem";
import { ERC20_METADATA, OWNABLE, PAUSABLE, BLACKLISTY, TAXY, ERC1967_SLOTS } from "./abi";

async function safeRead<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try { return await fn(); } catch { return undefined; }
}

/** Lightweight ERC-20 probe (+ metadata) */
export async function readErc20Meta(address: Address) {
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "name" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "symbol" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "decimals" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "totalSupply" })),
  ]);
  const isErc20 = Number.isFinite(Number(decimals));
  return { isErc20, name, symbol, decimals, totalSupply };
}

/** (kept for callers that want the raw fields without isErc20) */
export async function readMetadata(address: Address) {
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "name" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "symbol" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "decimals" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: ERC20_METADATA as any, functionName: "totalSupply" })),
  ]);
  return { name, symbol, decimals, totalSupply };
}

/** Generic reads for LP lock % (LP token is an ERC-20) */
export async function readTotalSupply(token: Address) {
  return await safeRead<bigint>(() => (baseClient as any).readContract({ address: token, abi: ERC20_METADATA as any, functionName: "totalSupply" }));
}
export async function readBalanceOf(token: Address, holder: Address) {
  return await safeRead<bigint>(() => (baseClient as any).readContract({ address: token, abi: ERC20_METADATA as any, functionName: "balanceOf", args: [holder] }));
}

export async function readOwner(address: Address) {
  const owner  = await safeRead(() => (baseClient as any).readContract({ address, abi: OWNABLE as any, functionName: "owner" }));
  if (owner && owner !== "0x0000000000000000000000000000000000000000") return owner as string;
  const alt    = await safeRead(() => (baseClient as any).readContract({ address, abi: OWNABLE as any, functionName: "getOwner" }));
  return (alt as string | undefined) ?? (owner as string | undefined) ?? "0x0000000000000000000000000000000000000000";
}

export async function readPaused(address: Address) {
  return await safeRead(() => (baseClient as any).readContract({ address, abi: PAUSABLE as any, functionName: "paused" }));
}

// Optional surfaces — only use for hints; prefer GoPlus for final signals
export async function readBlacklistFlags(address: Address, target?: Address) {
  if (!target) return {};
  const isBlacklisted = await safeRead(() =>
    (baseClient as any).readContract({ address, abi: BLACKLISTY as any, functionName: "isBlacklisted", args: [target] })
  );
  const blacklist = await safeRead(() =>
    (baseClient as any).readContract({ address, abi: BLACKLISTY as any, functionName: "blacklist", args: [target] })
  );
  return { isBlacklisted, blacklist };
}

export async function readTaxHints(address: Address) {
  const [taxFee, buyTax, sellTax, totalBuyTax, totalSellTax] = await Promise.all([
    safeRead(() => (baseClient as any).readContract({ address, abi: TAXY as any, functionName: "taxFee" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: TAXY as any, functionName: "buyTax" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: TAXY as any, functionName: "sellTax" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: TAXY as any, functionName: "totalBuyTax" })),
    safeRead(() => (baseClient as any).readContract({ address, abi: TAXY as any, functionName: "totalSellTax" })),
  ]);
  return { taxFee, buyTax, sellTax, totalBuyTax, totalSellTax };
}

/** Robust proxy detection: read EIP-1967 slots directly */
export async function readEip1967Implementation(address: Address) {
  try {
    const raw = await (baseClient as any).getStorageAt({ address, slot: ERC1967_SLOTS.IMPLEMENTATION });
    const hex = (raw as string || "0x").toLowerCase();
    if (hex === "0x" || /^0x0+$/.test(hex)) return undefined;
    const impl = ("0x" + hex.slice(-40)) as Address; // last 20 bytes
    if (impl.toLowerCase() === "0x0000000000000000000000000000000000000000") return undefined;
    return impl;
  } catch {
    return undefined;
  }
}
