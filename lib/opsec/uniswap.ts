// lib/opsec/uniswap.ts
import type { Address } from "viem";

// Default public subgraph (override via env if you have your own mirror/caching)
// Known default for Base (Uniswap v3) — override if this changes:
const UNI_V3_SUBGRAPH =
  process.env.UNISWAP_V3_SUBGRAPH_URL ||
  "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-base";

type GqlPool = {
  id: string;
  feeTier: string;
  token0: { id: string; symbol: string; name: string };
  token1: { id: string; symbol: string; name: string };
  totalValueLockedUSD: string;
  volumeUSD: string;
  txCount: string;
};

async function gql<T = any>(query: string, variables?: Record<string, any>) {
  const r = await fetch(UNI_V3_SUBGRAPH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return (await r.json()) as { data?: T };
}

export async function fetchUniswapV3Pairs(addr: Address) {
  const q = `
    query Pools($t: String!) {
      a: pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc, where: { token0: $t }) {
        id feeTier totalValueLockedUSD volumeUSD txCount
        token0 { id symbol name } token1 { id symbol name }
      }
      b: pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc, where: { token1: $t }) {
        id feeTier totalValueLockedUSD volumeUSD txCount
        token0 { id symbol name } token1 { id symbol name }
      }
    }`;
  const { data } = await gql<{ a: GqlPool[]; b: GqlPool[] }>(q, { t: addr.toLowerCase() });
  const pools = [...(data?.a ?? []), ...(data?.b ?? [])];

  // Normalize to a DexScreener-like "pair" we already consume downstream
  const pairs = pools.map((p) => {
    const isBase = p.token0.id.toLowerCase() === addr.toLowerCase();
    const baseToken = isBase ? p.token0 : p.token1;
    return {
      chainId: "base",
      dexId: "uniswap-v3",
      pairAddress: p.id,
      url: `https://app.uniswap.org/explore/pools/base/${p.id}`,
      baseToken: {
        address: baseToken.id,
        name: baseToken.name,
        symbol: baseToken.symbol,
      },
      liquidity: { usd: Number(p.totalValueLockedUSD) || 0 },
      // v3 doesn’t expose h24 txns directly here; leave txns undefined
      txns: undefined,
      meta: { feeTier: Number(p.feeTier) },
    };
  });

  return pairs;
}
