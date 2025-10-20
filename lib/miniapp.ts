// lib/miniapp.ts
"use client";
import { sdk } from "@farcaster/miniapp-sdk";

/** Best-effort check: are we inside a Farcaster Mini App webview? */
export function inFarcaster(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window as any;
    // Heuristics: injected bridge objects or the SDK action pipe being live
    return !!w?.farcaster || !!w?.FarcasterMiniApp || typeof sdk?.actions?.composeCast === "function";
  } catch {
    return false;
  }
}

export { sdk };
