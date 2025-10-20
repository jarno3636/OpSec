// app/page.tsx
import Link from "next/link";
import AgencyChrome from "@/components/AgencyChrome";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <AgencyChrome>
      {/* HERO */}
      <section className="pt-10 pb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <Logo size={48} />
            <h1 className="mt-4 text-4xl md:text-5xl font-black leading-tight">
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
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/opsec"
                className="px-5 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90 transition"
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

          <div className="hidden md:block">
            <div className="rounded-2xl border border-white/10 p-5 bg-white/5">
              <div className="text-xs font-mono text-white/60">LIVE PREVIEW</div>
              <div className="mt-2 rounded-xl bg-black/60 border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white/80 text-sm">GRADE</div>
                  <div className="w-12 h-12 rounded-xl bg-green-500 text-black font-black grid place-items-center text-2xl">
                    A
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/60 font-mono">
                  ✓ Source verified
                  <br />✓ LP locked
                  <br />✓ Balanced flow
                  <br />✗ Top holder 27.1%
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
            title: "1) Paste or Search",
            body:
              "Enter a Base token address or search by name/symbol. We resolve to the most liquid Base pair automatically.",
          },
          {
            title: "2) Deep Scan",
            body:
              "We hit BaseScan, GoPlus, DEX Screener, Honeypot.is and on-chain reads to assemble a complete picture.",
          },
          {
            title: "3) Share",
            body:
              "Get a clean report with a letter grade and cast/tweet directly from the app.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-white/10 p-4 bg-white/5"
          >
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-white/70">{c.body}</p>
          </div>
        ))}
      </section>

      {/* SCORING EXPLAINER */}
      <section className="mt-8 rounded-2xl border border-white/10 p-6 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.06),transparent_60%)]">
        <h2 className="text-2xl font-bold">How the Score Works</h2>
        <p className="mt-1 text-white/70 max-w-3xl">
          OpSec produces a 0–100 score and a letter grade. Each category is a
          weighted sum of pass/fail checks. We surface the most impactful
          findings as a quick “summary” and show detailed items below.
        </p>

        <div className="mt-5 grid md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="font-semibold">Contract &amp; Privileges</div>
            <div className="text-white/60">30%</div>
            <ul className="mt-2 text-white/70 space-y-1">
              <li>• Source verified</li>
              <li>• Proxy &amp; implementation</li>
              <li>• Ownership / renounce</li>
              <li>• Blacklist / pause / mint</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="font-semibold">Supply &amp; Holders</div>
            <div className="text-white/60">20%</div>
            <ul className="mt-2 text-white/70 space-y-1">
              <li>• Top holder %</li>
              <li>• Team/deployer buckets</li>
              <li>• Airdrop noise</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="font-semibold">Liquidity</div>
            <div className="text-white/60">20%</div>
            <ul className="mt-2 text-white/70 space-y-1">
              <li>• Depth (USD)</li>
              <li>• LP locks/burn</li>
              <li>• Pull/mint risk</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="font-semibold">Market Behavior</div>
            <div className="text-white/60">15%</div>
            <ul className="mt-2 text-white/70 space-y-1">
              <li>• 24h buy/sell balance</li>
              <li>• Wallet dispersion (heuristic)</li>
              <li>• Tax swing Δ</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
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
      {/* Footer removed — global footer renders from layout */}
    </AgencyChrome>
  );
}
