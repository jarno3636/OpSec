// components/ShareRow.tsx
"use client";

import { useMemo } from "react";
import ShareToFarcasterButton from "@/components/ShareToFarcasterButton";

type ShareRowProps = {
  token?: string;
  grade?: "A" | "B" | "C" | "D" | "F";
  liquidityUSD?: number;
  topHolderPct?: number;
  buySellRatio?: string | number;
  url: string;
  image?: string;
  summary?: string;
};

export default function ShareRow({
  token,
  grade,
  liquidityUSD,
  topHolderPct,
  buySellRatio,
  url,
  image,
  summary,
}: ShareRowProps) {
  const fmtUsd = (n?: number) =>
    typeof n === "number" ? `$${Math.round(n).toLocaleString()}` : "—";
  const fmtPct = (n?: number) =>
    typeof n === "number" ? `${n.toFixed(1)}%` : "—";
  const fmtRatio = (r?: string | number) =>
    r === undefined || r === null || r === "" ? "—" : String(r);

  // Compose text for Farcaster/X
  const composed = useMemo(() => {
    if (summary && summary.trim()) return summary.trim();
    const title = `OPSEC Report${token ? `: ${token}` : ""}`;
    const line1 = grade ? `Grade ${grade}` : undefined;

    const stats: string[] = [];
    if (liquidityUSD !== undefined) stats.push(`Liquidity ${fmtUsd(liquidityUSD)}`);
    if (topHolderPct !== undefined) stats.push(`Top Holder ${fmtPct(topHolderPct)}`);
    if (buySellRatio !== undefined) stats.push(`Buy/Sell ${fmtRatio(buySellRatio)}`);

    const line2 = stats.length ? stats.join(" • ") : undefined;

    let text = title;
    if (line1) text += ` — ${line1}`;
    if (line2) text += `\n${line2}`;

    if (text.length > 260) text = text.slice(0, 259) + "…";
    return text;
  }, [summary, token, grade, liquidityUSD, topHolderPct, buySellRatio]);

  const tweet = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      composed
    )}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <ShareToFarcasterButton
        text={composed}
        url={url}
        embeds={image ? [url, image] : [url]}
      >
        Cast on Farcaster
      </ShareToFarcasterButton>

      <button
        onClick={tweet}
        className="px-4 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90 transition"
      >
        Share on X
      </button>
    </div>
  );
}
