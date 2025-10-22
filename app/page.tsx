// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import AgencyChrome from "@/components/AgencyChrome";
import Logo from "@/components/Logo";
import ShareSummary from "@/components/ShareSummary";
import NewsBanner from "@/components/NewsBanner"; // ← NEW

export const metadata: Metadata = {
  title: "OpSec — Token Security Aggregator for Base",
  description:
    "Aggregate token safety data from GoPlus, Honeypot.is, and DexScreener — simple, shareable due-diligence reports for Base.",
  openGraph: {
    title: "OpSec — Token Security Aggregator for Base",
    description:
      "Aggregate token safety data from GoPlus, Honeypot.is, and DexScreener — simple, shareable due-diligence reports for Base.",
    url: "/",
    type: "website",
    images: [{ url: "/icon-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpSec — Token Security Aggregator for Base",
    description:
      "Aggregate token safety data from GoPlus, Honeypot.is, and DexScreener — simple, shareable due-diligence reports for Base.",
    images: ["/icon-1200x630.png"],
  },
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
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* HERO */}
        <div className="text-center">
          <Logo size={64} />
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Token Security — <span className="text-scan">Simplified</span>
          </h1>
          <p className="mt-2 text-white/70 max-w-2xl mx-auto">
            OpSec aggregates live data from trusted sources (GoPlus, Honeypot.is, DexScreener) to
            provide an instant, readable picture of Base token safety. No scoring — just facts.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/opsec"
              className="px-6 py-3 rounded-xl bg-scan text-black font-semibold hover:opacity-90"
            >
              Launch OpSec
            </Link>
            <a
              href="https://basescan.org"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl border border-white/15 text-white/90 hover:bg-white/5"
            >
              BaseScan
            </a>
          </div>
        </div>

        {/* 🔥 Latest security headlines (refreshes daily) */}
        <NewsBanner />

        {/* Example share */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-white/80 mb-3">
            Example Share Summary
          </h2>
          <ShareSummary
            summary="✅ Appears safe — Buy/Sell OK: ✅/✅ · Taxes 2%/2%"
            address="0x1234567890abcdef1234567890abcdef12345678"
          />
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: "1️⃣ Paste Address",
              body: "Enter a Base token address (0x...). We'll automatically query GoPlus, Honeypot, and DexScreener.",
            },
            {
              title: "2️⃣ Read Snapshot",
              body: "View key contract flags, trading simulation, and live liquidity in a clean summary card.",
            },
            {
              title: "3️⃣ Share Instantly",
              body: "Send your findings directly to X or Warpcast with one click.",
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
        </div>
      </div>
    </AgencyChrome>
  );
}
