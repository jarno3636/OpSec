// app/opsec/page.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import Spinner from "@/components/Spinner";
import type { OpSecReport } from "@/lib/opsec/types";
import ShareRow from "@/components/ShareRow";           // ✅ uses new share setup underneath
import DebugPanel from "@/components/DebugPanel";
import GradePreview from "@/components/GradePreview";

/** Middle-ellipsis any 0x…40 hex address inside a string */
function prettifyHexIn(note: string) {
  return note.replace(/0x[a-fA-F0-9]{40}/g, (m) => `${m.slice(0, 6)}…${m.slice(-4)}`);
}
const EXPLORER = "https://basescan.org";

export default function Page() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<(OpSecReport & { upstreamDiagnostics?: any[] }) | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Debug UX
  const [debugMode, setDebugMode] = useState(false);
  const [showDiag, setShowDiag] = useState(false);

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
    setShowDiag(false);

    try {
      const url = `/api/opsec/analyze?query=${encodeURIComponent(query)}${debugMode ? "&debug=1" : ""}`;
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
        Running checks — BaseScan • GoPlus • DEX Screener • Honeypot
        <span className="animate-pulse">…</span>
      </span>
    ),
    []
  );

  // Friendly placeholders based on findings
  const reason = (key: "markets" | "erc20", fallback = "—") => {
    if (!r) return fallback;
    if (key === "erc20" && r.findings?.some((f) => f.key === "erc20")) return "Not an ERC-20";
    if (key === "markets" && r.findings?.some((f) => f.key === "markets" && f.note?.includes("No Base DEX pairs"))) {
      return "No Base DEX pairs";
    }
    return fallback;
  };

  // Small helpers to read specific findings
  const f = (k: string) => r?.findings?.find((x) => x.key === k);
  const ownerNote = f("owner")?.note;
  const proxyNote = f("proxy")?.note;
  const lpNote    = f("lp_lock")?.note;
  const blacklist = f("blacklist")?.note;
  const taxSwing  = f("tax_swing")?.note;
  const gpNote    = f("goplus")?.note;
  const hpNote    = f("honeypot")?.note;

  return (
    <AgencyChrome>
      <div className="mx-auto w-full max-w-5xl px-4">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="text-center md:text-left w-full">
            <h1 className="text-4xl font-black tracking-tight">OPSEC</h1>
            <p className="mt-1 text-white/70">Professional token due-diligence on Base</p>
          </div>

          {/* Debug mode toggle (desktop) */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-2 select-none cursor-pointer">
              <input
                type="checkbox"
                className="accent-emerald-400"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
              />
              <span className="text-white/75">Debug mode</span>
            </label>
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

          {/* STATUS / ERROR + mobile debug toggle */}
          <div className="mt-3 flex items-center justify-between">
            <div className="min-h-[1.75rem]" aria-live="polite">
              {loading && scanningText}
              {!loading && err && (
                <span className="inline-flex items-center text-xs text-red-300 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10">
                  {err}
                </span>
              )}
            </div>
            <div className="sm:hidden">
              <label className="inline-flex items-center gap-2 text-xs select-none cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-emerald-400"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                />
                <span className="text-white/75">Debug</span>
              </label>
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
                    {r.name ?? r.symbol ?? r.address}
                  </div>
                  <div className="text-white/60 text-xs break-all font-mono">{r.address}</div>
                  <div className="self-center md:self-auto">
                    <ScoreBadge grade={r.grade} />
                  </div>
                </div>
              </div>

              {/* Live preview card (grade + pills + explainer) */}
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
                {/* Contract controls */}
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03] space-y-2">
                  <h3 className="font-semibold mb-2">Contract Controls</h3>
                  <KeyValue k="Ownership" v={f("owner")?.note ? prettifyHexIn(f("owner")!.note!) : "—"} />
                  <KeyValue k="Proxy" v={f("proxy")?.note ? prettifyHexIn(f("proxy")!.note!) : "—"} />
                  <KeyValue k="LP Lock" v={f("lp_lock")?.note ?? "—"} />
                </div>

                {/* Security & Trading */}
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03] space-y-2">
                  <h3 className="font-semibold mb-2">Security & Trading</h3>
                  <KeyValue k="Blacklist / Limits" v={f("blacklist")?.note ?? "—"} />
                  <KeyValue k="Tax Swing" v={f("tax_swing")?.note ?? "—"} />
                  <KeyValue k="GoPlus" v={f("goplus")?.note ?? "—"} />
                  <KeyValue k="Honeypot.is" v={f("honeypot")?.note ?? "—"} />
                </div>
              </div>

              {/* Links */}
              <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                <h3 className="font-semibold mb-2">Links</h3>
                <ul className="text-sm text-sky-300 space-y-1">
                  <li>
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`${EXPLORER}/token/${r.address}`}>
                      BaseScan token
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`${EXPLORER}/address/${r.address}`}>
                      BaseScan contract
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`https://dexscreener.com/base/${r.address}`}>
                      DEX Screener (Base)
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`https://www.geckoterminal.com/base/pools?query=${r.address}`}>
                      GeckoTerminal search
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${r.address}`}>
                      GoPlus: token_security
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`https://honeypot.is/?address=${r.address}&chain=base`}>
                      Honeypot.is (UI)
                    </a>
                  </li>
                </ul>
              </div>

              {/* Share + Sources */}
              <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-3">
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

              {/* Diagnostics panel */}
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
