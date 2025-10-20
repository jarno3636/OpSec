// components/NavBar.tsx
"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ShieldAvatar from "@/components/ShieldAvatar";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Enumerate known routes so Next's typedRoutes is happy
type MainRoute = "/" | "/opsec" | "/disclaimer";

export default function NavBar() {
  const pathname = usePathname();

  const link = (href: MainRoute, label: string) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={clsx(
          "px-3 py-2 rounded-lg text-sm font-medium transition",
          active
            ? "text-black bg-scan"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="sticky top-0 z-40">
      <div className="backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/70 border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            {link("/", "Home")}
            {link("/opsec", "Open OpSec")}
            {link("/disclaimer", "Disclaimer")}
          </nav>
          <div className="ml-3">
            <ShieldAvatar />
          </div>
        </div>
      </div>
    </div>
  );
}
