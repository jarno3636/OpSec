/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // keep name short and UPPERCASED for visual consistency
  const name = (searchParams.get("name") ?? "TOKEN").toUpperCase().slice(0, 32);
  const summary = (searchParams.get("summary") ?? "Security snapshot").slice(0, 220);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "1200px",
          height: "630px",
          padding: "60px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%)",
          color: "#fff",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#00FF95",
                color: "#000",
                fontWeight: 900,
                fontSize: 36,
                display: "grid",
                placeItems: "center",
              }}
            >
              O
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "#00FF95" }}>OpSec</div>
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 700,
              textAlign: "right",
              maxWidth: "55%",
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            width: "100%",
            background:
              "linear-gradient(90deg, rgba(0,255,149,0.7), rgba(255,255,255,0.15), rgba(0,255,149,0.3))",
            margin: "24px 0 28px",
          }}
        />

        {/* Summary card */}
        <div
          style={{
            marginTop: 10,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.7)" }}>Share Summary</div>
          <div
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 26,
              color: "#E7FBEF",
              whiteSpace: "pre-wrap",
            }}
          >
            {summary}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(255,255,255,0.6)",
            fontSize: 20,
          }}
        >
          <div>Base Network — Aggregated Security Snapshot</div>
          <div style={{ color: "#00FF95", fontWeight: 600 }}>goplus • honeypot.is • dexscreener</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
