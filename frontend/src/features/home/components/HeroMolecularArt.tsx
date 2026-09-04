import React from "react";

export function HeroMolecularArt() {
  return (
    <div className="relative w-full h-[440px] lg:h-[480px] flex items-center justify-center select-none pointer-events-none">
      {/* 1. Subtle radial light bloom behind structure */}
      <div className="absolute w-72 h-72 rounded-full bg-[#0052CC]/15 blur-3xl pointer-events-none -top-10 -right-10" />
      <div className="absolute w-64 h-64 rounded-full bg-[#059669]/10 blur-3xl pointer-events-none -bottom-10 -left-10" />

      {/* 2. Precision SVG Molecular & Lattice Architecture */}
      <svg
        className="w-full h-full max-w-[500px] overflow-visible drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        viewBox="0 0 500 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bondGrad1" x1="120" y1="180" x2="250" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="1" stopColor="#38BDF8" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="bondGrad2" x1="250" y1="100" x2="380" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#818CF8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="bondGrad3" x1="250" y1="100" x2="250" y2="250" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="1" stopColor="#34D399" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="bondGrad4" x1="250" y1="250" x2="140" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" stopOpacity="0.8" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="bondGrad5" x1="250" y1="250" x2="370" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" stopOpacity="0.8" />
            <stop offset="1" stopColor="#818CF8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="ringGrad" x1="200" y1="180" x2="300" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" stopOpacity="0.15" />
            <stop offset="1" stopColor="#34D399" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Central Hexagonal Delocalized Ring Core */}
        <polygon
          points="250,130 330,175 330,265 250,310 170,265 170,175"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth="1.5"
          fill="url(#ringGrad)"
          strokeDasharray="4 4"
        />

        {/* Outer Hexagonal Resonant Ring */}
        <polygon
          points="250,100 370,170 370,310 250,380 130,310 130,170"
          stroke="rgba(96, 165, 250, 0.4)"
          strokeWidth="2"
          fill="none"
        />

        {/* High-purity Double Bond Annotations */}
        <line x1="245" y1="110" x2="355" y2="175" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" />
        <line x1="360" y1="180" x2="360" y2="300" stroke="rgba(129, 140, 248, 0.5)" strokeWidth="1.5" strokeDasharray="6 3" />
        <line x1="140" y1="180" x2="140" y2="300" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1.5" />

        {/* External Molecular Coordination Strands */}
        <line x1="250" y1="100" x2="250" y2="30" stroke="url(#bondGrad1)" strokeWidth="2" />
        <line x1="370" y1="170" x2="450" y2="125" stroke="url(#bondGrad2)" strokeWidth="2" />
        <line x1="370" y1="310" x2="450" y2="355" stroke="url(#bondGrad5)" strokeWidth="2" />
        <line x1="250" y1="380" x2="250" y2="440" stroke="url(#bondGrad4)" strokeWidth="2" />
        <line x1="130" y1="310" x2="50" y2="355" stroke="url(#bondGrad4)" strokeWidth="2" />
        <line x1="130" y1="170" x2="50" y2="125" stroke="url(#bondGrad1)" strokeWidth="2" />

        {/* Coordinating Ligand Bonds (Subtle dashed technical lines) */}
        <line x1="250" y1="30" x2="340" y2="15" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="450" y1="125" x2="480" y2="200" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="450" y1="355" x2="420" y2="420" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="50" y1="355" x2="80" y2="420" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="50" y1="125" x2="20" y2="200" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Primary Molecular Nodes (Atoms) */}
        {/* Top Node (Carbon/Oxygen) */}
        <circle cx="250" cy="30" r="14" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
        <text x="250" y="34" textAnchor="middle" fill="#E0F2FE" fontSize="11" fontWeight="bold" fontFamily="monospace">O</text>

        {/* Top-Right Secondary Node */}
        <circle cx="450" cy="125" r="13" fill="#0F172A" stroke="#818CF8" strokeWidth="2" />
        <text x="450" y="129" textAnchor="middle" fill="#EDE9FE" fontSize="10" fontWeight="bold" fontFamily="monospace">N</text>

        {/* Bottom-Right Functional Group */}
        <circle cx="450" cy="355" r="14" fill="#0F172A" stroke="#34D399" strokeWidth="2" />
        <text x="450" y="359" textAnchor="middle" fill="#D1FAE5" fontSize="10" fontWeight="bold" fontFamily="monospace">OH</text>

        {/* Bottom Node */}
        <circle cx="250" cy="440" r="13" fill="#0F172A" stroke="#60A5FA" strokeWidth="2" />
        <text x="250" y="444" textAnchor="middle" fill="#DBEAFE" fontSize="10" fontWeight="bold" fontFamily="monospace">Cl</text>

        {/* Bottom-Left Functional Group */}
        <circle cx="50" cy="355" r="14" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
        <text x="50" y="359" textAnchor="middle" fill="#FEF3C7" fontSize="10" fontWeight="bold" fontFamily="monospace">NH₂</text>

        {/* Top-Left Secondary Node */}
        <circle cx="50" cy="125" r="13" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
        <text x="50" y="129" textAnchor="middle" fill="#E0F2FE" fontSize="10" fontWeight="bold" fontFamily="monospace">CH₃</text>

        {/* Ring Vertices (Conjugated Carbon Centers) */}
        <circle cx="250" cy="100" r="6" fill="#38BDF8" />
        <circle cx="370" cy="170" r="6" fill="#818CF8" />
        <circle cx="370" cy="310" r="6" fill="#34D399" />
        <circle cx="250" cy="380" r="6" fill="#60A5FA" />
        <circle cx="130" cy="310" r="6" fill="#F59E0B" />
        <circle cx="130" cy="170" r="6" fill="#38BDF8" />

        {/* Center Delocalization Hub */}
        <circle cx="250" cy="220" r="18" fill="#1E293B" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1.5" />
        <circle cx="250" cy="220" r="4" fill="#34D399" />
      </svg>

      {/* 3. Overlay Technical Monograph Pill - Floating Data Fragment 1 (Top Right) */}
      <div className="absolute top-6 right-2 sm:right-6 bg-[#0F172A]/90 border border-slate-700/80 backdrop-blur-md rounded-[6px] px-3 py-2 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#059669]" />
          <span className="text-[10px] font-mono text-slate-300 font-semibold uppercase tracking-wider">
            GMP Grade Active
          </span>
        </div>
        <div className="text-xs font-semibold text-white mt-1">
          Paracetamol API
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-cyan-400">
          <span>CAS 103-90-2</span>
          <span>&middot;</span>
          <span className="text-slate-400">Purity ≥ 99.8%</span>
        </div>
      </div>

      {/* 4. Overlay Technical Monograph Pill - Floating Data Fragment 2 (Bottom Left) */}
      <div className="absolute bottom-6 left-2 sm:left-6 bg-[#0F172A]/90 border border-slate-700/80 backdrop-blur-md rounded-[6px] px-3 py-2 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-semibold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Batch COA Verified</span>
        </div>
        <div className="text-xs font-semibold text-white mt-0.5">
          Acetic Acid Glacial
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
          CAS 64-19-7 &middot; Assay 99.85%
        </div>
      </div>
    </div>
  );
}
