// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-10">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
        <div className="text-center sm:text-left">
          © {new Date().getFullYear()} OpSec. Built for Base.
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/disclaimer"
            className="hover:text-white underline underline-offset-2"
          >
            Disclaimer
          </Link>
          {/* Add more links later if needed */}
          {/* <Link href="/privacy" className="hover:text-white underline underline-offset-2">Privacy</Link> */}
          {/* <a href="https://github.com/yourrepo" target="_blank" className="hover:text-white underline underline-offset-2">GitHub</a> */}
        </nav>
      </div>
    </footer>
  );
}
