"use client";
import React from "react";
import { Twitter } from "lucide-react";
import ShareToFarcasterButton from "@/components/ShareToFarcasterButton";
import { buildSummaryOg } from "@/lib/share";

export default function ShareSummary({
  summary,
  address,
  name,
  image,
}: {
  summary: string;
  address: string;
  name?: string;   // inferred token name or symbol, optional
  image?: string;  // optional explicit embed override
}) {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  const shareUrl = `${base}/opsec/${address}`;
  const tokenRaw = (name && String(name)) || `${address.slice(0,6)}…${address.slice(-4)}`;
  const TOKEN = tokenRaw.toUpperCase();
  const CASH_TAG = `$${TOKEN.replace(/^\$+/, "")}`;

  // Build our OG image for the composer embed (single, absolute URL)
  const ogEmbed =
    image ||
    buildSummaryOg({
      name: TOKEN,                               // big headline on card
      summary: (summary || "").slice(0, 220),    // safe length
      baseUrl: base,
    });

  const tweet = `${CASH_TAG} — ${summary}\n\n🔍 via OpSec (on Base)\n${shareUrl}`;

  const shareToX = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      "_blank",
      "noopener,noreferrer"
    );

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

        {/* Farcaster: always ONE embed (the summary OG) */}
        <ShareToFarcasterButton
          text={`${CASH_TAG} — quick security summary`}
          embed={ogEmbed}
          url={shareUrl}
        >
          Cast on Farcaster
        </ShareToFarcasterButton>
      </div>
    </div>
  );
}
