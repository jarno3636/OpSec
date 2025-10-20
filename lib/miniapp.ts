// lib/miniapp.ts
"use client";
import { sdk } from "@farcaster/miniapp-sdk";

/** Returns true if running inside a Farcaster Mini App host */
export function inFarcaster(): boolean {
  try {
    // Check for action surface (composeCast) and a miniapp host context
    return Boolean((sdk as any)?.actions?.composeCast);
  } catch {
    return false;
  }
}
export { sdk };
