export default function AgencyChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(0,255,149,0.06),transparent_60%)]">
      <div className="fixed inset-0 pointer-events-none opacity-20 [background:repeating-linear-gradient(0deg,rgba(0,255,149,0.06),rgba(0,255,149,0.06)_1px,transparent_1px,transparent_15px)]" />
      <div className="mx-auto max-w-3xl p-6">{children}</div>
    </div>
  );
}
