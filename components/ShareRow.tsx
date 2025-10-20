// components/ShareRow.tsx
"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { inFarcaster } from "@/lib/miniapp";
import { useState } from "react";

export default function ShareRow({
  summary,
  url,
  image,
}: {
  summary: string;
  url: string;
  image?: string;
}) {
  const [casting, setCasting] = useState(false);

  const cast = async () => {
    if (!inFarcaster()) {
      alert("Open this inside a Farcaster Mini App to cast.");
      return;
    }
    setCasting(true);
    try {
      // embeds must be [] | [string] | [string, string]
      const embeds: [] | [string] | [string, string] = image
        ? ([url, image] as [string, string])
        : ([url] as [string]);

      await sdk.actions.composeCast({ text: summary, embeds });
    } catch (e) {
      console.error("composeCast failed", e);
      // Fallback: open the permalink; user can cast manually from there
      try {
        await sdk.actions.openUrl(url);
      } catch {
        alert("Couldn’t open the cast composer.");
      }
    } finally {
      setCasting(false);
    }
  };

  const tweet = () => {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      summary
    )}&url=${encodeURIComponent(url)}`;
    window.open(u, "_blank");
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={cast}
        disabled={casting}
        className="px-4 py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-60"
      >
        {casting ? "Opening…" : "Cast on Farcaster"}
      </button>
      <button
        onClick={tweet}
        className="px-4 py-3 rounded-xl bg-scan text-black font-semibold"
      >
        Share on X
      </button>
    </div>
  );
}
