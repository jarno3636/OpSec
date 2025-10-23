import { composeCast } from "./miniapp";

/* ---------- OpSec share config ---------- */
export const FARCASTER_MINIAPP_LINK =
  "https://farcaster.xyz/miniapps/Qf8jBZwyZkJZ/opsec--token-due-diligence";

/** Fixed banner for embeds (PNG in /public or a CDN URL). */
export const SHARE_IMAGE_URL = (
  process.env.NEXT_PUBLIC_SHARE_IMAGE_URL?.trim() ||
  "https://opsec-mini.vercel.app/opsec-report-banner.PNG"
).replace(/(?<=\S)\/+$/, "");

/* ---------- Randomized, neutral short phrases ---------- */
const MESSAGES = [
  "New token scan complete — view the OpSec report 🧠 #OpSec #CryptoSecurity",
  "Token analyzed with OpSec — see the findings 🔍 #OpSec #Security",
  "OpSec report generated — review details before you trade 🛡️ #DYOR #OpSec",
  "Transparency matters — get the full OpSec breakdown 👀 #OpSec #Web3Security",
  "Token report ready — make informed moves ⚡ #OpSec #Security #DYOR",
  "Latest OpSec analysis — check the report and decide wisely 🧩 #CryptoSafety #OpSec",
  "Independent token report by OpSec — view key findings ⚖️ #OpSec #Transparency",
  "New analysis available — see the OpSec snapshot 🛡️ #OpSec #Audit #Web3",
  "Security check finished — explore the OpSec insights 🔎 #OpSec #DYOR #SmartTrading",
  "Every token tells a story — read the OpSec report 📊 #OpSec #CryptoSecurity",
];

export function randomShareCaption() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

/* ---------- Helpers ---------- */
function safeUrl(input?: string): string {
  if (!input) return "";
  try {
    const u = new URL(input);
    return u.toString();
  } catch {
    return "";
  }
}

/** Warpcast web composer (TEXT + a SINGLE embed). */
export function buildWarpcastCompose({
  text = "",
  embeds = [],
  url = "",
}: {
  text?: string;
  embeds?: string[];
  url?: string;
}) {
  const base = "https://warpcast.com/~/compose";
  const params = new URLSearchParams();
  const caption = (text || "").trim();
  if (caption) params.set("text", caption);
  const e0 = Array.isArray(embeds) && embeds.length ? safeUrl(String(embeds[0])) : "";
  if (e0) params.append("embeds[]", e0);
  return `${base}?${params.toString()}`;
}

/** X intent URL.
 *  ⚠️ We intentionally do NOT pass a separate `url` param to avoid a 2nd link.
 */
export function buildTweetUrl({ text }: { text: string; url?: string }) {
  const u = new URL("https://twitter.com/intent/tweet");
  if (text) u.searchParams.set("text", text);
  return u.toString();
}

/* ---------- Optional: direct programmatic share for Farcaster ---------- */
export async function shareOrCast({
  text,
  embed = SHARE_IMAGE_URL,
}: {
  text: string;
  embed?: string;
}) {
  const e = safeUrl(embed);
  const embeds = e ? [e] : [];
  try {
    const ok = await (composeCast as any)({ text, embeds });
    return !!ok;
  } catch {
    const href = buildWarpcastCompose({ text, embeds });
    const w = window.open(href, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = href;
    return true;
  }
}
