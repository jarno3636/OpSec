"use client";

import * as React from "react";
import { composeCast } from "@/lib/miniapp";
import { buildWarpcastCompose } from "@/lib/share";

/** Detect if we're inside Warpcast / Farcaster MiniApp */
function isInFarcasterEnv(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hasGlobal =
      !!(window as any).farcaster ||
      !!(window as any).Farcaster?.mini ||
      !!(window as any).Farcaster?.mini?.sdk;
    const inIframe = window.self !== window.top;
    const ua =
      typeof navigator !== "undefined"
        ? /Warpcast|Farcaster/i.test(navigator.userAgent || "")
        : false;
    return hasGlobal || ua || inIframe;
  } catch {
    return false;
  }
}

type Props = {
  /** Plain text for the cast (summary line etc.). We never auto-append URLs here. */
  text: string;

  /** ✅ Preferred: single embed URL (e.g., your OG summary image). */
  embed?: string;

  /** (Legacy) If provided, we will *take only the first* as the single embed. */
  embeds?: string[] | readonly string[];

  /** Optional web composer target (ignored for SDK). We still won't inject it into text. */
  url?: string;

  className?: string;
  disabled?: boolean;
  title?: string;
  children?: React.ReactNode;
  onDone?: (via: "sdk" | "web" | "noop") => void;
};

export default function ShareToFarcasterButton({
  text,
  embed,
  embeds = [],
  url,
  className,
  disabled,
  title,
  children = "Share on Farcaster",
  onDone,
}: Props) {
  const onClick = React.useCallback(async () => {
    const fullText = (text || "").trim();

    // Always enforce a SINGLE embed
    const firstFromArray =
      Array.isArray(embeds) && embeds.length > 0 ? String(embeds[0]) : undefined;
    const firstEmbed = (embed || firstFromArray || "").trim();
    const singleEmbedList = firstEmbed ? [firstEmbed] : [];

    if (isInFarcasterEnv()) {
      const ok = await (composeCast as any)({ text: fullText, embeds: singleEmbedList });
      if (ok) return onDone?.("sdk");
      onDone?.("noop");
      return;
    }

    const href = buildWarpcastCompose({ text: fullText, url, embeds: singleEmbedList });
    try {
      const w = window.open(href, "_blank", "noopener,noreferrer");
      if (!w) window.location.href = href;
      onDone?.("web");
    } catch {
      try {
        window.location.href = href;
        onDone?.("web");
      } catch {
        onDone?.("noop");
      }
    }
  }, [text, url, embed, embeds, onDone]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        className ??
        "rounded-xl bg-scan text-black px-4 py-3 font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      {children}
    </button>
  );
}
