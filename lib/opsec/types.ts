export type Finding = { key: string; ok: boolean; weight: number; note: string };
export type MetricMap = {
  liquidityUSD?: number;
  topHolderPct?: number;
  buySellRatio?: string | number;
};
export type OpSecReport = {
  address: `0x${string}`;
  chainId: number;
  symbol?: string;
  name?: string;
  score: number;
  grade: "A"|"B"|"C"|"D"|"F";
  summary: Finding[];
  findings: Finding[];
  metrics: MetricMap;
  imageUrl: string;
  permalink: string;
  sources: Record<string, string>;
};
