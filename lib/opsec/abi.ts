// --- Standard, safe to call everywhere ---
export const ERC20_METADATA = [
  { type: "function", name: "name",        stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol",      stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals",    stateMutability: "view", inputs: [], outputs: [{ type: "uint8"  }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256"}] },
] as const;

// OpenZeppelin Ownable variants
export const OWNABLE = [
  { type: "function", name: "owner",     stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  // many tokens expose this alt spelling via some generators:
  { type: "function", name: "getOwner",  stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;

// OpenZeppelin Pausable
export const PAUSABLE = [
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
] as const;

// --- Optional / non-standard: call defensively, never assume presence ---
// Blacklist-like surfaces (very inconsistent across tokens)
export const BLACKLISTY = [
  { type: "function", name: "isBlacklisted", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] },
  // some use "blacklist" mapping getter
  { type: "function", name: "blacklist",     stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] },
] as const;

// Tax-like getters (names vary heavily)
export const TAXY = [
  { type: "function", name: "taxFee",  stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "buyTax",  stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "sellTax", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  // other common ones you might bump into:
  { type: "function", name: "totalBuyTax",   stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSellTax",  stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

// EIP-1967 well-known storage slots (implementation/admin). Read via eth_getStorageAt.
export const ERC1967_SLOTS = {
  // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
  IMPLEMENTATION:
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
  // bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
  ADMIN:
    "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
} as const;
