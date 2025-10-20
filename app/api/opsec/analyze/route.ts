// app/api/opsec/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import type { Address } from "viem";
import { fetchBaseScan, fetchDexScreener, fetchGoPlus, fetchHoneypot } from "@/lib/opsec/sources";
import { computeReport } from "@/lib/opsec/score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get("query") || "").trim();
  if (!qRaw || !isAddress(qRaw)) {
    return NextResponse.json(
      { error: "Please provide a valid Base token contract address (0x…)." },
      { status: 400 }
    );
  }
  const address = qRaw as Address;

  try {
    const [bs, dx, gp, hp] = await Promise.all([
      fetchBaseScan(address),
      fetchDexScreener(address),
      fetchGoPlus(address),
      fetchHoneypot(address),
    ]);

    const report = await computeReport(address, { bs, dx, gp, hp } as any);
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";

    report.imageUrl = `${site}/api/opsec/og?grade=${report.grade}&name=${encodeURIComponent(
      report.symbol ?? report.name ?? "Token"
    )}`;
    report.permalink = `${site}/opsec/${address}`;

    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[/api/opsec/analyze] fatal", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
