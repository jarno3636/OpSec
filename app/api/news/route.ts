// app/api/news/route.ts
import { NextResponse } from "next/server";

// Serve cached data for 12h (server memory) and also hint CDN
const TTL_MS = 12 * 60 * 60 * 1000;

type Story = {
  title: string;
  link: string;
  description?: string;
  publishedAt?: string | null;
};

let cached: { stories: Story[]; updatedAt: number } | null = null;

export const dynamic = "force-dynamic";

// You can tweak/trim sources – order matters (earlier ones get priority)
const SOURCES = [
  { key: "rekt", url: "https://rekt.news/index.xml" },
  { key: "rekt-en", url: "https://rekt.news/en/index.xml" },
  { key: "defillama-wars", url: "https://rsshub.app/defillama/wars" },
  { key: "coindesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { key: "theblock", url: "https://www.theblock.co/rss" },
];

function stripHtml(input: string) {
  return input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim();
}

function firstOr<T = string>(m: RegExpMatchArray | null, def = ""): string {
  return (m?.[1] ?? def).toString().trim();
}

function parseItemsFromXml(xml: string, max = 6): Story[] {
  // RSS 2.0: <item>…</item>
  const rssItems = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).slice(0, max);
  if (rssItems.length) {
    return rssItems.map((m) => {
      const it = m[1] || "";
      const title = firstOr(/<title>([\s\S]*?)<\/title>/i.exec(it));
      const link = firstOr(/<link>([\s\S]*?)<\/link>/i.exec(it));
      const desc =
        firstOr(/<description>([\s\S]*?)<\/description>/i.exec(it)) ||
        firstOr(/<content:encoded>([\s\S]*?)<\/content:encoded>/i.exec(it));
      const pub =
        firstOr(/<pubDate>([\s\S]*?)<\/pubDate>/i.exec(it)) ||
        firstOr(/<updated>([\s\S]*?)<\/updated>/i.exec(it));
      return {
        title: stripHtml(title),
        link,
        description: stripHtml(desc).slice(0, 240),
        publishedAt: pub ? new Date(pub).toISOString() : null,
      };
    });
  }

  // Atom: <entry>…</entry>
  const atomEntries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)).slice(0, max);
  return atomEntries.map((m) => {
    const it = m[1] || "";
    const title = firstOr(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(it));
    // Atom links often appear as <link href="..." />
    const linkTag = /<link[^>]*href="([^"]+)"[^>]*\/?>/i.exec(it);
    const link = firstOr(linkTag);
    const desc =
      firstOr(/<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(it)) ||
      firstOr(/<content[^>]*>([\s\S]*?)<\/content>/i.exec(it));
    const pub =
      firstOr(/<updated>([\s\S]*?)<\/updated>/i.exec(it)) ||
      firstOr(/<published>([\s\S]*?)<\/published>/i.exec(it));
    return {
      title: stripHtml(title),
      link,
      description: stripHtml(desc).slice(0, 240),
      publishedAt: pub ? new Date(pub).toISOString() : null,
    };
  });
}

async function fetchWithTimeout(url: string, ms = 8000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, {
      signal: c.signal,
      headers: {
        // Some feeds are picky; give a friendly UA
        "user-agent": "OpSecNewsBot/1.0 (+https://opsec-mini.vercel.app)",
        accept: "application/rss+xml, application/atom+xml, text/xml, */*",
      },
      // Let Next/cache reuse for 12h; we also keep our own memory cache
      next: { revalidate: 60 * 60 * 12 },
    });
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  // Serve warm cache if fresh
  const now = Date.now();
  if (cached && now - cached.updatedAt < TTL_MS && cached.stories.length) {
    return NextResponse.json(
      { updatedAt: new Date(cached.updatedAt).toISOString(), stories: cached.stories },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } }
    );
  }

  // Rebuild cache
  const settled = await Promise.allSettled(
    SOURCES.map(async (s) => {
      const r = await fetchWithTimeout(s.url);
      if (!r.ok) throw new Error(`${s.key} ${r.status}`);
      const xml = await r.text();
      const items = parseItemsFromXml(xml, 6);
      return items;
    })
  );

  const stories = settled
    .flatMap((res) => (res.status === "fulfilled" ? res.value : []))
    .filter((x) => x.link && x.title)
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 10);

  // If nothing came back but we had an old cache, keep serving it
  if (!stories.length && cached?.stories?.length) {
    return NextResponse.json(
      { updatedAt: new Date(cached.updatedAt).toISOString(), stories: cached.stories },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } }
    );
  }

  cached = { stories, updatedAt: now };

  return NextResponse.json(
    { updatedAt: new Date(now).toISOString(), stories },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } }
  );
}
