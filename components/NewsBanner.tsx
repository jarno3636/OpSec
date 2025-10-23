// components/NewsBanner.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Story = {
  title: string;
  link: string;
  description?: string;
  publishedAt?: string | null;
};

export default function NewsBanner() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // decode basic HTML entities in some RSS fields
  const decode = (s: string) => {
    if (!s) return s;
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/news", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (alive && Array.isArray(j?.stories)) {
          setStories(
            j.stories.slice(0, 10).map((x: Story) => ({
              ...x,
              title: decode(x.title || ""),
              description: decode(x.description || ""),
            }))
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // dot index that respects the slide width minus gutters
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // mobile gutter total = 48px; md gutter total = 80px
        const totalGutter = window.matchMedia("(min-width: 768px)").matches ? 80 : 48;
        const slideW = el.clientWidth - totalGutter;
        const idx = Math.round((el.scrollLeft + slideW * 0.5) / slideW);
        setActive(Math.max(0, Math.min(idx, stories.length - 1)));
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [stories.length]);

  const goTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const totalGutter = window.matchMedia("(min-width: 768px)").matches ? 80 : 48;
    const slideW = el.clientWidth - totalGutter;
    const clamped = Math.max(0, Math.min(idx, stories.length - 1));
    el.scrollTo({ left: clamped * slideW, behavior: "smooth" });
  };

  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  const headerSubtitle = useMemo(() => {
    if (loading) return "Fetching latest security headlines…";
    if (!stories.length) return "No headlines right now";
    try {
      return new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [loading, stories.length]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-5 flex items-end justify-between">
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Latest Security Headlines <span className="text-scan">/ Daily</span>
          </div>
          <div className="mt-1 text-xs md:text-sm text-white/60">{headerSubtitle}</div>
        </div>

        {stories.length > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={prev}
              disabled={active === 0}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={next}
              disabled={active >= stories.length - 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40"
              aria-label="Next"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div
        ref={scrollerRef}
        className="
          hide-scrollbar
          overflow-x-auto
          scroll-smooth
          snap-x snap-mandatory
          [scroll-snap-stop:always]
          flex items-stretch
          gap-4 md:gap-6
          px-3 md:px-4
        "
        style={{
          msOverflowStyle: "none",
          // make first/last slide align with the same inner gutter
          scrollPaddingLeft: 24,
          scrollPaddingRight: 24,
        }}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar{ display:none; }`}</style>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="snap-center shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] h-40 md:h-44 animate-pulse
                         w-[calc(100%-48px)] md:w-[calc(100%-80px)]"
            />
          ))
        ) : stories.length === 0 ? (
          <div className="p-5 text-sm text-white/60">We couldn’t load headlines right now.</div>
        ) : (
          stories.map((s, i) => (
            <a
              key={`${s.link}-${i}`}
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="
                group
                snap-center
                shrink-0
                rounded-2xl border border-white/10 bg-white/[0.03]
                p-4 md:p-5
                hover:bg-white/[0.06] transition
                w-[calc(100%-48px)] md:w-[calc(100%-80px)]
              "
            >
              <div className="text-base md:text-lg font-semibold group-hover:underline truncate">
                {s.title || "Untitled"}
              </div>
              {s.description && (
                <p className="mt-2 text-sm text-white/70 line-clamp-3">
                  {s.description}
                </p>
              )}
              {s.publishedAt && (
                <div className="mt-3 text-[11px] text-white/40">
                  {new Date(s.publishedAt).toLocaleString()}
                </div>
              )}
            </a>
          ))
        )}
      </div>

      {/* Dots */}
      {stories.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === active
                  ? "bg-scan shadow-[0_0_12px_rgba(0,255,149,0.6)]"
                  : "bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
