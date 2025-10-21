"use client";
import React, { useMemo, useState } from "react";
import Head from "next/head";
import type { OpSecReport } from "@/lib/opsec/types";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${ok ? "bg-emerald-400" : "bg-red-400"}`}
      aria-hidden
    />
  );
}

function Pill({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
      <div className="text-white/60 text-xs">{k}</div>
      <div className="font-semibold tracking-tight">{v}</div>
    </div>
  );
}

const fmtUsd = (n?: number) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (n >= 1000) {
    const compact = Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
    return `$${compact}`;
  }
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const fmtPct = (n?: number) => (typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(1)}%` : "—");
const fmtRatio = (x?: string | number) => {
  if (x === "∞") return "∞";
  const v = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(2)}x`;
};

function GradeBadge({ grade }: { grade: string }) {
  const color =
    grade === "A" ? "from-emerald-400 to-emerald-300 text-black"
    : grade === "B" ? "from-lime-300 to-lime-200 text-black"
    : grade === "C" ? "from-amber-300 to-amber-200 text-black"
    : grade === "D" ? "from-orange-400 to-orange-300 text-black"
    : "from-red-500 to-rose-500 text-white";

  return (
    <div
      className={
        "relative h-14 w-14 shrink-0 rounded-2xl grid place-items-center font-black text-lg " +
        `bg-gradient-to-br ${color} shadow-[0_0_40px_rgba(0,255,149,0.15)]`
      }
      aria-label={`Grade ${grade}`}
      title={`Grade ${grade}`}
    >
      <span>{grade}</span>
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/10" />
    </div>
  );
}

export default function GradePreview({ r }: { r: OpSecReport }) {
  const [open, setOpen] = useState(false);

  const tokenName = (r.symbol || r.name || "TOKEN").toUpperCase();
  const liq = typeof r.metrics?.liquidityUSD === "number" ? r.metrics.liquidityUSD : undefined;
  const top = typeof r.metrics?.topHolderPct === "number" ? r.metrics.topHolderPct : undefined;
  const ratio = r.metrics?.buySellRatio;

  // choose image + url for sharing (client-safe)
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ogImg =
    r.imageUrl ||
    `${origin}/api/opsec/og?grade=${encodeURIComponent(r.grade ?? "")}&name=${encodeURIComponent(tokenName)}`;
  const shareUrl = r.permalink || `${origin}/opsec?address=${encodeURIComponent(r.address)}`;

  // Pull key findings we want to headline
  const f = useMemo(() => {
    const byKey = Object.fromEntries((r.findings || []).map((x) => [x.key, x]));
    return {
      source: byKey["verified"],
      lp: byKey["lp_lock"],
      flow: byKey["buy_sell_ratio"],
      topPct: top,
    };
  }, [r, top]);

  // Why this grade (heaviest negatives)
  const topNegs = useMemo(() => {
    const neg = (r.findings || []).filter((x) => !x.ok);
    return neg.sort((a, b) => b.weight - a.weight).slice(0, 4);
  }, [r.findings]);

  // dynamic share/cast metadata (OG + Twitter + Farcaster vNext basics)
  const shareTitle = `OPSEC: ${tokenName} — Grade ${r.grade}`;
  const shareDesc = [
    r.findings?.find((x) => x.key === "verified")?.note,
    typeof liq === "number" ? `Liquidity ${fmtUsd(liq)}` : undefined,
    typeof top === "number" ? `Top holder ${fmtPct(top)}` : undefined,
    ratio ? `Buy/Sell ${fmtRatio(ratio)}` : undefined,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <Head>
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDesc} />
        <meta property="og:image" content={ogImg} />
        <meta property="og:url" content={shareUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDesc} />
        <meta name="twitter:image" content={ogImg} />

        {/* Farcaster Frames vNext (basic preview; your layout already sets defaults) */}
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content={ogImg} />
        <meta name="fc:frame:button:1" content="Open OPSEC" />
        <meta name="fc:frame:button:1:action" content="link" />
        <meta name="fc:frame:button:1:target" content={shareUrl} />
      </Head>

      <section className="rounded-2xl border border-white/10 p-5 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.05),transparent_60%)] overflow-hidden">
        {/* Header row with token + address + grade badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Live Preview</div>
            <h3 className="text-lg font-semibold truncate">{tokenName}</h3>
            {r.address ? (
              <div className="text-xs text-white/50 font-mono break-all mt-1">{r.address}</div>
            ) : null}
          </div>
          <GradeBadge grade={r.grade} />
        </div>

        {/* Bullets */}
        <div className="mt-4 space-y-1.5 text-[15px]">
          <div className="flex items-center">
            <Dot ok={!!f.source?.ok} />
            <span className={`${f.source?.ok ? "text-white" : "text-red-300"}`}>
              {f.source?.ok ? "Source verified" : "Source not verified"}
            </span>
          </div>
          <div className="flex items-center">
            <Dot ok={!!f.lp?.ok} />
            <span className={`${f.lp?.ok ? "text-white" : "text-red-300"}`}>
              {f.lp?.ok ? f.lp?.note || "LP locked" : f.lp?.note || "LP lock unknown"}
            </span>
          </div>
          <div className="flex items-center">
            <Dot ok={!!f.flow?.ok} />
            <span className={`${f.flow?.ok ? "text-white" : "text-red-300"}`}>
              {f.flow?.ok ? "Balanced flow" : "Skewed 24h order flow"}
            </span>
          </div>
          {/* Top holder: value-aware coloring */}
          <div className="flex items-center">
            <Dot ok={typeof f.topPct === "number" ? f.topPct < 20 : true} />
            <span className={`${typeof f.topPct === "number" && f.topPct >= 20 ? "text-red-300" : "text-white"}`}>
              {typeof f.topPct === "number" ? `Top holder ${fmtPct(f.topPct)}` : "Top holder —"}
            </span>
          </div>
        </div>

        {/* Metric pills */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Pill k="Liquidity" v={fmtUsd(liq)} />
          <Pill k="Top Holder" v={fmtPct(top)} />
          <Pill k="Buy/Sell" v={fmtRatio(ratio)} />
        </div>

        {/* Details accordion */}
        <div className="mt-5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs px-3 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
            aria-expanded={open}
          >
            {open ? "Hide details" : "What the score means"}
          </button>

          {open && (
            <div className="mt-3 space-y-3 text-sm">
              <Detail
                title="Why this grade"
                good="Passing items increase the score via weighted checks."
                bad="The items below reduced the score the most:"
                refNote={
                  topNegs.length
                    ? topNegs.map((x) => `• ${x.note} (w:${x.weight})`).join("\n")
                    : "No major negatives."
                }
              />
              <Detail
                title="Source verification"
                good="Contract is verified on BaseScan with readable source."
                bad="Bytecode-only or unverifiable source reduces transparency."
                refNote={r.findings.find((x) => x.key === "verified")?.note}
              />
              <Detail
                title="LP lock & ownership"
                good="LP tokens locked/burned and privileges renounced/neutralized."
                bad="No lock evidence or powerful owner privileges remain."
                refNote={
                  r.findings.find((x) => x.key === "lp_lock")?.note ||
                  r.findings.find((x) => x.key === "owner")?.note
                }
              />
              <Detail
                title="Market health"
                good="24h order flow looks balanced; liquidity depth supports trading."
                bad="Thin or heavily skewed flow; shallow liquidity."
                refNote={[
                  typeof liq === "number" ? `Liquidity ≈ ${fmtUsd(liq)}` : undefined,
                  r.metrics?.buySellRatio ? `Buy/Sell ${fmtRatio(r.metrics.buySellRatio)}` : undefined,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              />
              <Detail
                title="Holder distribution"
                good="No single holder dominates; distribution looks organic."
                bad="Top holder concentration is elevated."
                refNote={typeof top === "number" ? `Top holder ${fmtPct(top)}` : undefined}
              />
              <Detail
                title="Security screens"
                good="No critical GoPlus/Honeypot flags."
                bad="One or more security flags present; review tokens/approvals."
                refNote={r.findings
                  .filter((x) => ["goplus", "honeypot", "blacklist", "tax_swing"].includes(x.key))
                  .map((x) => x.note)
                  .join(" • ")}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Detail({
  title,
  good,
  bad,
  refNote,
}: {
  title: string;
  good: string;
  bad: string;
  refNote?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 p-3 bg-white/[0.03] whitespace-pre-wrap">
      <div className="font-medium mb-1">{title}</div>
      <ul className="list-disc pl-5 space-y-1 text-white/80">
        <li className="text-emerald-300/90">{good}</li>
        <li className="text-red-300/90">{bad}</li>
        {refNote ? <li className="text-white/60">Latest: {refNote}</li> : null}
      </ul>
    </div>
  );
}
