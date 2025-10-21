// app/api/opsec/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { fetchBaseScan, fetchGoPlus, fetchHoneypot, fetchMarkets } from "@/lib/opsec/sources";
import { computeReport } from "@/lib/opsec/score";

/* ---------- Runtime Config ---------- */
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // prevent Vercel edge aborts

/* ---------- Safe fetch with retry ---------- */
async function resilient<T>(
  fn: () => Promise<T>,
  label: string,
  retries = 2,
  timeoutMs = 30_000
): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn();
      clearTimeout(timer);
      return result;
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`[opsec:${label}] attempt ${attempt} failed:`, err?.message);
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 1000 * attempt)); // backoff
    }
  }
  return null;
}

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
    /* ---------- Concurrent fetches with resilience ---------- */
    const results = await Promise.allSettled([
      resilient(() => fetchBaseScan(address), "BaseScan"),
      resilient(() => fetchMarkets(address), "Markets"),
      resilient(() => fetchGoPlus(address), "GoPlus"),
      resilient(() => fetchHoneypot(address), "Honeypot"),
    ]);

    const [bs, markets, gp, hp] = results.map((r) =>
      r.status === "fulfilled" ? r.value : null
    );

    /* ---------- Compute Report ---------- */
    const report = await computeReport(address, { bs, markets, gp, hp } as any);

    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    report.imageUrl = `${site}/api/opsec/og?grade=${report.grade}&name=${encodeURIComponent(
      report.symbol ?? report.name ?? "Token"
    )}`;
    report.permalink = `${site}/opsec/${address}`;

    /* ---------- Diagnostics ---------- */
    const upstreamDiagnostics = [
      ...(bs?._diagnostics ?? []),
      ...(markets?._diagnostics ?? []),
      ...(gp?._diagnostics ?? []),
      ...(hp?._diagnostics ?? []),
    ].map((d) => ({
      ...d,
      note: d.note || "fetch completed or failed gracefully",
    }));

    /* ---------- Base builder metadata ---------- */
    const baseInfo = {
      baseBuilder: {
        ownerAddress: "0x7fd97A417F64d2706cF5C93c8fdf493EdA42D25c",
        chainId: 8453,
        explorer: "https://basescan.org",
      },
    };

    /* ---------- Final Payload ---------- */
    const payload = debug
      ? { ...report, ...baseInfo, upstreamDiagnostics, debug: true }
      : { ...report, ...baseInfo };

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
