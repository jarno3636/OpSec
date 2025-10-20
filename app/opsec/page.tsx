// app/opsec/page.tsx
"use client";
import { useCallback, useState } from "react";
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

  const analyze = useCallback(async () => {
    const query = q.trim();
    if (!query) {
      setErr("Please enter a Base token address or name/symbol.");
      return;
    }
    setErr(null);
    setLoading(true);
    setR(null); // clear previous result immediately for better UX
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
    if (e.key === "Enter") analyze();
  };

  return (
    <AgencyChrome>
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-black">OPSEC</h1>
          <p className="text-white/70">Professional token due-diligence on Base</p>
        </header>

        {/* QUERY BAR */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            className="flex-1 rounded-xl px-4 py-3 bg-white/5 border border-white/10 placeholder:text-white/40"
            placeholder="Paste Base token address or search by name/symbol"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            inputMode="text"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            onClick={analyze}
            disabled={loading || !q.trim()}
            className="px-4 py-3 rounded-xl bg-scan text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Spinner size={16} />}
            {loading ? "Scanning…" : "Analyze"}
          </button>
        </div>

        {/* STATUS / ERROR */}
        <div className="min-h-[1.5rem] mb-4 text-center">
          {loading && (
            <span className="inline-flex items-center gap-2 text-xs text-white/80 px-3 py-1 rounded-lg border border-white/10 bg-white/5">
              <Spinner size={14} />
              Running checks (BaseScan • GoPlus • DEX Screener • Honeypot)…
            </span>
          )}
          {!loading && err && (
            <span className="inline-flex items-center text-xs text-red-300 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10">
              {err}
            </span>
          )}
        </div>

        {/* RESULT */}
        {r && (
          <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 p-4 space-y-4 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="space-y-1 text-sm">
                  {r.summary.map((s, i) => (
                    <div key={i} className={s.ok ? "text-green-400" : "text-red-400"}>
                      {s.ok ? "✓" : "✗"} {s.note}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Key Stats</h3>
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-white/50">
                Sources: BaseScan, GoPlus, DEX Screener, Honeypot
              </span>
              <div className="self-start md:self-auto">
                <ShareRow
                  summary={`OPSEC: ${r.symbol ?? r.name ?? r.address} — Grade ${r.grade} (Base)`}
                  url={r.permalink}
                  image={r.imageUrl}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </AgencyChrome>
  );
}
