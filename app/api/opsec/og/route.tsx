import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade") ?? "—";
  const name = searchParams.get("name") ?? "Token";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 100%)",
          color: "#fff",
          padding: "64px",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        {/* Header / Branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#00FF95",
              textTransform: "uppercase",
            }}
          >
            OpSec
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.8)",
              fontWeight: 500,
              textAlign: "right",
              maxWidth: "60%",
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            width: "100%",
            background: "linear-gradient(90deg, rgba(0,255,149,0.6), rgba(255,255,255,0.15))",
            margin: "24px 0",
          }}
        />

        {/* Grade Badge */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 160,
              fontWeight: 900,
              color:
                grade === "A"
                  ? "#00FF95"
                  : grade === "B"
                  ? "#A5FFB8"
                  : grade === "C"
                  ? "#FFD35B"
                  : grade === "D"
                  ? "#FF8F5B"
                  : "#FF4E4E",
              textShadow: "0 0 25px rgba(0,255,149,0.4)",
            }}
          >
            {grade}
          </div>
        </div>

        {/* Footer Line */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 64,
            fontSize: 20,
            opacity: 0.5,
            letterSpacing: "0.05em",
          }}
        >
          Base Network — Automated Token Analysis
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
