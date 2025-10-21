// components/SocialLinks.tsx
"use client";

import * as React from "react";

type Props = {
  links?: string[]; // absolute URLs
  className?: string;
};

function iconFor(url: string) {
  const u = url.toLowerCase();
  if (u.includes("x.com") || u.includes("twitter.com")) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
        <path fill="currentColor" d="M18.244 2H21l-6.53 7.46L22 22h-6.78l-4.8-5.88L4.8 22H2l7.1-8.1L2 2h6.78l4.38 5.36L18.244 2zm-1.186 18h1.83L7.08 4H5.25l11.808 16z"/>
      </svg>
    );
  }
  if (u.includes("t.me") || u.includes("telegram.me") || u.includes("telegram.org")) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
        <path fill="currentColor" d="M9.03 15.5l-.38 4.02c.55 0 .79-.24 1.08-.53l2.6-2.5 5.39 3.95c.99.55 1.69.26 1.95-.92l3.54-16.6v0c.31-1.45-.52-2.02-1.48-1.67L1.17 9.1C-.24 9.65-.21 10.47.94 10.83l6.06 1.89L19.99 5.3c.56-.37 1.06-.17.65.2"/>
      </svg>
    );
  }
  if (u.includes("github.com")) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
        <path fill="currentColor" d="M12 .5a12 12 0 00-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.82 2.8 1.3 3.48.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.13-.3-.53-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.64.25 2.86.12 3.16.76.84 1.23 1.9 1.23 3.22 0 4.61-2.81 5.63-5.49 5.93.43.38.81 1.12.81 2.26v3.35c0 .32.21.7.82.58A12 12 0 0012 .5z"/>
      </svg>
    );
  }
  // default globe
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
      <path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20m1 17.93V19h-2v.93A8 8 0 014 12h.93v-2H4A8 8 0 0111 4.07V5h2V4.07A8 8 0 0120 10h-.93v2H20a8 8 0 01-7 7.93z"/>
    </svg>
  );
}

function labelFor(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("twitter.com") || host.includes("x.com")) return "Twitter/X";
    if (host.includes("t.me") || host.includes("telegram")) return "Telegram";
    if (host.includes("github.com")) return "GitHub";
    return host;
  } catch {
    return url;
  }
}

export default function SocialLinks({ links = [], className = "" }: Props) {
  if (!links.length) return null;

  return (
    <div className={className}>
      <h3 className="font-semibold mb-2">Socials</h3>
      <ul className="flex flex-wrap gap-2">
        {links.map((href) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm"
            >
              {iconFor(href)}
              <span className="text-sky-300 hover:underline">{labelFor(href)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
