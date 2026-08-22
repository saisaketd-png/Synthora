"use client";

import React from "react";
import Link from "next/link";

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
  const isDark = variant === "dark";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Core Navy/Cobalt Gradient */}
        <linearGradient id="synthora-hex-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isDark ? "#38BDF8" : "#0A2540"} />
          <stop offset="50%" stopColor={isDark ? "#2563EB" : "#0052CC"} />
          <stop offset="100%" stopColor={isDark ? "#1D4ED8" : "#1E40AF"} />
        </linearGradient>

        {/* Dynamic Synthesis Cyan/Emerald Gradient */}
        <linearGradient id="synthora-chem-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F5D4" />
          <stop offset="60%" stopColor="#00BB9C" />
          <stop offset="100%" stopColor="#00875A" />
        </linearGradient>

        {/* Central Core Gradient */}
        <radialGradient id="synthora-core-glow" cx="24" cy="24" r="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#00F5D4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0052CC" stopOpacity="0" />
        </radialGradient>

        {/* Subtle drop shadow */}
        <filter id="synthora-shadow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0A2540" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Outer Hexagonal Benzene Ring */}
      <path
        d="M24 3.5L42 13.8923V34.1077L24 44.5L6 34.1077V13.8923L24 3.5Z"
        fill="url(#synthora-hex-grad)"
        filter="url(#synthora-shadow)"
      />

      {/* Inner Inscribed Molecular Geometry */}
      <path
        d="M24 7.5L38.5 15.8715V32.1285L24 40.5L9.5 32.1285V15.8715L24 7.5Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeOpacity={isDark ? "0.3" : "0.25"}
        fill="none"
      />

      {/* Tripartite Chiral Synthesis Bonds */}
      {/* Node 1: Top to Center */}
      <path
        d="M24 7.5V24L38.5 32.1285"
        stroke="url(#synthora-chem-grad)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Node 2: Center to Left */}
      <path
        d="M24 24L9.5 32.1285"
        stroke="url(#synthora-chem-grad)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Chemical Molecular Nodes (Atoms) */}
      <circle cx="24" cy="7.5" r="2.5" fill="#00F5D4" />
      <circle cx="38.5" cy="32.1285" r="2.5" fill="#00F5D4" />
      <circle cx="9.5" cy="32.1285" r="2.5" fill="#00F5D4" />

      {/* Active Synthesis Core Node */}
      <circle cx="24" cy="24" r="5" fill="url(#synthora-core-glow)" />
      <circle cx="24" cy="24" r="2.75" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="1.5" fill="#0052CC" />
    </svg>
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
  const sizeMap = {
    sm: { icon: "w-6 h-6", text: "text-sm", sub: "text-[9px]" },
    md: { icon: "w-8 h-8", text: "text-[17px]", sub: "text-[10px]" },
    lg: { icon: "w-10 h-10", text: "text-xl", sub: "text-xs" },
    xl: { icon: "w-12 h-12", text: "text-2xl", sub: "text-xs" },
  };

  const isDark = variant === "dark";
  const { icon, text, sub } = sizeMap[size];

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 group select-none ${className}`}
      onClick={onClick}
    >
      {/* Chemical Molecular Hexagon Mark */}
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <SynthoraLogoMark className={icon} variant={variant} />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${text} ${
                isDark ? "text-white" : "text-[#091E42]"
              } transition-colors group-hover:text-[#0052CC]`}
              style={{ letterSpacing: "-0.02em" }}
            >
              SYNTHORA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00BB9C] mb-0.5" />
          </div>

          <span
            className={`font-bold tracking-wider uppercase ${sub} ${
              isDark ? "text-slate-400" : "text-[#5E6C84]"
            } mt-0.5`}
            style={{ letterSpacing: "0.06em" }}
          >
            {subtitle || "B2B Chemical Marketplace"}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
