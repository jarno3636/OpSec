import { ImageResponse } from "next/og";
export const runtime = "edge";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade") ?? "—";
  const name  = searchParams.get("name")  ?? "Token";
  return new ImageResponse(
    (<div style={{ display:"flex", width:"100%", height:"100%", background:"#0a0a0a", color:"#fff", padding:48, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <div style={{ fontSize:64, fontWeight:800, color:"#00ff95" }}>OPSEC</div>
      <div style={{ marginLeft:"auto", textAlign:"right" }}>
        <div style={{ fontSize:36, opacity:.9 }}>{name}</div>
        <div style={{ fontSize:120, fontWeight:900 }}>{grade}</div>
      </div>
    </div>),
    { width: 1200, height: 630 }
  );
}
