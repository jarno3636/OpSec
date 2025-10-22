import { composeCast } from "./miniapp";

/* ---------- OpSec share config ---------- */
/** Your public Farcaster miniapp deep link (hard-coded for reliability). */
export const FARCASTER_MINIAPP_LINK =
  "https://farcaster.xyz/miniapps/Qf8jBZwyZkJZ/opsec--token-due-diligence";

/**
 * Fixed banner used for embeds. Put the exported PNG in /public as:
 *   /public/opsec-report-banner.png
 * (or host it on your CDN and point this URL to it)
 */
export const SHARE_IMAGE_URL =
  (process.env.NEXT_PUBLIC_SHARE_IMAGE_URL?.trim() ||
    "https://opsec-mini.vercel.app/opsec-report-banner.PNG").replace(/(?<=\S)\/+$/,"");

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

/* ---------- Helpers for building composer URLs ---------- */
function safeUrl(input?: string): string {
  if (!input) return "";
  try {
    const u = new URL(input);
    return u.toString();
  } catch {
    return "";
  }
}

/** Warpcast web composer (we pass TEXT + a SINGLE embed). */
export function buildWarpcastCompose({
  text = "",
  embeds = [],
  url = "",
}: {
  text?: string;
  embeds?: string[]; // will be trimmed to 1 by caller
  url?: string; // optional, not injected into text
}) {
  const base = "https://warpcast.com/~/compose";
  const params = new URLSearchParams();
  const caption = (text || "").trim();
  if (caption) params.set("text", caption);
  const e0 = Array.isArray(embeds) && embeds.length ? safeUrl(String(embeds[0])) : "";
  if (e0) params.append("embeds[]", e0);
  // We keep the miniapp link in text; no auto-URL injection here.
  return `${base}?${params.toString()}`;
}

/** X intent URL (no image embed support via params, but link previews still work). */
export function buildTweetUrl({
  text,
  url,
}: {
  text: string;
  url?: string;
}) {
  const u = new URL("https://twitter.com/intent/tweet");
  if (text) u.searchParams.set("text", text);
  if (url) u.searchParams.set("url", url);
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
    // fallback to web composer
    const href = buildWarpcastCompose({ text, embeds });
    const w = window.open(href, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = href;
    return true;
  }
}
