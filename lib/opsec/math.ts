// lib/opsec/math.ts

/** Clamp to [lo, hi] */
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Percent helper (0–100) */
export const pct = (num: number, den: number) =>
  den > 0 ? (num / den) * 100 : 0;

/** Safe number coerce for number | string | bigint | undefined */
export const num = (v: unknown): number => {
  if (typeof v === "bigint") return Number(v);
  const n = Number((v as any) ?? 0);
  return Number.isFinite(n) ? n : 0;
};
