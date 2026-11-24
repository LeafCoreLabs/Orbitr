import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
  lightModeText?: boolean;
}

export function Logo({
  className,
  iconOnly = false,
  href = "/",
  size = "md",
}: LogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl sm:text-4xl",
  };

  const Content = (
    <div
      className={cn(
        "inline-flex items-center select-none font-extrabold tracking-tight group transition-transform duration-200 hover:scale-[1.02]",
        textSizes[size],
        className
      )}
    >
      {/* "Or" in Subtle Slate Indigo / Lavender Gradient */}
      <span className="bg-gradient-to-r from-[#c7d2fe] via-[#818cf8] to-[#6366f1] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(129,140,248,0.4)]">
        Or
      </span>

      {/* "bitr" in Crisp Pure Ice White */}
      {!iconOnly && (
        <span className="text-white drop-shadow-sm transition-colors group-hover:text-slate-100">
          bitr
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95">
        {Content}
      </Link>
    );
  }

  return Content;
}
