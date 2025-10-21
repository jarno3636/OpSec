import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://opsec-mini.vercel.app";

  const manifest = {
    name: "OpSec",
    description: "Professional token due-diligence for Base.",
    website: base,
    icon: `${base}/icon-512.png`,
    splash: {
      url: `${base}/icon-1200x630.png`,
      aspectRatio: "1.91:1",
    },
    frames: {
      version: "vNext",
      imageAspectRatio: "1.91:1",
      // postUrl: `${base}/api/frame`,
    },
    /** ✅ Added baseBuilder block */
    baseBuilder: {
      ownerAddress: "0x7fd97A417F64d2706cF5C93c8fdf493EdA42D25c",
    },
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
