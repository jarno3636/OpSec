"use client";
import { useState } from "react";
import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import OpSecShare from "@/components/OpSecShare";
import type { OpSecReport } from "@/lib/opsec/types";

export default function Page() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<OpSecReport | null>(null);

  const analyze = async () => {
    setLoading(true);
    const res = await fetch(`/api/opsec/analyze?query=${encodeURIComponent(q)}`, { cache: "no-store" });
    const json = await res.json();
    setR(json);
    setLoading(false);
  };

  return (
    <AgencyChrome>
      <header className="mb-6">
        <h1 className="text-4xl font-black">OPSEC</h1>
        <p className="text-white/70">Professional token due-diligence on Base</p>
      </header>

      <div className="flex gap-2 mb-4">
        <input className="flex-1 rounded-xl px-4 py-3 bg-white/5 border border-white/10"
               placeholder="Paste Base token address or search by name/symbol"
               value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={analyze} disabled={loading}
          className="px-4 py-3 rounded-xl bg-scan text-black font-semibold">
          {loading ? "Scanning…" : "Analyze"}
        </button>
      </div>

      {r && (
        <section className="rounded-2xl border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">{r.name ?? r.symbol ?? r.address}</div>
              <div className="text-white/60 text-sm">{r.address}</div>
            </div>
            <ScoreBadge grade={r.grade} />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <KeyValue k="Liquidity (USD)" v={`$${(r.metrics.liquidityUSD ?? 0).toLocaleString()}`} />
              <KeyValue k="Top Holder %" v={`${(r.metrics.topHolderPct ?? 0).toFixed(1)}%`} />
              <KeyValue k="Buy/Sell (24h)" v={r.metrics.buySellRatio ?? "—"} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-white/50">Sources: BaseScan, GoPlus, DEX Screener, Honeypot</span>
            <OpSecShare
              summary={`OPSEC: ${r.symbol ?? ""} — Grade ${r.grade} on Base`}
              imageUrl={r.imageUrl}
              siteUrl={r.permalink}
            />
          </div>
        </section>
      )}
    </AgencyChrome>
  );
}
