// app/api/opsec/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { fetchBaseScan, fetchGoPlus, fetchHoneypot, fetchMarkets } from "@/lib/opsec/sources";
import { computeReport } from "@/lib/opsec/score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get("query") || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  if (!qRaw || !isAddress(qRaw)) {
    return NextResponse.json(
      { error: "Please provide a valid Base token contract address (0x…).", debug },
      { status: 400 }
    );
  }

  const address = qRaw as Address;

  try {
    const [bs, markets, gp, hp] = await Promise.all([
      fetchBaseScan(address),
      fetchMarkets(address),
      fetchGoPlus(address),
      fetchHoneypot(address),
    ]);

    const report = await computeReport(address, { bs, markets, gp, hp } as any);

    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    report.imageUrl = `${site}/api/opsec/og?grade=${report.grade}&name=${encodeURIComponent(
      report.symbol ?? report.name ?? "Token"
    )}`;
    report.permalink = `${site}/opsec/${address}`;

    // Collect upstream call diagnostics if debug is on
    const upstreamDiagnostics = [
      ...(bs?._diagnostics ?? []),
      ...(markets?._diagnostics ?? []),
      ...(gp?._diagnostics ?? []),
      ...(hp?._diagnostics ?? []),
    ];

    // Merge optional Base metadata in a non-breaking way
    const baseInfo = {
      baseBuilder: {
        ownerAddress: "0x7fd97A417F64d2706cF5C93c8fdf493EdA42D25c",
        chainId: 8453,
        explorer: "https://basescan.org",
      },
    };

    const payload = debug
      ? { ...report, ...baseInfo, upstreamDiagnostics, debug: true }
      : { ...report, ...baseInfo };

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[/api/opsec/analyze] fatal", e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? "Unexpected failure" },
      { status: 500 }
    );
  }
}
