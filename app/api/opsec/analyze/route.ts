import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { fetchGoPlus, fetchHoneypot, fetchDexscreener } from "@/lib/opsec/sources";

function pctNum(v?: number | string | null): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("query") || "").trim();

  if (!q || !isAddress(q)) {
    return NextResponse.json({ error: "Invalid Base token address." }, { status: 400 });
  }

  const addr = q as Address;

  const [gp, hp, ds] = await Promise.all([
    fetchGoPlus(addr),
    fetchHoneypot(addr),
    fetchDexscreener(addr),
  ]);

  // Derive booleans/values we need for the human summary
  const buyOk = hp?.trading?.canBuy === true;
  const sellOk = hp?.trading?.canSell === true;

  const buyTax = pctNum(hp?.taxes?.buy ?? gp?.taxes?.buy);
  const sellTax = pctNum(hp?.taxes?.sell ?? gp?.taxes?.sell);

  const lowRisk = (hp?.verdict ?? "").toLowerCase().includes("low");

  const safe =
    gp?.ok === true &&
    hp?.ok === true &&
    !gp.honeypot &&
    !hp.honeypot &&
    !gp.blacklist &&
    !gp.mintable &&
    lowRisk;

  // Clean, share-friendly one-liner (no red ❌)
  const summary = safe
    ? `✅ Appears safe — Buy/Sell: ${buyOk ? "OK" : "Check"}/${sellOk ? "OK" : "Check"} · Taxes ${buyTax ?? "?"}%/${sellTax ?? "?"}%`
    : `⚠️ Potential risk — ${hp?.reason || (gp?.honeypot ? "Honeypot risk (GoPlus)" : "Check source data")}`;

  // Surface best-effort name/symbol for UI + sharing (UPPERCASED in UI)
  const symbol = (ds?.baseToken || "").toString();
  const name = symbol; // we only have symbol from Dexscreener; keep field for future sources

  return NextResponse.json({
    address: addr,
    summary,
    sources: [gp, hp, ds],
    fetchedAt: new Date().toISOString(),
    symbol,
    name,
  });
}
