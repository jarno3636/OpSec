// app/disclaimer/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import AgencyChrome from "@/components/AgencyChrome";

export const metadata: Metadata = {
  title: "Disclaimer — OpSec",
  description:
    "Important information about OpSec reports, limitations, and user responsibility.",
  openGraph: {
    title: "Disclaimer — OpSec",
    description:
      "Important information about OpSec reports, limitations, and user responsibility.",
    images: ["/icon-1200x630.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disclaimer — OpSec",
    description:
      "Important information about OpSec reports, limitations, and user responsibility.",
    images: ["/icon-1200x630.png"],
  },
  other: {
    // Farcaster-friendly hints (frames disabled on this page, but tags won’t hurt)
    "fc:frame": "vNext",
  },
};

export default function DisclaimerPage() {
  return (
    <AgencyChrome>
      {/* page backdrop accent */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.05),transparent_60%)]" />
        </div>

        <main className="mx-auto w-full max-w-3xl px-4 py-10">
          {/* Header */}
          <header className="mb-6">
            <h1 className="text-3xl font-black tracking-tight">Disclaimer</h1>
            <p className="mt-2 text-white/70 text-sm">
              Last updated: <time dateTime="2025-01-01">Jan 2025</time>
            </p>
          </header>

          {/* Intro / Important note */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]">
            <p className="text-white/80">
              OpSec provides automated, best-effort analyses of Base network
              tokens. The information is presented for educational and
              informational purposes only and does{" "}
              <span className="font-semibold">not</span> constitute investment,
              legal, accounting, or security advice. OpSec is{" "}
              <span className="font-semibold">not an audit</span>, code review,
              or certification of safety.
            </p>
          </section>

          {/* Risks & limitations */}
          <section className="mt-8">
            <h2 className="text-xl font-bold">Key Risks &amp; Limitations</h2>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-white/80">
              <li>
                <span className="font-semibold">Automated heuristics:</span>{" "}
                Scores and findings are produced by rules and third-party data
                sources and may be incomplete, stale, or incorrect.
              </li>
              <li>
                <span className="font-semibold">No guarantee of security:</span>{" "}
                Passing checks (e.g., honeypot, ownership, liquidity) does not
                guarantee that a token is safe, valuable, or free of
                vulnerabilities.
              </li>
              <li>
                <span className="font-semibold">Dynamic on-chain state:</span>{" "}
                Token permissions, ownership, liquidity, tax settings, and
                proxies can change at any time, potentially invalidating a prior
                report.
              </li>
              <li>
                <span className="font-semibold">Third-party dependencies:</span>{" "}
                We rely on public APIs and explorers (e.g., BaseScan, GoPlus,
                DEX Screener, Honeypot). Outages or discrepancies may affect
                accuracy.
              </li>
              <li>
                <span className="font-semibold">No endorsements:</span> A higher
                grade or “clean” report is not an endorsement or recommendation
                to buy, sell, or hold any asset.
              </li>
            </ul>
          </section>

          {/* DYOR */}
          <section className="mt-8">
            <h2 className="text-xl font-bold">Do Your Own Research</h2>
            <p className="mt-2 text-white/80">
              Always conduct independent research before interacting with any
              smart contract or token. At minimum, consider:
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <ul className="list-disc pl-6 space-y-2 text-white/80">
                <li>Reading verified source code and recent commits, if available.</li>
                <li>Reviewing on-chain history, liquidity locks, and deployer wallets.</li>
                <li>Checking community reputation, communication channels, and governance.</li>
                <li>Assessing market depth, volatility, and counterparties.</li>
                <li>Testing with small amounts and using appropriate risk controls.</li>
              </ul>
            </div>
          </section>

          {/* Liability */}
          <section className="mt-8">
            <h2 className="text-xl font-bold">No Liability</h2>
            <p className="mt-2 text-white/80">
              OpSec and its contributors are not responsible for losses,
              damages, or adverse outcomes arising from the use of this app or
              reliance on any report. By using OpSec, you acknowledge that you
              bear sole responsibility for your decisions and actions.
            </p>
          </section>

          {/* Footer row */}
          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/opsec"
              className="px-4 py-2 rounded-lg bg-scan text-black font-semibold hover:opacity-90 transition"
            >
              Analyze a Token
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition"
            >
              Back to Home
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/50">
            Have feedback or found an issue? Analyze a token and share your
            findings, or contact us through your preferred channel.
          </p>
        </main>
      </div>
    </AgencyChrome>
  );
}
