// app/api/opsec/analyze/route.ts
import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { fetchGoPlus, fetchHoneypot, fetchAdditionalRisk } from "@/lib/opsec/sources";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 45;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qRaw = (searchParams.get("query") || "").trim();
  if (!qRaw || !isAddress(qRaw)) {
    return NextResponse.json({ error: "Please provide a valid Base token contract address (0x…)" }, { status: 400 });
  }
  const address = qRaw as Address;

  const results = await Promise.allSettled([
    fetchGoPlus(address),
    fetchHoneypot(address),
    fetchAdditionalRisk(address),
  ]);

  const summary = results.map((r) => {
    if (r.status === "fulfilled") {
      return r.value;
    } else {
      return { source: "Unknown", data: {}, error: String(r.reason) };
    }
  });

  return NextResponse.json({
    address,
    fetchedAt: new Date().toISOString(),
    summary,
  }, { headers: { "Cache-Control": "no-store" } });
}
