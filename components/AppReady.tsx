// components/AppReady.tsx
'use client'
import { useEffect } from 'react'

export default function AppReady() {
  useEffect(() => {
    (async () => {
      try {
        const mod = await import('@farcaster/miniapp-sdk');
        await mod.sdk.actions.ready?.();
      } catch {
        // not in Warpcast; ignore
      }
    })();
  }, []);
  return null;
}
