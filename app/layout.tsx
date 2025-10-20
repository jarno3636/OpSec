import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site";

const site = getSiteUrl();
const title = "OpSec — Token Due Diligence on Base";
const description = "Professional-grade automated token checks for Base.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title,
  description,
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: site,
    title,
    description,
    images: [
      { url: "/api/opsec/og?grade=A&name=OpSec", width: 1200, height: 630, alt: "OpSec preview" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/api/opsec/og?grade=A&name=OpSec"],
  },
  // Frames vNext default (individual pages can override with more specific buttons/targets)
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${site}/api/opsec/og?grade=A&name=OpSec`,
    "fc:frame:button:1": "Open OpSec",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": `${site}/opsec`,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  themeColor: "#00ff95",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
