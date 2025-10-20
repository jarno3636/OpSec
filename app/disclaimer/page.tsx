// app/disclaimer/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Disclaimer — OpSec",
  description:
    "Important information about OpSec reports, limitations, and user responsibility.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black">Disclaimer</h1>

      <p className="mt-4 text-white/80">
        OpSec provides automated, best-effort analyses of Base network tokens.
        The information is presented for educational and informational purposes
        only and does <span className="font-semibold">not</span> constitute
        investment, legal, accounting, or security advice. OpSec is{" "}
        <span className="font-semibold">not an audit</span>, code review, or
        certification of safety.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Key Risks &amp; Limitations</h2>
        <ul className="list-disc pl-6 text-white/80 space-y-2">
          <li>
            <span className="font-semibold">Automated heuristics:</span> Scores
            and findings are produced by rules and third-party data sources and
            may be incomplete, stale, or incorrect.
          </li>
          <li>
            <span className="font-semibold">No guarantee of security:</span>{" "}
            Passing checks (e.g., honeypot, ownership, liquidity) does not
            guarantee that a token is safe, valuable, or free of vulnerabilities.
          </li>
          <li>
            <span className="font-semibold">Dynamic on-chain state:</span> Token
            permissions, ownership, liquidity, tax settings, and proxies can
            change at any time, potentially invalidating a prior report.
          </li>
          <li>
            <span className="font-semibold">Third-party dependencies:</span> We
            rely on public APIs and explorers (e.g., BaseScan, GoPlus, DEX
            Screener, Honeypot). Outages or discrepancies may affect accuracy.
          </li>
          <li>
            <span className="font-semibold">No endorsements:</span> A higher
            grade or “clean” report is not an endorsement or recommendation to
            buy, sell, or hold any asset.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Do Your Own Research</h2>
        <p className="text-white/80">
          Always conduct independent research before interacting with any smart
          contract or token. At minimum, consider:
        </p>
        <ul className="list-disc pl-6 text-white/80 space-y-2">
          <li>Reading verified source code and recent commits, if available.</li>
          <li>Reviewing on-chain history, liquidity locks, and deployer wallets.</li>
          <li>Checking community reputation, communication channels, and governance.</li>
          <li>Assessing market depth, volatility, and counterparties.</li>
          <li>Testing with small amounts and using appropriate risk controls.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">No Liability</h2>
        <p className="text-white/80">
          OpSec and its contributors are not responsible for losses, damages, or
          adverse outcomes arising from the use of this app or reliance on any
          report. By using OpSec, you acknowledge that you bear sole
          responsibility for your decisions and actions.
        </p>
      </section>

      <p className="mt-10 text-sm text-white/60">
        Have feedback or found an issue?{" "}
        <Link href="/opsec" className="text-scan underline underline-offset-2">
          Analyze a token
        </Link>{" "}
        and share your findings, or contact us through your preferred channel.
      </p>
    </main>
  );
}
