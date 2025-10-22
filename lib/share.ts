import { composeCast } from "./miniapp";

/* ---------- Config ---------- */
const FARCASTER_MINIAPP_LINK =
  "https://farcaster.xyz/miniapps/Qf8jBZwyZkJZ/opsec--token-due-diligence";

const SHARE_IMAGE =
  "https://opsec-mini.vercel.app/opsec-report-banner.PNG"; // your black-background “Get your OpSec Report” banner

/* ---------- Randomized, context-neutral short phrases ---------- */
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

/* ---------- Helper: pick random message ---------- */
function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

/* ---------- Core share function ---------- */
export async function shareOpSecSummary({
  token,
  summary,
}: {
  token: string;
  summary: string;
}) {
  const caption = randomMessage();
  const text = `${caption}\n\n${summary}\n\n${FARCASTER_MINIAPP_LINK}`;
  const embeds = [SHARE_IMAGE];

  try {
    // Prefer Warpcast compose if inside Farcaster
    const ok = await (composeCast as any)({ text, embeds });
    if (ok) return true;
  } catch {}

  // Fallback to Warpcast web composer
  const params = new URLSearchParams();
  params.set("text", text);
  params.append("embeds[]", SHARE_IMAGE);
  const href = `https://warpcast.com/~/compose?${params.toString()}`;
  window.open(href, "_blank", "noopener,noreferrer");
}
