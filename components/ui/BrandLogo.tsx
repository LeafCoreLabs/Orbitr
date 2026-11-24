"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  tone?: "light" | "dark";
}

export function BrandLogo({ size = "md", showWordmark = true, tone = "dark" }: BrandLogoProps) {
  const dims = {
    sm: "h-7 w-7 rounded-[10px]",
    md: "h-9 w-9 rounded-[12px]",
    lg: "h-11 w-11 rounded-[14px]",
  }[size];

  const textSize = {
    sm: "text-[15px]",
    md: "text-[17px]",
    lg: "text-[20px]",
  }[size];

  const isDarkSurface = tone === "dark";

  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap select-none">
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/40 bg-gradient-to-br from-white/25 via-slate-400/20 to-slate-700/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_6px_16px_-3px_rgba(4,6,12,0.45)] backdrop-blur-xl ${dims}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="relative z-10 h-[58%] w-[58%] text-white"
          aria-hidden="true"
        >
          <path
            d="M7.5 17.5h9.25a3.75 3.75 0 0 0 .54-7.46A5.25 5.25 0 0 0 7.1 8.6a4.25 4.25 0 0 0 .4 8.9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.18)"
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
          className={`inline-flex items-center whitespace-nowrap font-display font-bold tracking-[-0.035em] ${
            isDarkSurface ? "optical-text-shadow text-white" : "text-zinc-900"
          } ${textSize}`}
        >
          Orbitr
          <span
            className={`ml-1.5 inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-normal whitespace-nowrap backdrop-blur-md ${
              isDarkSurface
                ? "border-white/30 bg-white/10 text-slate-200"
                : "border-slate-300 bg-slate-100 text-slate-700"
            }`}
          >
            Cloud+
          </span>
        </span>
      )}
    </span>
  );
}
