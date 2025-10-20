// components/Logo.tsx
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="drop-shadow-[0_0_18px_rgba(0,255,149,0.35)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ff95" />
            <stop offset="100%" stopColor="#8affcb" />
          </linearGradient>
        </defs>
        <path
          d="M32 4l20 8v14c0 13.5-8.9 25.9-20 30-11.1-4.1-20-16.5-20-30V12l20-8z"
          fill="none"
          stroke="url(#g)"
          strokeWidth="2.5"
        />
        <path
          d="M16 26h32M16 34h32M16 42h18"
          stroke="#00ff95"
          strokeOpacity=".85"
          strokeWidth="2"
        />
      </svg>
      <span className="text-xl font-black tracking-wide">
        <span className="text-white">OP</span>
        <span className="text-scan">SEC</span>
      </span>
    </div>
  );
}
