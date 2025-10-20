import AgencyChrome from "@/components/AgencyChrome";
import ScoreBadge from "@/components/ScoreBadge";
import { KeyValue } from "@/components/KeyValue";
import type { OpSecReport } from "@/lib/opsec/types";

async function getReport(addr: string): Promise<OpSecReport> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/opsec/analyze?query=${addr}`, { cache: "no-store" });
  return r.json();
}

export default async function Page({ params }: { params: { address: string } }) {
  const r = await getReport(params.address);
  return (
    <AgencyChrome>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{r.name ?? r.symbol ?? r.address}</h1>
          <div className="text-sm text-white/60">{r.address}</div>
        </div>
        <ScoreBadge grade={r.grade} />
      </div>
      <div className="space-y-2">
        {r.findings.map((f) => (
          <div key={f.key} className={`text-sm ${f.ok ? "text-green-400" : "text-red-400"}`}>
            {f.ok ? "✓" : "✗"} {f.note} <span className="text-white/40">({f.weight})</span>
          </div>
        ))}
      </div>
    </AgencyChrome>
  );
}
