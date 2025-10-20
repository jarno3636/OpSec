import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpSec — Analyze a Base token",
  description: "Paste a Base token contract address and run OpSec due-diligence.",
  openGraph: {
    title: "OpSec — Analyze a Base token",
    description: "Paste a Base token contract address and run OpSec due-diligence.",
    images: ["/icon-1200x630.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpSec — Analyze a Base token",
    description: "Paste a Base token contract address and run OpSec due-diligence.",
    images: ["/icon-1200x630.png"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "/api/opsec/og?grade=A&name=OpSec",
    "fc:frame:button:1": "Analyze a Token",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/opsec",
  },
};
