"use client";
import React from "react";
import { Twitter } from "lucide-react";
import ShareToFarcasterButton from "@/components/ShareToFarcasterButton";

/**
 * Displays a shareable snippet and wires up:
 *  • X share: uses the page URL (which carries OG image)
 *  • Farcaster: uses the summary OG image as the SINGLE embed
 */
export default function ShareSummary({
  summary,
  address,
  name,
  image, // optional override for embed
}: {
  summary: string;
  address: string;
  name?: string;     // token name/symbol; we'll uppercase for text
  image?: string;    // explicit embed URL if provided
}) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const shareUrl = `${baseUrl}/opsec/${address}`;

  const token = (name || `${address.slice(0, 6)}…${address.slice(-4)}`).toString().toUpperCase();

  // Build our OG summary card URL for the embed (single image)
  // If your /api/opsec/og supports ?name&summary, this will render that card.
  const ogEmbed =
    image ||
    `${baseUrl}/api/opsec/og?name=${encodeURIComponent(token)}&summary=${encodeURIComponent(
      (summary || "").slice(0, 220)
    )}`;

  const tweet = `${token} — ${summary}\n\n🔍 via OpSec (on Base)\n${shareUrl}`;

  const shareToX = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, "_blank");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 space-y-2 mt-4">
      <div className="text-white/70 text-sm">Share Summary</div>
      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-sm text-white/90 font-mono">
        {summary}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={shareToX}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d9bf0] text-white font-semibold hover:opacity-90 transition"
        >
          <Twitter size={16} /> Share on X
        </button>

        {/* Farcaster: always one embed (the summary OG) */}
        <ShareToFarcasterButton
          text={`${token} — quick security summary`}
          embed={ogEmbed}
          url={shareUrl}
        >
          Cast on Farcaster
        </ShareToFarcasterButton>
      </div>
    </div>
  );
}
