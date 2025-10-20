// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import AgencyChrome from "@/components/AgencyChrome";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "OpSec — Token Due-Diligence on Base",
  description:
    "Professional-grade automated token checks for Base: source verification, ownership & proxy checks, supply concentration, liquidity, market behavior, and honeypot/flag scans.",
  openGraph: {
    title: "OpSec — Token Due-Diligence on Base",
    description:
      "Professional-grade automated token checks for Base: source verification, ownership & proxy checks, supply concentration, liquidity, market behavior, and honeypot/flag scans.",
    url: "/",
    type: "website",
    images: [{ url: "/icon-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpSec — Token Due-Diligence on Base",
    description:
      "Professional-grade automated token checks for Base: source verification, ownership & proxy checks, supply concentration, liquidity, market behavior, and honeypot/flag scans.",
    images: ["/icon-1200x630.png"],
  },
  // Farcaster frame hint (generic home-frame)
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "/icon-1200x630.png",
    "fc:frame:button:1": "Launch OpSec",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/opsec",
  },
};

export default function HomePage() {
  return (
    <AgencyChrome>
      {/* Page backdrop accents */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          {/* soft vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.06),transparent_60%)]" />
          {/* faint vertical grid */}
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
            <div className="mx-auto h-full max-w-5xl px-4 grid grid-cols-12 gap-x-4 opacity-[0.03]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border-l border-white" />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4">
          {/* HERO */}
          <section className="pt-10 pb-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div>
                <Logo size={56} />
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
                    className="px-5 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90 transition shadow-[0_10px_30px_-12px_rgba(0,255,149,0.45)]"
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

                {/* small trust row */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">Automated checks</span>
                  <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">No wallet connect</span>
                  <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">Chain: Base</span>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="w-full md:w-auto">
                <div className="rounded-2xl border border-white/10 p-5 bg-white/5 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <div className="text-xs font-mono text-white/60 tracking-wide">LIVE PREVIEW</div>
                  <div className="mt-2 rounded-xl bg-black/60 border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-white/75 text-sm">GRADE</div>
                      <div className="w-12 h-12 rounded-xl bg-green-500 text-black font-black grid place-items-center text-2xl shadow-inner">
                        A
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-white/75 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-green-400" />
                        Source verified
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-green-400" />
                        LP locked
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-green-400" />
                        Balanced flow
                      </div>
                      <div className="flex items-center gap-2 text-red-300">
                        <span className="inline-block size-1.5 rounded-full bg-red-400" />
                        Top holder 27.1%
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="rounded-lg border border-white/10 bg-white/5 py-2">
                        <div className="text-white/60">Liquidity</div>
                        <div className="font-semibold">$58k</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 py-2">
                        <div className="text-white/60">Top Holder</div>
                        <div className="font-semibold">27%</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 py-2">
                        <div className="text-white/60">Buy/Sell</div>
                        <div className="font-semibold">1.1×</div>
                      </div>
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
                className="rounded-2xl border border-white/10 p-4 bg-white/[0.04] hover:bg-white/[0.06] transition shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]"
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
      </div>
    </AgencyChrome>
  );
}
