// app/api/opsec/analyze/route.ts
import { NextResponse } from "next/server";
import { fetchBaseScan, fetchDexScreener, fetchGoPlus, fetchHoneypot } from "@/lib/opsec/sources";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const [basescan, dexscreener, goplus, honeypot] = await Promise.allSettled([
    fetchBaseScan(query),
    fetchDexScreener(query),
    fetchGoPlus(query),
    fetchHoneypot(query),
  ]);

  const summary = [
    { source: "BaseScan", verdict: basescan.value?.verdict ?? "—", note: basescan.value?.note },
    { source: "DEX Screener", verdict: dexscreener.value?.verdict ?? "—", note: dexscreener.value?.note },
    { source: "GoPlus", verdict: goplus.value?.verdict ?? "—", note: goplus.value?.note },
    { source: "Honeypot.is", verdict: honeypot.value?.verdict ?? "—", note: honeypot.value?.note },
  ];

  return NextResponse.json({
    address: query,
    updated: new Date().toISOString(),
    summary: summary.filter(x => x.verdict !== "—"),
  });
}
