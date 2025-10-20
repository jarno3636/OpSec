// components/NavBar.tsx
"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ShieldAvatar from "@/components/ShieldAvatar";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

// Enumerate known routes so typedRoutes stays happy
type MainRoute = "/" | "/opsec" | "/disclaimer";

const NAV_ROUTES: Array<{ href: MainRoute; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/opsec", label: "Open OpSec" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const link = (href: MainRoute, label: string, onClick?: () => void) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        className={clsx(
          "px-3 py-2 rounded-lg text-sm font-medium transition",
          active
            ? "text-black bg-scan"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
        onClick={onClick}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="sticky top-0 z-40">
      <div className="backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/70 border-b border-white/10">
        {/* Centered container */}
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-90">
              <Logo />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2">
              {NAV_ROUTES.map((r) => link(r.href, r.label))}
            </nav>

            {/* Right-side avatar + hamburger */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <ShieldAvatar />
              </div>
              <button
                className="md:hidden inline-flex items-center justify-center rounded-lg border border-white/15 p-2 hover:bg-white/10"
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
              >
                {/* menu sandwich icon */}
                <div className="space-y-1.5">
                  <span className="block h-0.5 w-5 bg-white" />
                  <span className="block h-0.5 w-5 bg-white" />
                  <span className="block h-0.5 w-5 bg-white" />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile panel */}
          {open && (
            <div className="md:hidden mt-3 border border-white/10 rounded-xl bg-black/70">
              <div className="flex flex-col p-2">
                {NAV_ROUTES.map((r) =>
                  link(r.href, r.label, () => setOpen(false))
                )}
                <div className="p-2">
                  <ShieldAvatar />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
