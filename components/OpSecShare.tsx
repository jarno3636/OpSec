// components/OpSecShare.tsx
"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { inFarcaster } from "@/lib/miniapp";

export default function OpSecShare({
  summary,
  imageUrl,
  siteUrl,
}: {
  summary: string;
  imageUrl: string;
  siteUrl: string;
}) {
  const share = async () => {
    // Build a tuple for embeds to satisfy SDK typing: [] | [string] | [string, string]
    let embedsTuple: [] | [string] | [string, string] | undefined;
    const hasSite = !!siteUrl;
    const hasImg = !!imageUrl;

    if (hasSite && hasImg) embedsTuple = [siteUrl, imageUrl];
    else if (hasSite) embedsTuple = [siteUrl];
    else if (hasImg) embedsTuple = [imageUrl];
    else embedsTuple = undefined;

    if (inFarcaster()) {
      try {
        await sdk.actions.composeCast({
          text: summary,
          embeds: embedsTuple,
        });
      } catch {
        // Fallback: open Warpcast compose with text + embeds via URL
        const u = new URL("https://warpcast.com/~/compose");
        u.searchParams.set("text", summary);
        if (embedsTuple && embedsTuple.length > 0) {
          for (const e of embedsTuple) u.searchParams.append("embeds[]", e);
        }
        await sdk.actions.openUrl(u.toString());
      }
    } else {
      // Outside Farcaster → X intent
      const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        summary
      )}&url=${encodeURIComponent(siteUrl)}`;
      window.open(tweet, "_blank");
    }
  };

  return (
    <button
      onClick={share}
      className="px-4 py-3 rounded-xl bg-white text-black font-semibold"
    >
      Share
    </button>
  );
}
