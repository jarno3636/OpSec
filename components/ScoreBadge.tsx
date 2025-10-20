// components/ScoreBadge.tsx
export default function ScoreBadge({ grade }: { grade: "A" | "B" | "C" | "D" | "F" }) {
  const styles: Record<string, string> = {
    A: "from-green-400 to-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]",
    B: "from-lime-400 to-green-600 text-white shadow-[0_0_12px_rgba(132,204,22,0.5)]",
    C: "from-yellow-400 to-amber-500 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]",
    D: "from-orange-400 to-amber-600 text-black shadow-[0_0_10px_rgba(251,146,60,0.5)]",
    F: "from-red-500 to-rose-700 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]",
  };

  return (
    <div
      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl font-black text-3xl bg-gradient-to-br ${styles[grade]} backdrop-blur-md border border-white/10 transition-transform duration-300 hover:scale-105`}
      title={`Grade ${grade}`}
    >
      {grade}
    </div>
  );
}
