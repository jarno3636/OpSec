import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { fetchGoPlus, fetchHoneypot, fetchDexscreener } from "@/lib/opsec/sources";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("query");
  if (!q || !isAddress(q)) {
    return NextResponse.json({ error: "Invalid Base token address." }, { status: 400 });
  }

  const addr = q as Address;
  const [gp, hp, ds] = await Promise.all([fetchGoPlus(addr), fetchHoneypot(addr), fetchDexscreener(addr)]);

  const safe =
    !gp.honeypot &&
    !hp.honeypot &&
    !gp.blacklist &&
    !gp.mintable &&
    (hp.verdict?.toLowerCase() ?? "").includes("low");

  const summary = safe
    ? `✅ Appears safe — Buy/Sell OK: ${hp.trading?.canBuy ? "✅" : "❌"}/${hp.trading?.canSell ? "✅" : "❌"} · Taxes ${hp.taxes?.buy ?? gp.taxes?.buy ?? "?"}%/${hp.taxes?.sell ?? gp.taxes?.sell ?? "?"}%`
    : `⚠️ Potential risk — ${hp.reason || "Check source data"}`;

  return NextResponse.json({
    address: addr,
    summary,
    sources: [gp, hp, ds],
    fetchedAt: new Date().toISOString(),
  });
}
