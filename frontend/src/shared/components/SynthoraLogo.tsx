"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SynthoraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "monochrome";
  showWordmark?: boolean;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}

export function SynthoraLogoMark({
  className = "w-8 h-8",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark" | "monochrome";
}) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden ${className}`}>
      <Image
        src="/kemkendra-icon.png"
        alt="Kemkendra Icon"
        width={80}
        height={80}
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
  showWordmark = true,
  subtitle,
  href,
  onClick,
}: SynthoraLogoProps) {
  const heightClasses = {
    sm: "h-8",
    md: "h-11",
    lg: "h-14",
    xl: "h-20",
  };

  const imageDimensions = {
    sm: { width: 120, height: 32 },
    md: { width: 160, height: 44 },
    lg: { width: 200, height: 56 },
    xl: { width: 280, height: 80 },
  };

  const currentHeightClass = heightClasses[size] || heightClasses.md;
  const { width, height } = imageDimensions[size] || imageDimensions.md;

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 group select-none ${className}`}
      onClick={onClick}
    >
      <div className={`relative ${currentHeightClass} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
        <Image
          src="/kemkendra-logo.png"
          alt="KEMKENDRA Chemical Trading Marketplace"
          width={width}
          height={height}
          className="h-full w-auto object-contain"
          priority
        />
      </div>

      {subtitle && (
        <div className="flex flex-col justify-center border-l border-slate-200 dark:border-slate-700 pl-2.5 ml-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
