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
  imageUrl?: string;
  siteUrl?: string;
}) {
  const buildEmbedsTuple = (): [] | [string] | [string, string] | undefined => {
    const urls = [siteUrl, imageUrl].filter((x): x is string => !!x && x.length > 0);
    if (urls.length >= 2) return [urls[0], urls[1]];
    if (urls.length === 1) return [urls[0]];
    return undefined;
  };

  const cast = async () => {
    const embeds = buildEmbedsTuple();
    if (inFarcaster()) {
      try {
        await sdk.ready?.(); // ensure host is ready
        await sdk.actions.composeCast({
          text: summary,
          embeds,
        });
      } catch {
        // Fallback to Warpcast web composer
        const u = new URL("https://warpcast.com/~/compose");
        u.searchParams.set("text", summary);
        if (siteUrl) u.searchParams.append("embeds[]", siteUrl);
        if (imageUrl) u.searchParams.append("embeds[]", imageUrl);
        window.open(u.toString(), "_blank");
      }
    } else {
      // Not in Mini App – open Warpcast composer directly
      const u = new URL("https://warpcast.com/~/compose");
      u.searchParams.set("text", summary);
      if (siteUrl) u.searchParams.append("embeds[]", siteUrl);
      if (imageUrl) u.searchParams.append("embeds[]", imageUrl);
      window.open(u.toString(), "_blank");
    }
  };

  const shareX = () => {
    const u = new URL("https://twitter.com/intent/tweet");
    u.searchParams.set("text", summary);
    if (siteUrl) u.searchParams.set("url", siteUrl);
    window.open(u.toString(), "_blank");
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={cast}
        className="px-4 py-3 rounded-xl bg-white text-black font-semibold"
      >
        Cast on Farcaster
      </button>
      <button
        onClick={shareX}
        className="px-4 py-3 rounded-xl bg-scan text-black font-semibold"
      >
        Share on X
      </button>
    </div>
  );
}
