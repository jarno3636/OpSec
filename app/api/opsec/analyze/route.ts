// app/api/opsec/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import {
  fetchBaseScan,
  fetchMarkets,
  fetchGoPlus,
  fetchHoneypot,
} from "@/lib/opsec/sources";
import { computeReport } from "@/lib/opsec/score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get("query") || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  // Validate input
  if (!qRaw || !isAddress(qRaw)) {
    return NextResponse.json(
      { error: "Please provide a valid Base token contract address (0x…)." },
      { status: 400 }
    );
  }

  const address = qRaw as Address;

  try {
    // Run all upstream sources concurrently
    const [bs, markets, gp, hp] = await Promise.all([
      fetchBaseScan(address),
      fetchMarkets(address),
      fetchGoPlus(address),
      fetchHoneypot(address),
    ]);

    // Compute core OPSEC report
    const report = await computeReport(address, { bs, markets, gp, hp } as any);

    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const baseChainId = 8453;

    // Attach Base metadata and URLs
    report.chain = {
      name: "Base",
      chainId: baseChainId,
      explorer: "https://basescan.org",
    };
    report.imageUrl = `${site}/api/opsec/og?grade=${report.grade}&name=${encodeURIComponent(
      report.symbol ?? report.name ?? "Token"
    )}`;
    report.permalink = `${site}/opsec/${address}`;

    // Collect diagnostics for debug mode
    const upstreamDiagnostics = [
      ...(bs?._diagnostics ?? []),
      ...(markets?._diagnostics ?? []),
      ...(gp?._diagnostics ?? []),
      ...(hp?._diagnostics ?? []),
    ];

    // Final payload
    const payload = debug ? { ...report, upstreamDiagnostics, debug: true } : report;

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("[/api/opsec/analyze] fatal", e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? "Unexpected failure" },
      { status: 500 }
    );
  }
}
