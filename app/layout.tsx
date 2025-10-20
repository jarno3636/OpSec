import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpSec — Token Due Diligence on Base",
  description: "Professional-grade automated token checks for Base.",
  other: { "fc:frame": "vNext" } // embeddable meta (friendly for share)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
