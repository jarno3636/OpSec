"use client";
import { useState } from "react";
import AgencyChrome from "@/components/AgencyChrome";
import Spinner from "@/components/Spinner";

export default function Page() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    const r = await fetch(`/api/opsec/analyze?query=${query}`);
    const j = await r.json();
    setData(j);
    setLoading(false);
  };

  return (
    <AgencyChrome>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste Base token address (0x...)"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          />
          <button
            onClick={run}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-scan font-semibold text-black disabled:opacity-70"
          >
            {loading ? <Spinner size={16} /> : "Analyze"}
          </button>
        </div>

        {data && (
          <div className="space-y-4">
            <div className="text-lg font-bold text-emerald-300">{data.summary}</div>

            {data.sources.map((src: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 p-4 bg-white/[0.03] space-y-2"
              >
                <h3 className="font-semibold text-sky-300 text-lg">{src.source}</h3>
                {!src.ok && <p className="text-red-400">⚠️ Error fetching data</p>}

                {src.source === "GoPlus" && src.ok && (
                  <>
                    <p>Proxy: {src.proxy ? "⚠️ Yes" : "✅ No"}</p>
                    <p>Blacklist: {src.blacklist ? "⚠️ Enabled" : "✅ None"}</p>
                    <p>Mintable: {src.mintable ? "⚠️ Yes" : "✅ No"}</p>
                    <p>Owner: {src.owner ?? "Unknown"}</p>
                    <p>Taxes: {src.taxes.buy ?? "?"}% / {src.taxes.sell ?? "?"}%</p>
                  </>
                )}

                {src.source === "Honeypot.is" && src.ok && (
                  <>
                    <p>Risk: {src.verdict}</p>
                    <p>Honeypot: {src.honeypot ? "⚠️ Yes" : "✅ No"}</p>
                    <p>Buy/Sell: {src.trading?.canBuy ? "✅" : "❌"} / {src.trading?.canSell ? "✅" : "❌"}</p>
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
          </div>
        )}
      </div>
    </AgencyChrome>
  );
}
