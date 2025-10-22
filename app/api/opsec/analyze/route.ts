import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { fetchGoPlus, fetchHoneypot } from "@/lib/opsec/sources";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();
  if (!query || !isAddress(query)) {
    return NextResponse.json({ error: "Invalid Base token address (0x…)" }, { status: 400 });
  }

  const address = query as Address;

  const [goplus, honeypot] = await Promise.allSettled([
    fetchGoPlus(address),
    fetchHoneypot(address),
  ]);

  const summary = [
    { source: "GoPlus", data: goplus.status === "fulfilled" ? goplus.value : { error: goplus.reason } },
    { source: "Honeypot.is", data: honeypot.status === "fulfilled" ? honeypot.value : { error: honeypot.reason } },
  ];

  return NextResponse.json({
    address,
    fetchedAt: new Date().toISOString(),
    summary,
  });
}
