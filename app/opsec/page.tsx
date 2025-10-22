// app/opsec/page.tsx
"use client";

import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import Spinner from "@/components/Spinner";
import type { OpSecReport } from "@/lib/opsec/types";
import ShareRow from "@/components/ShareRow";
import DebugPanel from "@/components/DebugPanel";
import GradePreview from "@/components/GradePreview";

export const dynamic = "force-dynamic";

function prettifyHexIn(note: string) {
  return note.replace(/0x[a-fA-F0-9]{40}/g, (m) => `${m.slice(0, 6)}…${m.slice(-4)}`);
}
const EXPLORER = "https://basescan.org";

// Split the hook-using part into its own client component
function OpsecClient() {
  const params = useSearchParams();
  const debugMode = params.get("debug") === "1";

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<(OpSecReport & { upstreamDiagnostics?: any[] }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showDiag, setShowDiag] = useState(false);

  const disabled = loading || !q.trim();

  // site base for safe fallbacks
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  const analyze = useCallback(async () => {
    const query = q.trim();
    if (!query) {
      setErr("Please enter a Base token contract address (0x…).");
      return;
    }
    setErr(null);
    setLoading(true);
    setR(null);
    setShowDiag(false);

    try {
      const url = `/api/opsec/analyze?query=${encodeURIComponent(query)}${
        debugMode ? "&debug=1" : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
      setR(payload);
      if (debugMode && Array.isArray(payload?.upstreamDiagnostics) && payload.upstreamDiagnostics.length) {
        setShowDiag(true);
      }
    } catch (e: any) {
      setErr(e?.message || "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [q, debugMode]);

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
        Running checks — BaseScan • GoPlus • DEX Screener • Honeypot • Socials
        <span className="animate-pulse">…</span>
      </span>
    ),
    []
  );

  const reason = (key: "markets" | "erc20", fallback = "—") => {
    if (!r) return fallback;
    if (key === "erc20" && r.findings?.some((f) => f.key === "erc20")) return "Not an ERC-20";
    if (
      key === "markets" &&
      r.findings?.some((f) => f.key === "markets" && f.note?.includes("No Base DEX pairs"))
    ) {
      return "No Base DEX pairs";
    }
    return fallback;
  };

  const f = (k: string) => r?.findings?.find((x) => x.key === k);
  const ownerNote = f("owner")?.note;
  const proxyNote = f("proxy")?.note;
  const lpNote = f("lp_lock")?.note;
  const blacklist = f("blacklist")?.note;
  const taxSwing = f("tax_swing")?.note;
  const gpNote = f("goplus")?.note;
  const hpNote = f("honeypot")?.note;

  const SocialsBlock = () =>
    r?.socials &&
    (r.socials.website ||
      r.socials.twitter ||
      r.socials.telegram ||
      r.socials.github ||
      r.socials.warpcast ||
      r.socials.coingecko) ? (
      <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
        <h3 className="font-semibold mb-2">Socials</h3>
        <ul className="text-sm text-sky-300 space-y-1">
          {r.socials.website && (
            <li>
              <a className="hover:underline" target="_blank" rel="noreferrer" href={r.socials.website}>
                Website
              </a>
            </li>
          )}
          {r.socials.twitter && (
            <li>
              <a className="hover:underline" target="_blank" rel="noreferrer" href={r.socials.twitter}>
                Twitter / X
              </a>
            </li>
          )}
          {r.socials.telegram && (
            <li>
              <a className="hover:underline" target="_blank" rel="noreferrer" href={r.socials.telegram}>
                Telegram
              </a>
            </li>
          )}
          {r.socials.github && (
            <li>
              <a className="hover:underline" target="_blank" rel="noreferrer" href={r.socials.github}>
                GitHub
              </a>
            </li>
          )}
          {r.socials.warpcast && (
            <li>
              <a className="hover:underline" target="_blank" rel="noreferrer" href={r.socials.warpcast}>
                Warpcast
              </a>
            </li>
          )}
          {r.socials.coingecko && (
            <li>
              <a className="hover:underline" target="_blank" rel="noreferrer" href={r.socials.coingecko}>
                CoinGecko
              </a>
            </li>
          )}
        </ul>
      </div>
    ) : null;

  return (
    <AgencyChrome>
      <div className="mx-auto w-full max-w-5xl px-4">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="text-center md:text-left w-full">
            <h1 className="text-4xl font-black tracking-tight">OPSEC</h1>
            <p className="mt-1 text-white/70">Professional token due-diligence on Base</p>
          </div>
        </header>

        {/* QUERY BAR */}
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                <svg width="18" height="18" viewBox="0 0 24 24" className="block" aria-hidden="true">
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
              aria-label="Analyze token"
            >
              {loading && <Spinner size={16} />}
              {loading ? "Scanning…" : "Analyze"}
            </button>
          </div>

          {/* STATUS / ERROR */}
          <div className="mt-3 flex items-center justify-between">
            <div className="min-h-[1.75rem]" aria-live="polite">
              {loading && scanningText}
              {!loading && err && (
                <span className="inline-flex items-center text-xs text-red-300 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10">
                  {err}
                </span>
              )}
            </div>
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
            <section className="mt-4 space-y-4">
              {/* Compact header */}
              <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-xl font-bold break-words font-mono">
                    {(r.name ?? r.symbol ?? r.address ?? "").toUpperCase() || r.address}
                  </div>
                  <div className="text-white/60 text-xs break-all font-mono">{r.address}</div>
                  <div className="self-center md:self-auto">
                    <ScoreBadge grade={r.grade} />
                  </div>
                </div>
              </div>

              {/* Live preview card */}
              <GradePreview r={r} />

              {/* Summary + Key stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="space-y-1 text-sm break-words hyphens-auto">
                    {r.summary.map((s, i) => (
                      <div key={i} className={s.ok ? "text-green-400" : "text-red-400"}>
                        {s.ok ? "✓" : "✗"} <span className="font-normal">{prettifyHexIn(s.note)}</span>
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
                          : reason("markets", "—")
                      }
                    />
                    <KeyValue
                      k="Top Holder %"
                      v={
                        typeof r.metrics.topHolderPct === "number"
                          ? `${(r.metrics.topHolderPct ?? 0).toFixed(1)}%`
                          : reason("erc20", "—")
                      }
                    />
                    <KeyValue k="Buy/Sell (24h)" v={r.metrics.buySellRatio ?? reason("markets", "—")} />
                  </div>
                </div>
              </div>

              {/* Deep-dive cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03] space-y-2">
                  <h3 className="font-semibold mb-2">Contract Controls</h3>
                  <KeyValue k="Ownership" v={ownerNote ? prettifyHexIn(ownerNote) : "—"} />
                  <KeyValue k="Proxy" v={proxyNote ? prettifyHexIn(proxyNote) : "—"} />
                  <KeyValue k="LP Lock" v={lpNote ?? "—"} />
                </div>

                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03] space-y-2">
                  <h3 className="font-semibold mb-2">Security & Trading</h3>
                  <KeyValue k="Blacklist / Limits" v={blacklist ?? "—"} />
                  <KeyValue k="Tax Swing" v={taxSwing ?? "—"} />
                  <KeyValue k="GoPlus" v={gpNote ?? "—"} />
                  <KeyValue k="Honeypot.is" v={hpNote ?? "—"} />
                </div>
              </div>

              {/* Socials */}
              <SocialsBlock />

              {/* Links + Share */}
              <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <span className="text-xs text-white/50">
                  Sources: BaseScan, GoPlus, DEX Screener, Honeypot
                </span>

                {/* Safe fallbacks for ShareRow props to satisfy strict string types */}
                {(() => {
                  const safeName = encodeURIComponent(r.symbol ?? r.name ?? "Token");
                  const safeUrl = r.permalink || `${site}/opsec/${r.address}`;
                  const safeImage = r.imageUrl || `${site}/api/opsec/og?grade=${r.grade}&name=${safeName}`;

                  return (
                    <div className="self-start md:self-auto">
                      <ShareRow
                        token={r.symbol ?? r.name ?? r.address}
                        grade={r.grade}
                        liquidityUSD={
                          typeof r.metrics.liquidityUSD === "number" ? r.metrics.liquidityUSD : undefined
                        }
                        topHolderPct={
                          typeof r.metrics.topHolderPct === "number" ? r.metrics.topHolderPct : undefined
                        }
                        buySellRatio={r.metrics.buySellRatio}
                        url={safeUrl}
                        image={safeImage}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Diagnostics (only if ?debug=1) */}
              {Array.isArray((r as any).upstreamDiagnostics) && showDiag && (
                <DebugPanel diagnostics={(r as any).upstreamDiagnostics} />
              )}
              {Array.isArray((r as any).upstreamDiagnostics) && !showDiag && debugMode && (
                <div>
                  <button
                    onClick={() => setShowDiag(true)}
                    className="text-xs px-3 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
                  >
                    Show debug
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </AgencyChrome>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <AgencyChrome>
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <div className="text-white/60">Loading…</div>
          </div>
        </AgencyChrome>
      }
    >
      <OpsecClient />
    </Suspense>
  );
}
