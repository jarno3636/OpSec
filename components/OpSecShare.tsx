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
    // Build a tuple for embeds to satisfy the SDK typing:
    // [] | [string] | [string, string]
    let embedsTuple: [] | [string] | [string, string] | undefined;

    const hasSite = typeof siteUrl === "string" && siteUrl.length > 0;
    const hasImg = typeof imageUrl === "string" && imageUrl.length > 0;

    if (hasSite && hasImg) embedsTuple = [siteUrl, imageUrl];
    else if (hasSite) embedsTuple = [siteUrl];
    else if (hasImg) embedsTuple = [imageUrl];
    else embedsTuple = undefined; // no embeds

    if (inFarcaster()) {
      try {
        await sdk.actions.composeCast({
          text: summary,
          embeds: embedsTuple,
        });
      } catch {
        // Fallback share intent
        await sdk.actions.openShare({
          cast: { text: summary, embeds: embedsTuple },
        } as any);
      }
    } else {
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
