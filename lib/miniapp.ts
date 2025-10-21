// lib/miniapp.ts

// Internal lightweight type to satisfy TS; not exported
type MiniSdk = {
  actions?: {
    openURL?: (url: string) => Promise<void> | void;
    openUrl?: (url: string | { url: string }) => Promise<void> | void; // newer
    composeCast?: (args: { text?: string; embeds?: unknown[] }) => Promise<void> | void;
    ready?: () => Promise<void> | void;
  };
  isInMiniApp?: () => boolean;
};

export async function getMiniSdk(): Promise<MiniSdk | null> {
  try {
    const mod: any = await import("@farcaster/miniapp-sdk");
    return (mod?.sdk as MiniSdk) || (mod?.default as MiniSdk) || null;
  } catch {
    return null;
  }
}

export async function isMiniApp(): Promise<boolean> {
  const sdk = await getMiniSdk();
  if (sdk?.isInMiniApp) return !!sdk.isInMiniApp();
  return !!sdk;
}

/** Try to open a URL *inside* the Farcaster mini app. Falls back to same-tab. */
export async function openInMini(url: string | URL): Promise<boolean> {
  if (!url) return false;
  const safe = new URL(
    String(url),
    (typeof window !== "undefined" && window.location?.origin) || "https://opsec-mini.vercel.app"
  ).toString();

  const sdk = await getMiniSdk();
  try {
    if (sdk?.actions?.openUrl) {
      await sdk.actions.openUrl(safe);
      return true;
    }
    if (sdk?.actions?.openURL) {
      await sdk.actions.openURL(safe);
      return true;
    }
  } catch {
    /* fall through */
  }

  if (typeof window !== "undefined") {
    try {
      window.location.assign(safe);
      return true;
    } catch {}
    try {
      window.open(safe, "_self", "noopener,noreferrer");
      return true;
    } catch {}
  }
  return false;
}

/** If Warpcast exposes compose via SDK, use it; caller handles fallback. */
export async function composeCast(
  { text = "", embeds = [] }: { text?: string; embeds?: string[] } = {}
): Promise<boolean> {
  const sdk = await getMiniSdk();
  if (sdk?.actions?.composeCast) {
    try {
      await sdk.actions.composeCast({ text, embeds });
      return true;
    } catch {
      /* fall back */
    }
  }
  return false;
}
