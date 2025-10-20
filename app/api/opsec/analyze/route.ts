// app/api/opsec/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import type { Address } from "viem";
import { fetchBaseScan, fetchDexScreener, fetchGoPlus, fetchHoneypot, resolveName } from "@/lib/opsec/sources";
import { computeReport } from "@/lib/opsec/score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get("query") || "").trim();
  if (!qRaw) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }

  let address: Address;
  try {
    address = (isAddress(qRaw) ? qRaw : await resolveName(qRaw)) as Address;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Invalid address or unsupported name search. Please paste a Base token address." },
      { status: 400 }
    );
  }

  try {
    // Call upstreams in parallel; each function soft-fails and returns a normalized shape
    const [bs, dx, gp, hp] = await Promise.all([
      fetchBaseScan(address),
      fetchDexScreener(address),
      fetchGoPlus(address),
      fetchHoneypot(address),
    ]);

    const report = await computeReport(address, { bs, dx, gp, hp } as any);

    // Fill in sharing metadata (these are expected downstream)
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    report.imageUrl = `${site}/api/opsec/og?grade=${report.grade}&name=${encodeURIComponent(
      report.symbol ?? report.name ?? "Token"
    )}`;
    report.permalink = `${site}/opsec/${address}`;

    // Surface non-fatal upstream errors for visibility (useful in client/devtools)
    const upstreamErrors = [
      ...(bs?._errors || []),
      ...(dx?._errors || []),
      ...(gp?._errors || []),
      ...(hp?._errors || []),
    ].filter(Boolean);

    return NextResponse.json(
      upstreamErrors.length ? { ...report, upstreamErrors } : report,
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[/api/opsec/analyze] fatal", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
