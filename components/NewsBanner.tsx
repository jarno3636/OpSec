// components/NewsBanner.tsx
"use client";

import * as React from "react";

type NewsItem = { title: string; link: string; pubDate?: string };
type ApiRes = { items: NewsItem[]; fetchedAt?: string };

export default function NewsBanner() {
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [ts, setTs] = React.useState<string | undefined>();
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/news", { cache: "no-store" });
        const j = (await r.json()) as ApiRes;
        if (!alive) return;
        setItems(Array.isArray(j.items) ? j.items : []);
        setTs(j.fetchedAt);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load news.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    // Fail silent on home — you can show a tiny note if you want
    return null;
  }
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 overflow-hidden">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="text-sm font-semibold tracking-wide text-white/80">
          Latest Security Headlines
        </div>
        {ts && (
          <div className="text-[11px] text-white/50">
            Updated {new Date(ts).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Horizontal scroller */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 pr-1">
        {items.map((it, i) => (
          <a
            key={`${it.link}-${i}`}
            href={it.link}
            target="_blank"
            rel="noreferrer"
            className="min-w-[260px] max-w-[320px] shrink-0 rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 transition p-3"
            title={it.title}
          >
            <div className="text-[11px] text-sky-300 mb-1">
              {it.pubDate ? new Date(it.pubDate).toLocaleDateString() : "—"}
            </div>
            <div className="text-sm text-white/90 line-clamp-3">{it.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
