"use client";
import { useCallback, useMemo, useState } from "react";
import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import Spinner from "@/components/Spinner";
import type { OpSecReport } from "@/lib/opsec/types";
import ShareRow from "@/components/ShareRow";

export default function Page() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<OpSecReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const disabled = loading || !q.trim();

  const analyze = useCallback(async () => {
    const query = q.trim();
    if (!query) {
      setErr("Please enter a Base token contract address (0x…).");
      return;
    }
    setErr(null);
    setLoading(true);
    setR(null);

    try {
      const res = await fetch(`/api/opsec/analyze?query=${encodeURIComponent(query)}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
      setR(payload);
    } catch (e: any) {
      setErr(e?.message || "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) analyze();
  };

  const clear = () => {
    setQ("");
    setErr(null);
  };

  const scanningText = useMemo(
    () => (
      <span className="inline-flex items-center gap-2 text-xs text-white/80 px-3 py-1 rounded-lg border border-white/10 bg-white/5">
        <Spinner size={14} />
        Running checks — BaseScan • GoPlus • DEX Screener • Honeypot
        <span className="animate-pulse">…</span>
      </span>
    ),
    []
  );

  return (
    <AgencyChrome>
      <div className="mx-auto w-full max-w-5xl px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight">OPSEC</h1>
          <p className="mt-1 text-white/70">Professional token due-diligence on Base</p>
        </header>

        {/* QUERY BAR */}
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                <svg width="18" height="18" viewBox="0 0 24 24" className="block">
                  <path
                    fill="currentColor"
                    d="M10 18a8 8 0 1 1 5.292-14.004A8 8 0 0 1 10 18m12.707 3.293l-6.27-6.27A10 10 0 1 0 12 22a9.963 9.963 0 0 0 5.023-1.373l6.27 6.27z"
                  />
                </svg>
              </span>
              <input
                aria-label="Paste Base token contract address"
                className="w-full rounded-xl pl-10 pr-10 py-3 bg-white/5 border border-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-scan/60"
                placeholder="Paste Base token contract address (0x…)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                inputMode="text"
                autoCapitalize="off"
                spellCheck={false}
              />
              {q && (
                <button
                  onClick={clear}
                  aria-label="Clear query"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={analyze}
              disabled={disabled}
              className="px-4 py-3 rounded-xl bg-scan text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <Spinner size={16} />}
              {loading ? "Scanning…" : "Analyze"}
            </button>
          </div>

          {/* STATUS / ERROR */}
          <div className="min-h-[1.75rem] mt-3 text-center">
            {loading && scanningText}
            {!loading && err && (
              <span className="inline-flex items-center text-xs text-red-300 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10">
                {err}
              </span>
            )}
          </div>
        </div>

        {/* RESULT */}
        <div className="mx-auto w-full max-w-3xl">
          {loading && (
            <div className="mt-4 rounded-2xl border border-white/10 p-4 bg-white/[0.04] overflow-hidden">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-48 bg-white/10 rounded" />
                  <div className="h-12 w-12 bg-white/10 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-white/10 rounded-xl" />
                  <div className="h-24 bg-white/10 rounded-xl" />
                </div>
                <div className="h-8 w-56 bg-white/10 rounded" />
              </div>
            </div>
          )}

          {r && !loading && (
            <section className="mt-4 rounded-2xl border border-white/10 p-5 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.05),transparent_60%)] overflow-hidden shadow-[0_0_30px_-15px_rgba(0,255,149,0.35)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-center md:text-left">
                  <div className="text-xl font-bold break-all font-mono">
                    {r.name ?? r.symbol ?? r.address}
                  </div>
                  <div className="text-white/60 text-sm break-all font-mono">{r.address}</div>
                </div>
                <div className="self-center">
                  <ScoreBadge grade={r.grade} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="space-y-1 text-sm">
                    {r.summary.map((s, i) => (
                      <div key={i} className={s.ok ? "text-green-400" : "text-red-400"}>
                        {s.ok ? "✓" : "✗"} {s.note}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                  <h3 className="font-semibold mb-2">Key Stats</h3>
                  <div className="space-y-2">
                    <KeyValue k="Score" v={`${r.score}/100`} />
                    <KeyValue
                      k="Liquidity (USD)"
                      v={
                        typeof r.metrics.liquidityUSD === "number"
                          ? `$${(r.metrics.liquidityUSD ?? 0).toLocaleString()}`
                          : "—"
                      }
                    />
                    <KeyValue
                      k="Top Holder %"
                      v={
                        typeof r.metrics.topHolderPct === "number"
                          ? `${(r.metrics.topHolderPct ?? 0).toFixed(1)}%`
                          : "—"
                      }
                    />
                    <KeyValue k="Buy/Sell (24h)" v={r.metrics.buySellRatio ?? "—"} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-white/50">Sources: BaseScan, GoPlus, DEX Screener, Honeypot</span>
                <div className="self-start md:self-auto">
                  <ShareRow
                    token={r.symbol ?? r.name ?? r.address}
                    grade={r.grade}
                    liquidityUSD={typeof r.metrics.liquidityUSD === "number" ? r.metrics.liquidityUSD : undefined}
                    topHolderPct={typeof r.metrics.topHolderPct === "number" ? r.metrics.topHolderPct : undefined}
                    buySellRatio={r.metrics.buySellRatio}
                    url={r.permalink}
                    image={r.imageUrl}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </AgencyChrome>
  );
}
