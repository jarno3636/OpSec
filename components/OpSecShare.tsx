// components/OpSecShare.tsx
"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { inFarcaster } from "@/lib/miniapp";

function openInNewTab(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url; // fallback if popup blocked
}

export default function OpSecShare({
  summary,
  imageUrl,
  siteUrl,
}: {
  summary: string;
  imageUrl: string;
  siteUrl: string;
}) {
  const cast = async () => {
    // Farcaster tuple embeds: [] | [string] | [string, string]
    let embeds: [] | [string] | [string, string] | undefined;
    const a = !!siteUrl, b = !!imageUrl;
    if (a && b) embeds = [siteUrl, imageUrl];
    else if (a) embeds = [siteUrl];
    else if (b) embeds = [imageUrl];

    if (inFarcaster()) {
      try {
        await sdk.actions.composeCast({ text: summary, embeds });
        return;
      } catch {
        // fall back to Warpcast web composer
      }
    }
    // Warpcast web compose (works on mobile/desktop)
    const params = new URLSearchParams({ text: summary });
    if (siteUrl) params.append("embeds[]", siteUrl);
    if (imageUrl) params.append("embeds[]", imageUrl);
    openInNewTab(`https://warpcast.com/~/compose?${params.toString()}`);
  };

  const tweet = async () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(summary)}&url=${encodeURIComponent(siteUrl)}`;
    openInNewTab(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={cast}
        className="px-4 py-3 rounded-xl bg-white text-black font-semibold"
        aria-label="Cast on Farcaster"
      >
        Cast on Farcaster
      </button>
      <button
        onClick={tweet}
        className="px-4 py-3 rounded-xl bg-scan text-black font-semibold"
        aria-label="Share on X"
      >
        Share on X
      </button>
    </div>
  );
}
