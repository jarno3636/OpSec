"use client";

import { useMemo, useState } from "react";
import AgencyChrome from "@/components/AgencyChrome";
import Spinner from "@/components/Spinner";
import ShareSummary from "@/components/ShareSummary";

/* ---------- tiny UI helpers ---------- */
const anybreak = "break-all [word-break:anywhere]";
const mono = "font-mono text-white/90";

function pct(v?: number | string | null) {
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.max(0, n).toFixed(0)}%` : "—";
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

function TaxPill({ label, v }: { label: string; v?: number | string | null }) {
  const n = Number(v);
  return (
    <Pill tone={pillTone(Number.isFinite(n) ? n : null)}>
      <span className="opacity-80">{label}:</span> <strong className="font-medium">{pct(v)}</strong>
    </Pill>
  );
}

function GatePill({ label, ok }: { label: string; ok?: boolean | null }) {
  return (
    <Pill tone={ok === true ? "ok" : ok === false ? "bad" : "muted"}>
      {label}: <strong className="font-medium">{ok === true ? "OK" : ok === false ? "Blocked" : "—"}</strong>
    </Pill>
  );
}

export default function OpSecPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    setData(null);
    try {
      const r = await fetch(`/api/opsec/analyze?query=${q.trim()}`);
      const j = await r.json();
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Scan failed.");
    } finally {
      setLoading(false);
    }
  };

  // infer token name/symbol (UPPERCASED); fallback to address
  const inferredName = useMemo(() => {
    const ds = Array.isArray(data?.sources)
      ? data.sources.find((s: any) => s?.source === "Dexscreener" && s?.ok)
      : null;
    const raw = data?.symbol || data?.name || ds?.baseToken || "";
    const upper = String(raw || "").trim().toUpperCase();
    if (upper) return upper;
    const addr = String(data?.address || q || "");
    return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
  }, [data, q]);

  return (
    <AgencyChrome>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Query bar */}
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Paste Base token address (0x...)"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-3"
            spellCheck={false}
          />
          <button
            onClick={run}
            disabled={loading || !q.trim()}
            className="px-5 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Spinner size={16} /> : "Analyze"}
          </button>
        </div>

        {loading && (
          <div className="text-white/70 text-sm">
            Running checks — GoPlus • Honeypot.is • Dexscreener …
          </div>
        )}
        {err && <div className="text-sm text-red-300">{err}</div>}

        {data && (
          <div className="space-y-5">
            {/* Header: TOKEN (UPPERCASE) + address (wrapped) */}
            <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-xl font-black">{inferredName}</div>
                <div className={`${mono} ${anybreak}`}>{data.address}</div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
              <div className="text-lg font-bold text-emerald-300 mb-1">Summary</div>
              <div className="text-sm text-white/80 font-mono">{data.summary}</div>
            </div>

            {/* Sources */}
            {data.sources.map((src: any, i: number) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 p-4 bg-white/[0.03] space-y-2"
              >
                <h3 className="font-semibold text-sky-300">{src.source}</h3>

                {!src.ok && <p className="text-red-400">⚠️ Error fetching data</p>}

                {src.source === "GoPlus" && src.ok && (
                  <>
                    <p>Proxy: {src.proxy ? "⚠️ Yes" : "✅ No"}</p>
                    <p>Blacklist: {src.blacklist ? "⚠️ Yes" : "✅ None"}</p>
                    <p>Mintable: {src.mintable ? "⚠️ Yes" : "✅ No"}</p>
                    <p className={`${mono} ${anybreak}`}>Owner: {src.owner ?? "Unknown"}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <TaxPill label="Buy tax" v={src.taxes?.buy} />
                      <TaxPill label="Sell tax" v={src.taxes?.sell} />
                    </div>
                  </>
                )}

                {src.source === "Honeypot.is" && src.ok && (
                  <>
                    <p>Risk: {src.verdict}</p>
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
                  </>
                )}

                {src.source === "Dexscreener" && src.ok && (
                  <>
                    <p>
                      Pair:{" "}
                      <a
                        href={src.pairUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        {src.baseToken}/{src.quoteToken}
                      </a>
                    </p>
                    <p>
                      Liquidity: ${Number(src.liquidityUSD ?? 0).toLocaleString()} · 24h Vol: $
                      {Number(src.volume24h ?? 0).toLocaleString()}
                    </p>
                    <p>Price: ${src.priceUSD ?? "—"}</p>
                  </>
                )}
              </div>
            ))}

            {/* Share (pass name for uppercase; embed is the OG summary) */}
            <ShareSummary summary={data.summary} address={data.address} name={inferredName} />
          </div>
        )}
      </div>
    </AgencyChrome>
  );
}
