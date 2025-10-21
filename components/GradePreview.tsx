"use client";
import React, { useMemo, useState } from "react";
import type { OpSecReport } from "@/lib/opsec/types";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
        ok ? "bg-emerald-400" : "bg-red-400"
      }`}
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

export default function GradePreview({ r }: { r: OpSecReport }) {
  const [open, setOpen] = useState(false);

  const liq = typeof r.metrics?.liquidityUSD === "number" ? r.metrics.liquidityUSD : undefined;
  const top = typeof r.metrics?.topHolderPct === "number" ? r.metrics.topHolderPct : undefined;
  const ratio = r.metrics?.buySellRatio;

  // pick findings we want to headline
  const f = useMemo(() => {
    const byKey = Object.fromEntries((r.findings || []).map((x) => [x.key, x]));
    return {
      source: byKey["verified"],
      lp: byKey["lp_lock"],
      flow: byKey["buy_sell_ratio"],
      topPct: top,
    };
  }, [r, top]);

  // helpers
  const fmtUsd = (n?: number) =>
    typeof n === "number" ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—";
  const fmtPct = (n?: number) =>
    typeof n === "number" ? `${n.toFixed(1)}%` : "—";
  const fmtRatio = (x?: string) => (x ? `${x}x` : "—");

  return (
    <section className="rounded-2xl border border-white/10 p-5 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.05),transparent_60%)] overflow-hidden">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Live Preview</div>
          <h3 className="text-lg font-semibold">Grade</h3>
        </div>
        <div
          className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg ${
            r.grade === "A"
              ? "bg-emerald-400 text-black"
              : r.grade === "B"
              ? "bg-lime-300 text-black"
              : r.grade === "C"
              ? "bg-amber-300 text-black"
              : r.grade === "D"
              ? "bg-orange-400 text-black"
              : "bg-red-500 text-white"
          }`}
          aria-label={`Grade ${r.grade}`}
        >
          {r.grade}
        </div>
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
            {f.lp?.ok ? "LP locked" : "LP lock unknown"}
          </span>
        </div>
        <div className="flex items-center">
          <Dot ok={!!f.flow?.ok} />
          <span className={`${f.flow?.ok ? "text-white" : "text-red-300"}`}>
            {f.flow?.ok ? "Balanced flow" : "Skewed 24h order flow"}
          </span>
        </div>
        {/* Top holder special-line: when number exists show it and color by threshold */}
        <div className="flex items-center">
          <Dot ok={typeof f.topPct === "number" ? f.topPct < 20 : true} />
          <span
            className={`${
              typeof f.topPct === "number" && f.topPct >= 20 ? "text-red-300" : "text-white"
            }`}
          >
            {typeof f.topPct === "number"
              ? `Top holder ${f.topPct.toFixed(1)}%`
              : "Top holder —"}
          </span>
        </div>
      </div>

      {/* metric pills */}
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
              refNote={
                (typeof liq === "number" ? `Liquidity ≈ ${fmtUsd(liq)}` : "") +
                (r.metrics?.buySellRatio ? ` • Buy/Sell ${fmtRatio(r.metrics.buySellRatio)}` : "")
              }
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
              refNote={
                r.findings
                  .filter((x) => ["goplus", "honeypot", "blacklist", "tax_swing"].includes(x.key))
                  .map((x) => x.note)
                  .join(" • ")
              }
            />
          </div>
        )}
      </div>
    </section>
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
    <div className="rounded-lg border border-white/10 p-3 bg-white/[0.03]">
      <div className="font-medium mb-1">{title}</div>
      <ul className="list-disc pl-5 space-y-1 text-white/80">
        <li className="text-emerald-300/90">{good}</li>
        <li className="text-red-300/90">{bad}</li>
        {refNote ? <li className="text-white/60">Latest: {refNote}</li> : null}
      </ul>
    </div>
  );
}
