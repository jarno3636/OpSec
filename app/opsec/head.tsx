// app/opsec/head.tsx
// App Router needs a separate head file for per-route meta (incl. Farcaster frames)
export default function Head() {
  // Static frame that opens the OPSEC tool. (Token-specific frames come from the /opsec/[address] page.)
  return (
    <>
      <meta name="fc:frame" content="vNext" />
      <meta name="fc:frame:image" content="/api/opsec/og?grade=A&name=OpSec" />
      <meta name="fc:frame:button:1" content="Analyze a Token" />
      <meta name="fc:frame:button:1:action" content="link" />
      <meta name="fc:frame:button:1:target" content="/opsec" />
      {/* Optional: add a second button that opens the home page */}
      <meta name="fc:frame:button:2" content="Home" />
      <meta name="fc:frame:button:2:action" content="link" />
      <meta name="fc:frame:button:2:target" content="/" />
    </>
  );
}
