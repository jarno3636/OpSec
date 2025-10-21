import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://opsec-mini.vercel.app";

  const manifest = {
    name: "OpSec",
    description: "Professional token due-diligence for Base.",
    website: base,
    // Used by Farcaster clients to show an app icon
    icon: `${base}/icon-512.png`,
    // Nice preview when a client wants a large image (OG-like)
    splash: {
      url: `${base}/icon-1200x630.png`,
      aspectRatio: "1.91:1",
    },
    // Frames meta
    frames: {
      version: "vNext",
      imageAspectRatio: "1.91:1",
      // If you later add a POST endpoint for interactive frames, set it here:
      // postUrl: `${base}/api/frame`,
    },
    // Optional: simple action so users can jump into the analyzer
    actions: [
      {
        name: "Analyze with OpSec",
        icon: `${base}/favicon.ico`,
        description: "Open OpSec and paste a Base token address.",
        action: {
          type: "link",
          url: `${base}/opsec`,
        },
      },
    ],
    // Optional: contact / developer info
    developer: {
      name: "OpSec",
      url: base,
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
