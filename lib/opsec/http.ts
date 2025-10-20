// lib/opsec/http.ts
const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchJson<T = any>(
  url: string,
  init: RequestInit = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS, label }: { timeoutMs?: number; label?: string } = {}
): Promise<{ ok: boolean; data?: T; status: number; error?: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    const status = res.status;
    let data: any = undefined;

    try {
      data = await res.json();
    } catch {
      // some endpoints return text on errors—don’t throw
      const txt = await res.text().catch(() => "");
      if (txt) data = { raw: txt };
    }

    if (!res.ok) {
      return { ok: false, status, error: `HTTP ${status} from ${label || url}`, data };
    }
    return { ok: true, status, data };
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "timeout" : (e?.message || "fetch failed");
    return { ok: false, status: 0, error: `${label || url}: ${msg}` };
  } finally {
    clearTimeout(t);
  }
}
