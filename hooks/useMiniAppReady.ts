// hooks/useMiniAppReady.ts
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type MiniAppSdk = {
  actions?: {
    ready?: () => Promise<void> | void;
    openUrl?: (url: string | { url: string }) => Promise<void> | void;
    openURL?: (url: string) => Promise<void> | void;
    composeCast?: (args: { text?: string; embeds?: string[] }) => Promise<void> | void;
  };
  isInMiniApp?: () => boolean;
};

function detectFarcasterUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Warpcast|Farcaster|FarcasterMini/i.test(navigator.userAgent);
}

function detectFarcasterEnv(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const inIframe = window.self !== window.top;
    const pathHint = window.location?.pathname?.startsWith?.('/mini');
    return detectFarcasterUA() || inIframe || !!pathHint;
  } catch {
    return false;
  }
}

export function useMiniAppReady(readyTimeoutMs = 1200) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const envLooksLikeFC = useMemo(detectFarcasterEnv, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        let inMini = envLooksLikeFC;

        const loadSdk = async () => {
          const mod = (await import('@farcaster/miniapp-sdk').catch(() => null)) as
            | { sdk?: MiniAppSdk; default?: MiniAppSdk }
            | null;
          return mod?.sdk ?? mod?.default ?? null;
        };

        if (typeof window !== 'undefined' && envLooksLikeFC) {
          let sdk: MiniAppSdk | null = await loadSdk();
          if (!sdk) {
            await new Promise(r => setTimeout(r, 100));
            sdk = await loadSdk();
          }
          if (sdk?.isInMiniApp) inMini = !!sdk.isInMiniApp();

          const readyPromise =
            typeof sdk?.actions?.ready === 'function'
              ? Promise.resolve(sdk.actions.ready())
              : Promise.resolve();

          const timeout = new Promise<void>((resolve) => {
            timeoutId = setTimeout(resolve, readyTimeoutMs);
          });

          await Promise.race([readyPromise, timeout]);
        }

        if (mountedRef.current) {
          setIsInFarcaster(inMini);
          setIsReady(true);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          setIsReady(true);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    })();
  }, [envLooksLikeFC, readyTimeoutMs]);

  return { isReady, error, isInFarcaster };
}

export default useMiniAppReady;
