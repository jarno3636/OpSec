export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);
