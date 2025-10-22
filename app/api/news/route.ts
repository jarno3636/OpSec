// app/api/news/route.ts
import { NextResponse } from "next/server";

/** Add/curate your feeds here (ordered by priority). */
const FEEDS = [
  // Security firms / incident alerts
  "https://blog.certik.com/rss.xml",
  "https://blog.peckshield.com/rss.xml",
  "https://slowmist.medium.com/feed",
  "https://rekt.news/index.xml",
  // General crypto news (fast breaking)
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cointelegraph.com/rss",
  "https://www.theblock.co/rss",
];

/** Very small RSS parser (title/link/date) — robust enough for most feeds. */
function parseRss(xml: string) {
  const items: { title: string; link: string; pubDate?: string }[] = [];
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1); // drop header
  for (const block of itemBlocks) {
    const title = (block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
      .trim();
    const link =
      block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ||
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim() ||
      "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

export const revalidate = 0; // handled with Cache-Control below

export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (url) => {
        const r = await fetch(url, { next: { revalidate: 86400 } }); // let edge cache handle day refresh
        const txt = await r.text();
        return parseRss(txt).slice(0, 6); // keep each feed short
      })
    );

    const merged = results
      .flatMap((res) => (res.status === "fulfilled" ? res.value : []))
      // naive de-dup by link
      .filter(
        (item, i, arr) =>
          item.link && arr.findIndex((x) => x.link === item.link) === i
      )
      // sort by pubDate desc where possible
      .sort((a, b) => {
        const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
        const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
        return tb - ta;
      })
      .slice(0, 18); // final cap

    return new NextResponse(JSON.stringify({ items: merged, fetchedAt: new Date().toISOString() }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        // cache at the edge for a day; clients get fresh if older than a day
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || "news_failed" }, { status: 200 });
  }
}
