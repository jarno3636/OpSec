// components/SignalBoard.tsx
"use client";
import type { SourceStatus, RiskBadge } from "@/lib/opsec/types";

export default function SignalBoard({
  sources,
  badges,
  coverage,
  confidence,
}: {
  sources: SourceStatus[];
  badges: RiskBadge[];
  coverage?: number;
  confidence?: "low" | "med" | "high";
}) {
  const pill = (t: string) => (
    <span className="px-2 py-1 rounded-md text-xs border border-white/10 bg-white/5">{t}</span>
  );

  const statusDot = (ok: boolean | null) => (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
        ok === true ? "bg-emerald-400" : ok === false ? "bg-red-400" : "bg-white/30"
      }`}
      aria-hidden
    />
  );

  return (
    <section className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Security Aggregator</h3>
        <div className="flex items-center gap-2">
          {coverage !== undefined && pill(`Coverage ${coverage}%`)}
          {confidence && pill(`Confidence ${confidence}`)}
        </div>
      </div>

      {/* Badges */}
      {badges?.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.key}
              className={`text-xs px-2 py-1 rounded-md border ${
                b.level === "high"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : b.level === "warn"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : "border-white/15 bg-white/5 text-white/80"
              }`}
              title={b.text}
            >
              {b.text}
            </span>
          ))}
        </div>
      ) : null}

      {/* Sources grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        {sources.map((s) => (
          <div key={s.key} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 flex items-center">
            {statusDot(s.ok)}
            <div className="truncate">
              <div className="font-medium">{s.label}</div>
              {s.note ? <div className="text-xs text-white/60 truncate">{s.note}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
