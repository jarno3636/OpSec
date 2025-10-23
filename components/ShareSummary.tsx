"use client";
import React, { useMemo } from "react";
import { Twitter } from "lucide-react";
import ShareToFarcasterButton from "@/components/ShareToFarcasterButton";
import {
  FARCASTER_MINIAPP_LINK,
  SHARE_IMAGE_URL,
  randomShareCaption,
  buildTweetUrl,
} from "@/lib/share";

export default function ShareSummary({
  summary,
  address,
  name,
  image,
}: {
  summary: string;
  address: string;
  name?: string;
  image?: string;
}) {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  const miniHome = base || "https://opsec-mini.vercel.app"; // single homepage link for X
  const tokenRaw = (name && String(name)) || `${address.slice(0, 6)}…${address.slice(-4)}`;
  const TOKEN = tokenRaw.toUpperCase();
  const CASH_TAG = `$${TOKEN.replace(/^\$+/, "")}`;

  // single, absolute embed image (prefer explicit override, else our banner)
  const embedUrl = (image || SHARE_IMAGE_URL).trim();

  // pick a fresh neutral caption each render
  const caption = useMemo(() => randomShareCaption(), []);

  // —— TEXTS ——
  // X: only ONE link, to the mini app homepage (no extra url param)
  const tweetText = `${CASH_TAG} — ${caption}\n\n${summary}\n\n${miniHome}`;

  // Farcaster: keep the in-app link in text so users land in the mini-app,
  // and attach our single banner embed.
  const castText = `${CASH_TAG} — ${caption}\n\n${summary}\n\n${FARCASTER_MINIAPP_LINK}`;

  const onShareX = () => {
    const href = buildTweetUrl({
      text: tweetText,
      // ⛔️ DO NOT pass a separate url param — that created the 2nd link.
      // url: miniHome,
    });
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 space-y-2 mt-4">
      <div className="text-white/70 text-sm">Share Summary</div>
      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-sm text-white/90 font-mono">
        {summary}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onShareX}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d9bf0] text-white font-semibold hover:opacity-90 transition"
        >
          <Twitter size={16} /> Share on X
        </button>

        {/* Farcaster: always ONE embed (the fixed banner) */}
        <ShareToFarcasterButton
          text={castText}
          embed={embedUrl}
          url={FARCASTER_MINIAPP_LINK}
        >
          Cast on Farcaster
        </ShareToFarcasterButton>
      </div>
    </div>
  );
}
