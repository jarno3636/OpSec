// lib/opsec/http.ts
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 12000);

type Jsonish = Record<string, any> | any[];

export type FetchResult<T extends Jsonish = any> = {
  ok: boolean;
  status: number;
  ms: number;
  data?: T;
  error?: string;
};

export async function fetchJSON<T extends Jsonish = any>(
  url: string,
  init: RequestInit = {},
  { retries = 2, timeout = TIMEOUT_MS }: { retries?: number; timeout?: number } = {}
): Promise<FetchResult<T>> {
  let lastErr: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t0 = Date.now();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { ...init, signal: ctrl.signal });
      const ms = Date.now() - t0;
      clearTimeout(timer);

      const text = await r.text();
      let data: any;
      try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }

      // Etherscan-style “NOTOK” or rate-limit must be treated as non-fatal but not ok
      const etherscanNotOK = typeof data === "object" && data?.status === "0" && data?.message === "NOTOK";

      return {
        ok: r.ok && !etherscanNotOK,
        status: r.status,
        ms,
        data,
        error: r.ok ? (etherscanNotOK ? data?.result || "NOTOK" : undefined) : `${r.status} ${r.statusText}`,
      };
    } catch (e: any) {
      clearTimeout(timer);
      lastErr = e?.name === "AbortError" ? "timeout" : (e?.message || "request_failed");
      // backoff
      if (attempt < retries) await new Promise(res => setTimeout(res, 250 * (attempt + 1)));
    }
  }
  return { ok: false, status: 0, ms: 0, error: lastErr || "request_failed" };
}
