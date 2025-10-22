import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AgencyChrome from "@/components/AgencyChrome";
import ShareSummary from "@/components/ShareSummary";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/* ---------- types that mirror your API shape ---------- */
type SourceBlock =
  | {
      ok: true;
      source: "GoPlus";
      proxy?: boolean;
      blacklist?: boolean;
      mintable?: boolean;
      honeypot?: boolean;
      owner?: string | null;
      taxes?: { buy?: number | string; sell?: number | string };
    }
  | {
      ok: true;
      source: "Honeypot.is";
      verdict?: string;
      honeypot?: boolean;
      reason?: string | null;
      taxes?: { buy?: number | string; sell?: number | string; transfer?: number | string };
      trading?: { canBuy?: boolean; canSell?: boolean };
      gas?: { buy?: number | string; sell?: number | string };
    }
  | {
      ok: true;
      source: "Dexscreener";
      pairUrl?: string;
      baseToken?: string;
      quoteToken?: string;
      liquidityUSD?: number;
      volume24h?: number;
      priceUSD?: number | string;
    }
  | { ok: false; source: string; error?: string };

type ApiResponse = {
  address: string;
  summary: string;
  sources: SourceBlock[];
  fetchedAt: string;
  name?: string;
  symbol?: string;
};

/* ---------- helpers ---------- */
const anybreak = "break-all [word-break:anywhere]";
const mono = "font-mono text-white/90";

function pct(n?: number | string | null) {
  const v = Number(n);
  return Number.isFinite(v) ? `${Math.max(0, v).toFixed(0)}%` : "—";
}
function pillTone(n: number | null | undefined): "ok" | "warn" | "bad" | "muted" {
  if (n == null || !Number.isFinite(+n)) return "muted";
  const v = +n;
  if (v <= 0) return "ok";
  if (v <= 10) return "warn";
  return "bad";
}
function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const cx =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
      : tone === "warn"
      ? "bg-yellow-500/10 text-yellow-300 border-yellow-400/20"
      : tone === "bad"
      ? "bg-red-500/10 text-red-300 border-red-400/20"
      : "bg-white/5 text-white/70 border-white/10";
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${cx}`}>{children}</span>;
}
const TaxPill = ({ label, v }: { label: string; v?: number | string | null }) => {
  const n = Number(v);
  return (
    <Pill tone={pillTone(Number.isFinite(n) ? n : null)}>
      <span className="opacity-80">{label}:</span> <strong className="font-medium">{pct(v)}</strong>
    </Pill>
  );
};
const GatePill = ({ label, ok }: { label: string; ok?: boolean | null }) => (
  <Pill tone={ok === true ? "ok" : ok === false ? "bad" : "muted"}>
    {label}: <strong className="font-medium">{ok === true ? "OK" : ok === false ? "Blocked" : "—"}</strong>
  </Pill>
);

/* ---------- data fetch ---------- */
async function getAggregated(addr: string): Promise<ApiResponse> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const r = await fetch(`${base}/api/opsec/analyze?query=${addr}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error(`Failed to fetch report (${r.status})`);
  return r.json();
}

/** Dynamic per-token metadata with shareable summary OG */
export async function generateMetadata(
  { params }: { params: { address: string } }
): Promise<Metadata> {
  try {
    const data = await getAggregated(params.address);
    const ds = Array.isArray(data.sources)
      ? (data.sources.find((s: any) => s?.source === "Dexscreener" && s?.ok) as any)
      : null;
    const token = (data.symbol || data.name || ds?.baseToken || `${params.address.slice(0, 6)}…${params.address.slice(-4)}`)
      .toString()
      .toUpperCase();

    const title = `OpSec — ${token}`;
    const desc = data.summary;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const ogImage = `${site}/api/opsec/og?name=${encodeURIComponent(token)}&summary=${encodeURIComponent(
      (data.summary || "").slice(0, 140)
    )}`;
    const url = `${site}/opsec/${params.address}`;

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
        "fc:frame": "vNext",
        "fc:frame:image": ogImage,
        "fc:frame:button:1": "Open in OpSec",
        "fc:frame:button:1:action": "link",
        "fc:frame:button:1:target": url,
      },
    };
  } catch {
    const fallback = `${process.env.NEXT_PUBLIC_SITE_URL}/icon-1200x630.png`;
    const short = `${params.address.slice(0, 6)}…${params.address.slice(-4)}`;
    return {
      title: `OpSec — ${short} (Base)`,
      description: "Aggregated token safety snapshot for Base.",
      openGraph: { images: [{ url: fallback, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [fallback] },
      other: { "fc:frame": "vNext", "fc:frame:image": fallback },
    };
  }
}

export default async function Page({ params }: { params: { address: string } }) {
  const data = await getAggregated(params.address);
  const ds = Array.isArray(data.sources)
    ? (data.sources.find((s: any) => s?.source === "Dexscreener" && s?.ok) as any)
    : null;
  const token = (data.symbol || data.name || ds?.baseToken || `${params.address.slice(0, 6)}…${params.address.slice(-4)}`)
    .toString()
    .toUpperCase();

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
          <div className="text-xs text-white/50">Fetched: {new Date(data.fetchedAt).toLocaleString()}</div>
        </header>

        <section className="rounded-2xl border border-white/10 p-5 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.05),transparent_60%)] overflow-hidden shadow-[0_0_30px_-15px_rgba(0,255,149,0.35)]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="text-xl font-black">{token}</div>
              <div className={`${mono} ${anybreak}`}>{params.address}</div>
            </div>
          </div>

          {/* Summary + Share */}
          <div className="mt-5 rounded-xl border border-white/10 p-4 bg-white/[0.03]">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="text-sm text-white/80 font-mono">{data.summary}</div>
            <ShareSummary summary={data.summary} address={data.address} name={token} />
          </div>

          {/* Sources */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.sources.map((src, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                <h3 className="font-semibold text-sky-300">{src.source}</h3>
                {"ok" in src && !src.ok && (
                  <p className="text-red-400 mt-1">⚠️ Error fetching data {"error" in src && src.error ? `— ${src.error}` : ""}</p>
                )}

                {src.source === "GoPlus" && "ok" in src && src.ok && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>Proxy: {src.proxy ? "⚠️ Yes" : "✅ No"}</p>
                    <p>Blacklist: {src.blacklist ? "⚠️ Yes" : "✅ None"}</p>
                    <p>Mintable: {src.mintable ? "⚠️ Yes" : "✅ No"}</p>
                    <p className={`${mono} ${anybreak}`}>Owner: {src.owner ?? "Unknown"}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <TaxPill label="Buy tax" v={src.taxes?.buy} />
                      <TaxPill label="Sell tax" v={src.taxes?.sell} />
                    </div>
                  </div>
                )}

                {src.source === "Honeypot.is" && "ok" in src && src.ok && (
                  <div className="mt-2 text-sm space-y-2">
                    <p>Risk: {src.verdict ?? "—"}</p>
                    <p>Honeypot: {src.honeypot ? "⚠️ Yes" : "✅ No"}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <GatePill label="Buy" ok={src.trading?.canBuy} />
                      <GatePill label="Sell" ok={src.trading?.canSell} />
                      <TaxPill label="Buy tax" v={src.taxes?.buy} />
                      <TaxPill label="Sell tax" v={src.taxes?.sell} />
                      {src.taxes?.transfer != null && <TaxPill label="Transfer" v={src.taxes?.transfer} />}
                    </div>
                    <p className="text-xs text-white/50">
                      Gas (buy/sell): {src.gas?.buy ?? "—"} / {src.gas?.sell ?? "—"}
                    </p>
                    {"reason" in src && src.reason && <p className="text-white/60">Reason: {src.reason}</p>}
                  </div>
                )}

                {src.source === "Dexscreener" && "ok" in src && src.ok && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>
                      Pair:{" "}
                      {src.pairUrl ? (
                        <a className="text-sky-400 hover:underline" href={src.pairUrl} target="_blank" rel="noreferrer">
                          {src.baseToken ?? "—"}/{src.quoteToken ?? "—"}
                        </a>
                      ) : (
                        <span>{src.baseToken ?? "—"}/{src.quoteToken ?? "—"}</span>
                      )}
                    </p>
                    <p>
                      Liquidity: ${Number(src.liquidityUSD ?? 0).toLocaleString()} · 24h Vol: $
                      {Number(src.volume24h ?? 0).toLocaleString()}
                    </p>
                    <p>Price: ${src.priceUSD ?? "—"}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-6 text-xs text-white/50">
            Sources: GoPlus • Honeypot.is • Dexscreener — OpSec aggregates third-party data to help you make your own decision. Not financial advice.
          </div>
        </section>
      </div>
    </AgencyChrome>
  );
}
