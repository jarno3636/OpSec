// lib/opsec/sources.ts
// Registry for external sources (handy for fetchers or docs/attribution)

export const DATA_SOURCES = {
  basescan: "https://api.basescan.org/api",
  dexscreener: "https://api.dexscreener.io/latest/dex/",
  geckoterminal: "https://api.geckoterminal.com/api/v2/",
  goplus: "https://api.gopluslabs.io/api/v1/token_security",
  honeypot: "https://api.honeypot.is/v2/IsHoneypot",
  tokensniffer: "https://tokensniffer.com/api",
  coingecko: "https://api.coingecko.com/api/v3/coins",
} as const;

/** Known LP locker addresses (augment via env) */
export const DEFAULT_KNOWN_LOCKERS = [
  // Unicrypt/TeamFinance/PinkLock examples (add more as needed)
  "0x000000000000000000000000000000000000dEaD", // dead
  "0x0000000000000000000000000000000000000000", // zero
] as const;
