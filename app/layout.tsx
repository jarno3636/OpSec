// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site";
import MiniAppBoot from "@/components/MiniAppBoot";
import AppReady from "@/components/AppReady";

const site = getSiteUrl();
const title = "OpSec — Token Due Diligence on Base";
const description = "Professional-grade automated token checks for Base.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#00ff95", // ✅ belongs here, not in metadata
};

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
  // Frames vNext default (pages can override as needed)
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
  // ❌ removed: themeColor
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Farcaster Mini-App SDK */}
        <script async src="https://cdn.farcaster.xyz/sdk/miniapp/v2.js"></script>

        {/* ✅ Farcaster Mini-App meta (absolute URLs) */}
        <meta name="x-miniapp-name" content="OpSec" />
        <meta name="x-miniapp-image" content={`${site}/api/opsec/og?grade=A&name=OpSec`} />
        <meta name="x-miniapp-url" content={site} />

        {/* Ultra-early MiniApp ready ping + retries */}
        <script
          id="fc-miniapp-ready"
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  if (window.__fcReadyInjected) return; window.__fcReadyInjected = true;
  var attempts = 0, maxAttempts = 40, done = false;
  function ping(){
    if (done) return;
    try { window.farcaster?.actions?.ready?.(); } catch(e) {}
    try { window.farcaster?.miniapp?.sdk?.actions?.ready?.(); } catch(e) {}
    try { window.Farcaster?.mini?.sdk?.actions?.ready?.(); } catch(e) {}
    if (++attempts >= maxAttempts) stop();
  }
  function stop(){ done = true; try{ clearInterval(iv); }catch(_){} 
    window.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('pageshow', onShow);
  }
  function onVis(){ if (!document.hidden) ping(); }
  function onFocus(){ ping(); }
  function onShow(){ ping(); }
  ping();
  document.addEventListener('DOMContentLoaded', ping, { once: true });
  var iv = setInterval(ping, 150);
  window.addEventListener('visibilitychange', onVis);
  window.addEventListener('focus', onFocus);
  window.addEventListener('pageshow', onShow);
})();
            `,
          }}
        />
      </head>
      <body>
        <MiniAppBoot />
        <AppReady />
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
