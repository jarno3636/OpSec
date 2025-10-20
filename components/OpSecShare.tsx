"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { inFarcaster } from "@/lib/miniapp";

export default function OpSecShare({ summary, imageUrl, siteUrl }: {
  summary: string; imageUrl: string; siteUrl: string;
}) {
  const share = async () => {
    if (inFarcaster()) {
      await sdk.actions.composeCast({ text: summary, embeds: [{ url: siteUrl }, { url: imageUrl }] });
    } else {
      const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(summary)}&url=${encodeURIComponent(siteUrl)}`;
      window.open(tweet, "_blank");
    }
  };
  return (
    <button onClick={share} className="px-4 py-3 rounded-xl bg-white text-black font-semibold">Share</button>
  );
}
