export function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-white/60">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}
