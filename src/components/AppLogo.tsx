type AppLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function AppLogo({
  size = 48,
  showWordmark = false,
  className = "",
}: AppLogoProps) {
  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className="shrink-0 drop-shadow-[0_8px_24px_rgba(124,92,255,0.35)]"
      aria-hidden={showWordmark}
      role={showWordmark ? undefined : "img"}
      aria-label={showWordmark ? undefined : "English Reader"}
    >
      <defs>
        <linearGradient
          id="logo-bg"
          x1="15"
          y1="10"
          x2="105"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7c5cff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient
          id="logo-wave"
          x1="52"
          y1="38"
          x2="98"
          y2="82"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#logo-bg)" />
      <path
        fill="#f8fafc"
        fillOpacity="0.95"
        d="M28 28h30c4.4 0 8 3.6 8 8v49c0-3.6-3.2-6.4-7.2-5.6L28 72V28z"
      />
      <path
        fill="#e2e8f0"
        fillOpacity="0.5"
        d="M70 28h30c4.4 0 8 3.6 8 8v46l-38 10V36c0-4.4 3.6-8 8-8z"
      />
      <path
        stroke="url(#logo-wave)"
        strokeWidth="5"
        strokeLinecap="round"
        d="M52 48v22M62 42v34M72 48v22M82 38v38"
      />
    </svg>
  );

  if (!showWordmark) {
    return <span className={className}>{icon}</span>;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon}
      <div className="min-w-0">
        <p className="header-title text-2xl font-bold leading-tight sm:text-3xl">
          ENGLISH READER
        </p>
        <p className="text-xs text-[var(--color-muted)] sm:text-sm">
          Learn with rhythm
        </p>
      </div>
    </div>
  );
}
