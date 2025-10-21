// components/ShareToFarcasterButton.tsx
"use client";

import * as React from "react";
import { composeCast } from "@/lib/miniapp";
import { buildWarpcastCompose } from "@/lib/share";

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
  text: string;
  embeds?: string[] | readonly string[];
  url?: string; // ignored for Farcaster text; useful for web composer
  className?: string;
  disabled?: boolean;
  title?: string;
  children?: React.ReactNode;
  onDone?: (via: "sdk" | "web" | "noop") => void;
};

export default function ShareToFarcasterButton({
  text,
  embeds = [],
  url,
  className,
  disabled,
  title,
  children = "Share on Farcaster",
  onDone,
}: Props) {
  const onClick = React.useCallback(async () => {
    const fullText = (text || "").trim(); // NEVER append URL here
    const embedList: string[] = Array.isArray(embeds) ? embeds.map(String) : [];

    if (isInFarcasterEnv()) {
      const ok = await (composeCast as any)({ text: fullText, embeds: embedList });
      if (ok) return onDone?.("sdk");
      onDone?.("noop");
      return;
    }

    const href = buildWarpcastCompose({ text: fullText, url, embeds: embedList });
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
  }, [text, url, embeds, onDone]);

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
