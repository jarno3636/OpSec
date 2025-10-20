// app/opsec/[address]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import ShareRow from "@/components/ShareRow";
import type { Metadata } from "next";
import type { OpSecReport } from "@/lib/opsec/types";

export const dynamic = "force-dynamic";

async function getReport(addr: string): Promise<OpSecReport> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const r = await fetch(`${base}/api/opsec/analyze?query=${addr}`, {
    // always fetch fresh
    cache: "no-store",
    // tiny defense against stuck proxies
    next: { revalidate: 0 },
  });

  if (r.status === 404) notFound();
  if (!r.ok) {
    // Let Next render the error boundary/page for non-404 errors
    throw new Error(`Failed to fetch report (${r.status})`);
  }
  return r.json();
}

/** Dynamic per-token metadata (OG/Twitter + Farcaster friendly) */
export async function generateMetadata(
  { params }: { params: { address: string } }
): Promise<Metadata> {
  try {
    const report = await getReport(params.address);
    const title = `${report.symbol ?? report.name ?? "Token"} — Grade ${report.grade} | OpSec`;
    const desc = `OpSec report for ${report.symbol ?? report.name ?? report.address} on Base. Score ${report.score}/100. Liquidity $${(report.metrics.liquidityUSD ?? 0).toLocaleString()}.`;
    const ogImage = report.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/icon-1200x630.png`;
    const url = report.permalink || `${process.env.NEXT_PUBLIC_SITE_URL}/opsec/${params.address}`;

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        url,
        images: [{ url: ogImage, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [ogImage],
      },
      other: {
        // Farcaster frame vNext hint (kept minimal; your /api/opsec/og already supplies image)
        "fc:frame": "vNext",
        "fc:frame:image": ogImage,
        "fc:frame:button:1": "Open in OpSec",
        "fc:frame:button:1:action": "link",
        "fc:frame:button:1:target": url,
      },
    };
  } catch {
    // On failure, fall back to a generic meta
    const fallback = `${process.env.NEXT_PUBLIC_SITE_URL}/icon-1200x630.png`;
    return {
      title: "OpSec — Token Report",
      description: "Automated token due-diligence on Base.",
      openGraph: { images: [{ url: fallback, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [fallback] },
      other: { "fc:frame": "vNext", "fc:frame:image": fallback },
    };
  }
}

export default async function Page({ params }: { params: { address: string } }) {
  const r = await getReport(params.address);

  return (
    <AgencyChrome>
      <div className="mx-auto w-full max-w-5xl px-4">
        {/* Back link */}
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

            {/* Key Stats + Share */}
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
