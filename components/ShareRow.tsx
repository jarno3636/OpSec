// components/ShareRow.tsx
"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { inFarcaster } from "@/lib/miniapp";
import { useMemo, useState } from "react";

type ShareRowProps = {
  /** Optional: if provided, we’ll compose the summary for you. */
  token?: string;          // name or symbol, e.g., "DEGEN"
  grade?: "A" | "B" | "C" | "D" | "F";
  liquidityUSD?: number;   // e.g., 123456
  topHolderPct?: number;   // e.g., 12.3
  buySellRatio?: string | number;

  /** Required: where the full report lives. */
  url: string;

  /** Optional: OG image or badge we want to include as an embed in Farcaster. */
  image?: string;

  /** If you pass a custom summary, we’ll use it verbatim. */
  summary?: string;
};

export default function ShareRow(props: ShareRowProps) {
  const {
    token,
    grade,
    liquidityUSD,
    topHolderPct,
    buySellRatio,
    url,
    image,
    summary,
  } = props;

  const [casting, setCasting] = useState(false);

  // Helpers
  const fmtUsd = (n?: number) =>
    typeof n === "number" ? `$${Math.round(n).toLocaleString()}` : "—";
  const fmtPct = (n?: number) =>
    typeof n === "number" ? `${n.toFixed(1)}%` : "—";
  const fmtRatio = (r?: string | number) =>
    r === undefined || r === null || r === "" ? "—" : String(r);

  // Compose a clean, compact message when summary isn’t provided
  const composed = useMemo(() => {
    if (summary && summary.trim()) return summary.trim();

    const title = `OPSEC Report${token ? `: ${token}` : ""}`;
    const line1 = grade ? `Grade ${grade}` : undefined;

    const stats: string[] = [];
    if (liquidityUSD !== undefined) stats.push(`Liquidity ${fmtUsd(liquidityUSD)}`);
    if (topHolderPct !== undefined) stats.push(`Top Holder ${fmtPct(topHolderPct)}`);
    if (buySellRatio !== undefined) stats.push(`Buy/Sell ${fmtRatio(buySellRatio)}`);

    const line2 = stats.length ? stats.join(" • ") : undefined;

    // Keep it tight; Farcaster/X will handle line breaks nicely
    let text = title;
    if (line1) text += ` — ${line1}`;
    if (line2) text += `\n${line2}`;

    // Keep casts/tweets tidy (soft cap)
    const CAP = 260; // under common limits w/ URL & embeds
    if (text.length > CAP) text = text.slice(0, CAP - 1) + "…";
    return text;
  }, [summary, token, grade, liquidityUSD, topHolderPct, buySellRatio]);

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

      await sdk.actions.composeCast({ text: composed, embeds });
    } catch (e) {
      console.error("composeCast failed", e);
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
      composed
    )}&url=${encodeURIComponent(url)}`;
    window.open(u, "_blank");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
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
