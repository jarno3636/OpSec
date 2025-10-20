// app/page.tsx
import Link from "next/link";
import AgencyChrome from "@/components/AgencyChrome";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <AgencyChrome>
      <div className="mx-auto max-w-5xl px-4">
        {/* HERO */}
        <section className="pt-10 pb-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <Logo size={48} />
              <h1 className="mt-4 text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Professional Token Due-Diligence
                <br />
                <span className="text-scan">for Base</span>
              </h1>
              <p className="mt-3 text-white/70 max-w-2xl">
                OpSec inspects Base tokens like a covert review team—source
                verification, ownership &amp; proxy checks, supply concentration,
                liquidity strength, market behavior, and honeypot/flag scans.
                Get a clean, shareable report in seconds.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/opsec"
                  className="px-5 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90 transition shadow-[0_8px_24px_-12px_rgba(0,255,149,0.45)]"
                >
                  Launch OpSec
                </Link>
                <a
                  href="https://basescan.org"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-xl border border-white/15 text-white/90 hover:bg-white/5 transition"
                >
                  BaseScan
                </a>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="w-full md:w-auto">
              <div className="rounded-2xl border border-white/10 p-5 bg-white/5 backdrop-blur-sm">
                <div className="text-xs font-mono text-white/60">LIVE PREVIEW</div>
                <div className="mt-2 rounded-xl bg-black/60 border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white/80 text-sm">GRADE</div>
                    <div className="w-12 h-12 rounded-xl bg-green-500 text-black font-black grid place-items-center text-2xl shadow-inner">
                      A
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/70 font-mono space-y-1">
                    <div>✓ Source verified</div>
                    <div>✓ LP locked</div>
                    <div>✓ Balanced flow</div>
                    <div className="text-red-300">✗ Top holder 27.1%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              title: "1) Paste Address",
              body:
                "Enter a Base token contract address (0x…). We automatically pull the most relevant on-chain and off-chain data.",
            },
            {
              title: "2) Deep Scan",
              body:
                "We query BaseScan, GoPlus, DEX Screener, Honeypot and on-chain reads to assemble a complete picture.",
            },
            {
              title: "3) Share",
              body:
                "Get a clean report with a letter grade and cast/tweet directly from the app.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-white/10 p-4 bg-white/[0.04] hover:bg-white/[0.06] transition"
            >
              <h3 className="font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-white/70">{c.body}</p>
            </div>
          ))}
        </section>

        {/* SCORING EXPLAINER */}
        <section className="mt-8 rounded-2xl border border-white/10 p-6 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.06),transparent_60%)] shadow-[0_0_30px_-15px_rgba(0,255,149,0.35)]">
          <h2 className="text-2xl font-bold">How the Score Works</h2>
          <p className="mt-1 text-white/70 max-w-3xl">
            OpSec produces a 0–100 score and a letter grade. Each category is a
            weighted sum of pass/fail checks. We surface the most impactful
            findings as a quick “summary” and show detailed items below.
          </p>

          <div className="mt-5 grid md:grid-cols-5 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="font-semibold">Contract &amp; Privileges</div>
              <div className="text-white/60">30%</div>
              <ul className="mt-2 text-white/70 space-y-1">
                <li>• Source verified</li>
                <li>• Proxy &amp; implementation</li>
                <li>• Ownership / renounce</li>
                <li>• Blacklist / pause / mint</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="font-semibold">Supply &amp; Holders</div>
              <div className="text-white/60">20%</div>
              <ul className="mt-2 text-white/70 space-y-1">
                <li>• Top holder %</li>
                <li>• Team/deployer buckets</li>
                <li>• Airdrop noise</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="font-semibold">Liquidity</div>
              <div className="text-white/60">20%</div>
              <ul className="mt-2 text-white/70 space-y-1">
                <li>• Depth (USD)</li>
                <li>• LP locks/burn</li>
                <li>• Pull/mint risk</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="font-semibold">Market Behavior</div>
              <div className="text-white/60">15%</div>
              <ul className="mt-2 text-white/70 space-y-1">
                <li>• 24h buy/sell balance</li>
                <li>• Wallet dispersion (heuristic)</li>
                <li>• Tax swing Δ</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="font-semibold">Security Signals</div>
              <div className="text-white/60">15%</div>
              <ul className="mt-2 text-white/70 space-y-1">
                <li>• Honeypot check</li>
                <li>• GoPlus flags</li>
                <li>• Socials on explorer</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/opsec"
              className="inline-block px-5 py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
            >
              Analyze a Token →
            </Link>
          </div>
        </section>
      </div>
    </AgencyChrome>
  );
}
