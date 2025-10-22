"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Twitter, Share2 } from "lucide-react";

export default function ShareSummary({ summary, address }: { summary: string; address: string }) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";
  const shareUrl = `${baseUrl}/opsec/${address}`;

  const tweet = `Token ${address.slice(0, 6)}…${address.slice(-4)} — ${summary}\n\n🔍 via OpSec (on Base)\n${shareUrl}`;

  const shareToX = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, "_blank");

  const shareToWarpcast = () =>
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(tweet)}`, "_blank");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 space-y-2 mt-4">
      <div className="text-white/70 text-sm">Share Summary</div>
      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-sm text-white/90 font-mono">
        {summary}
      </div>
      <div className="flex gap-2">
        <button
          onClick={shareToX}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d9bf0] text-white font-semibold hover:opacity-90 transition"
        >
          <Twitter size={16} /> Share on X
        </button>
        <button
          onClick={shareToWarpcast}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#855DCD] text-white font-semibold hover:opacity-90 transition"
        >
          <Share2 size={16} /> Cast
        </button>
      </div>
    </div>
  );
}
