"use client";
import { useState } from "react";

type Diag = { name: string; url: string; status?: number; ok: boolean; ms: number; note?: string };

export default function DebugPanel({ diagnostics }: { diagnostics: Diag[] }) {
  const [open, setOpen] = useState(true);

  if (!diagnostics?.length) return null;

  return (
    <div className="mx-auto w-full max-w-5xl mt-4">
      <div className="rounded-xl border border-white/15 bg-black/50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm"
        >
          <span className="font-semibold">Upstream Diagnostics</span>
          <span className="text-white/60">{open ? "Hide" : "Show"}</span>
        </button>

        {open && (
          <div className="px-4 pb-3 overflow-x-auto">
            <table className="w-full text-xs leading-6">
              <thead className="text-white/60">
                <tr>
                  <th className="text-left py-1 pr-2">Service</th>
                  <th className="text-left py-1 pr-2">URL</th>
                  <th className="text-left py-1 pr-2">Status</th>
                  <th className="text-left py-1 pr-2">OK</th>
                  <th className="text-left py-1 pr-2">ms</th>
                  <th className="text-left py-1">Note</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.map((d, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="py-1 pr-2 whitespace-nowrap">{d.name}</td>
                    <td className="py-1 pr-2 max-w-[420px] overflow-hidden text-ellipsis">{d.url}</td>
                    <td className="py-1 pr-2">{d.status ?? "—"}</td>
                    <td className={`py-1 pr-2 ${d.ok ? "text-emerald-400" : "text-red-300"}`}>{String(d.ok)}</td>
                    <td className="py-1 pr-2">{d.ms}</td>
                    <td className="py-1">{d.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
