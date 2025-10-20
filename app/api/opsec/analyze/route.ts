import { NextRequest, NextResponse } from "next/server";
import { Address, isAddress } from "viem";
import { fetchBaseScan, fetchDexScreener, fetchGoPlus, fetchHoneypot, resolveName } from "@/lib/opsec/sources";
import { computeReport } from "@/lib/opsec/score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("query") || "").trim();
  if (!q) return NextResponse.json({ error: "missing query" }, { status: 400 });

  const address: Address = isAddress(q) ? (q as Address) : await resolveName(q);

  const [bs, dx, gp, hp] = await Promise.all([
    fetchBaseScan(address),
    fetchDexScreener(address),
    fetchGoPlus(address),
    fetchHoneypot(address)
  ]);

  const report = await computeReport(address, { bs, dx, gp, hp });
  report.imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/opsec/og?grade=${report.grade}&name=${encodeURIComponent(report.symbol ?? report.name ?? "Token")}`;
  report.permalink = `${process.env.NEXT_PUBLIC_SITE_URL}/opsec/${address}`;

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
