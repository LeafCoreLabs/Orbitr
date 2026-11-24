interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export function BrandLogo({ size = 'md', showWordmark = true }: BrandLogoProps) {
  const dims = {
    sm: 'h-7 w-7 rounded-[10px]',
    md: 'h-9 w-9 rounded-[12px]',
    lg: 'h-11 w-11 rounded-[14px]',
  }[size];

  const textSize = {
    sm: 'text-[15px]',
    md: 'text-[17px]',
    lg: 'text-[20px]',
  }[size];

  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap select-none">
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/65 bg-gradient-to-br from-cyan-400/45 via-indigo-500/45 to-purple-600/55 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_6px_20px_-3px_rgba(99,102,241,0.55)] backdrop-blur-xl ${dims}`}
      >
        <span className="pointer-events-none absolute -top-2 -left-2 h-5 w-5 rounded-full bg-cyan-300/65 blur-sm" />
        <span className="pointer-events-none absolute -right-2 -bottom-2 h-5 w-5 rounded-full bg-purple-400/65 blur-sm" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="relative z-10 h-[60%] w-[60%] text-white drop-shadow-[0_1px_4px_rgba(15,10,48,0.4)]"
          aria-hidden="true"
        >
          <path
            d="M7.5 17.5h9.25a3.75 3.75 0 0 0 .54-7.46A5.25 5.25 0 0 0 7.1 8.6a4.25 4.25 0 0 0 .4 8.9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.28)"
          />
          <path
            d="M9.5 13.5 12 11l2.5 2.5"
            stroke="#FFFFFF"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={`optical-text-shadow inline-flex items-center whitespace-nowrap font-display font-bold tracking-[-0.035em] text-white ${textSize}`}
        >
          Aether
          <span className="ml-1.5 inline-flex shrink-0 items-center rounded-full border border-cyan-300/55 bg-gradient-to-r from-cyan-400/25 to-violet-500/30 px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-normal whitespace-nowrap text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md">
            Cloud+
          </span>
        </span>
      )}
    </span>
  );
}
