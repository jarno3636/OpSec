// components/ShieldAvatar.tsx
export default function ShieldAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-white/5 border border-white/10 p-1"
      title="OpSec"
      aria-label="OpSec"
      style={{ lineHeight: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="block"
        aria-hidden
      >
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ff95" />
            <stop offset="100%" stopColor="#44ffb7" />
          </linearGradient>
        </defs>
        <path
          d="M32 5l19 7v13c0 12.6-8.3 24.3-19 28-10.7-3.7-19-15.4-19-28V12l19-7z"
          fill="none"
          stroke="url(#sg)"
          strokeWidth="2.5"
        />
        <rect x="10" y="28" width="44" height="8" rx="4" fill="#00ff95" />
        <text
          x="32" y="34.5"
          textAnchor="middle"
          fontFamily="Inter, ui-sans-serif, system-ui"
          fontWeight="800"
          fontSize="10"
          fill="#000"
        >
          OpSec
        </text>
      </svg>
    </div>
  );
}
