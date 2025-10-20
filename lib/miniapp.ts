"use client";
import { sdk } from "@farcaster/miniapp-sdk";

/** Returns true if running inside a Farcaster Mini App host */
export function inFarcaster(): boolean {
  try { return !!sdk?.host; } catch { return false; }
}
export { sdk };
