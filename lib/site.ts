export function getSiteUrl() {
  // Prefer the public URL; fall back to Vercel URL; fall back to localhost
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "";
  return fromEnv || "http://localhost:3000";
}
