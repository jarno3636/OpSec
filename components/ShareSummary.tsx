// components/ShareSummary.tsx
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

  // one absolute embed image (prefer explicit override, else our banner)
  const embedUrl = (image || SHARE_IMAGE_URL).trim();

  // fresh neutral caption each render
  const caption = useMemo(() => randomShareCaption(), []);

  // X: keep ONE link (mini app homepage) in the text
  const tweetText = `${CASH_TAG} — ${caption}\n\n${summary}\n\n${miniHome}`;

  // Farcaster: **no link in text** — only the embed image
  const castText = `${CASH_TAG} — ${caption}\n\n${summary}`;

  const onShareX = () => {
    const href = buildTweetUrl({
      text: tweetText,
      // no separate `url` param (prevents a second link)
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

        {/* Farcaster: text without any URLs + a SINGLE banner embed */}
        <ShareToFarcasterButton
          text={castText}
          embed={embedUrl}
          // omit url prop to avoid any chance of a link being added
        >
          Cast on Farcaster
        </ShareToFarcasterButton>
      </div>
    </div>
  );
}
