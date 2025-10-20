// app/opsec/[address]/page.tsx
import Link from "next/link";
import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import ShareRow from "@/components/ShareRow";
import type { OpSecReport } from "@/lib/opsec/types";

async function getReport(addr: string): Promise<OpSecReport> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const r = await fetch(`${base}/api/opsec/analyze?query=${addr}`, { cache: "no-store" });
  if (!r.ok) {
    // Server component: throw to let Next render error overlay or error page
    throw new Error(`Failed to fetch report (${r.status})`);
  }
  return r.json();
}

export default async function Page({ params }: { params: { address: string } }) {
  const r = await getReport(params.address);

  return (
    <AgencyChrome>
      <div className="mx-auto w-full max-w-5xl px-4">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/opsec"
            className="text-sm text-white/70 hover:text-white rounded-lg px-2 py-1 hover:bg-white/10 transition"
          >
            ← Back to OpSec
          </Link>
        </header>

        <section className="rounded-2xl border border-white/10 p-5 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.05),transparent_60%)] overflow-hidden shadow-[0_0_30px_-15px_rgba(0,255,149,0.35)]">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="text-xl font-bold break-all font-mono">
                {r.name ?? r.symbol ?? r.address}
              </div>
              <div className="text-white/60 text-sm break-all font-mono">
                {r.address}
              </div>
            </div>
            <div className="self-center">
              <ScoreBadge grade={r.grade} />
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Findings */}
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
              <h3 className="font-semibold mb-2">Findings</h3>
              <div className="grid grid-cols-1 gap-2">
                {r.findings.map((f) => (
                  <div
                    key={f.key}
                    className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 border ${
                      f.ok
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                        : "border-red-500/20 bg-red-500/5 text-red-300"
                    }`}
                  >
                    <span className="text-sm leading-5">
                      {f.ok ? "✓" : "✗"} {f.note}
                    </span>
                    <span className="text-[10px] leading-5 text-white/60">w:{f.weight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Stats */}
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

              <div className="mt-4 text-xs text-white/50">
                Sources: BaseScan, GoPlus, DEX Screener, Honeypot
              </div>

              {/* Share */}
              <div className="mt-4">
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
          </div>
        </section>
      </div>
    </AgencyChrome>
  );
}
