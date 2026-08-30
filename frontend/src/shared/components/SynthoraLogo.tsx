"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface KemkendraLogoProps extends SynthoraLogoProps {}
export type SynthoraLogoProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "monochrome";
  layout?: "horizontal" | "stacked" | "auto";
  showWordmark?: boolean;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
};

export const KemkendraLogoMark = SynthoraLogoMark;
export const KemkendraLogo = SynthoraLogo;

export function SynthoraLogoMark({
  className = "w-9 h-9",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark" | "monochrome";
}) {
  const isDark = variant === "dark";
  const iconSrc = isDark ? "/kemkendra-icon-dark.png" : "/kemkendra-icon.png";

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
      <Image
        src={iconSrc}
        alt="Kemkendra Icon"
        width={128}
        height={128}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}

export function SynthoraLogo({
  className = "",
  size = "md",
  variant = "light",
  layout = "horizontal",
  showWordmark = true,
  subtitle,
  href,
  onClick,
}: SynthoraLogoProps) {
  const isDark = variant === "dark";

  // Height configurations optimized for crisp display in all navbars and cards
  const heightClasses = {
    xs: "h-7",
    sm: "h-8 sm:h-9",
    md: "h-9 sm:h-11",
    lg: "h-12 sm:h-14",
    xl: "h-16 sm:h-20",
  };

  const imageDimensions = {
    xs: { width: 140, height: 28 },
    sm: { width: 180, height: 36 },
    md: { width: 220, height: 44 },
    lg: { width: 260, height: 52 },
    xl: { width: 340, height: 72 },
  };

  const currentHeightClass = heightClasses[size] || heightClasses.md;
  const { width, height } = imageDimensions[size] || imageDimensions.md;

  // Select appropriate source asset (horizontal is preferred in navbars, stacked in heroes/cards)
  const isHorizontal = layout === "horizontal" || (layout === "auto" && showWordmark);
  const logoSrc = isDark
    ? isHorizontal
      ? "/kemkendra-logo-horizontal-dark.png"
      : "/kemkendra-logo-dark.png"
    : isHorizontal
    ? "/kemkendra-logo-horizontal.png"
    : "/kemkendra-logo.png";

  const content = (
    <div
      className={`inline-flex items-center gap-2 group select-none ${className}`}
      onClick={onClick}
    >
      <div className={`relative ${currentHeightClass} flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]`}>
        <Image
          src={logoSrc}
          alt="KEMKENDRA Chemical Trading Marketplace"
          width={width}
          height={height}
          className="h-full w-auto object-contain"
          priority
        />
      </div>

      {subtitle && (
        <div className={`hidden sm:flex flex-col justify-center border-l ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"} pl-2 ml-0.5`}>
          <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
