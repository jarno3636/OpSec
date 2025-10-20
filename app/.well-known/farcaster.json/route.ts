import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const site = getSiteUrl();
  // Minimal, non-signing manifest. Extend with accountAssociation when you add signer flows.
  const manifest = {
    name: "OpSec",
    iconUrl: `${site}/icon-192.png`,
    homeUrl: `${site}/`,
    permissions: {
      // declare what you might use; informative to some hosts
      camera: false,
      microphone: false,
    },
  };
  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
