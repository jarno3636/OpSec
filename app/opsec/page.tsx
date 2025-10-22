"use client";
import { useState } from "react";
import AgencyChrome from "@/components/AgencyChrome";
import Spinner from "@/components/Spinner";
import ShareSummary from "@/components/ShareSummary";

export default function OpSecPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setData(null);
    const r = await fetch(`/api/opsec/analyze?query=${q}`);
    const j = await r.json();
    setData(j);
    setLoading(false);
  };

  return (
    <AgencyChrome>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Paste Base token address (0x...)"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-3"
          />
          <button
            onClick={run}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Spinner size={16} /> : "Analyze"}
          </button>
        </div>

        {loading && (
          <div className="text-white/70 text-sm">
            Running checks — GoPlus • Honeypot.is • DexScreener …
          </div>
        )}

        {data && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
              <div className="text-lg font-bold text-emerald-300 mb-1">Summary</div>
              <div className="text-sm text-white/80 font-mono">{data.summary}</div>
            </div>

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
                    <p>Owner: {src.owner ?? "Unknown"}</p>
                    <p>Taxes: {src.taxes.buy ?? "?"}% / {src.taxes.sell ?? "?"}%</p>
                  </>
                )}

                {src.source === "Honeypot.is" && src.ok && (
                  <>
                    <p>Risk: {src.verdict}</p>
                    <p>Honeypot: {src.honeypot ? "⚠️ Yes" : "✅ No"}</p>
                    <p>
                      Buy/Sell: {src.trading?.canBuy ? "✅" : "❌"} /{" "}
                      {src.trading?.canSell ? "✅" : "❌"}
                    </p>
                    <p>Taxes: {src.taxes.buy ?? "?"}% / {src.taxes.sell ?? "?"}%</p>
                    <p>Gas: {src.gas.buy ?? "?"} / {src.gas.sell ?? "?"}</p>
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
                      Liquidity: ${Number(src.liquidityUSD).toLocaleString()} | 24h Vol: $
                      {Number(src.volume24h).toLocaleString()}
                    </p>
                    <p>Price: ${src.priceUSD}</p>
                  </>
                )}
              </div>
            ))}

            <ShareSummary summary={data.summary} address={data.address} />
          </div>
        )}
      </div>
    </AgencyChrome>
  );
}
