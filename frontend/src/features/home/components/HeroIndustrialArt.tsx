import React from "react";

export function HeroIndustrialArt() {
  return (
    <div className="relative w-full h-full min-h-[380px] max-h-[460px] flex items-center justify-center select-none">
      {/* Precision Technical Specification Sheet & Monograph Scene */}
      <div className="relative w-full max-w-[480px] bg-[#0A1128] border border-slate-700/80 rounded-[8px] p-5 sm:p-6 shadow-2xl">
        
        {/* Monograph Top Annotation Strip */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Specification Monograph
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#38BDF8] bg-slate-800/80 px-2 py-0.5 rounded-[4px] border border-slate-700">
            USP / EP &middot; CAS 103-90-2
          </span>
        </div>

        {/* Chemical Identity & Nomenclature */}
        <div className="space-y-1 mb-4">
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Paracetamol Compendial Grade
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
            <span>Formula: <strong className="text-slate-200">C₈H₉NO₂</strong></span>
            <span>&middot;</span>
            <span>MW: <strong className="text-slate-200">151.16 g/mol</strong></span>
            <span>&middot;</span>
            <span className="text-[#34D399]">Assay: 99.8%</span>
          </div>
        </div>

        {/* Industrial Molecular Diagram & Technical Linework */}
        <div className="relative bg-[#0F172A] border border-slate-800 rounded-[6px] p-3.5 flex items-center justify-center mb-4">
          <svg
            className="w-full max-w-[320px] h-[130px] overflow-visible"
            viewBox="0 0 320 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hexagonal Benzene Core */}
            <polygon
              points="130,25 175,25 198,65 175,105 130,105 107,65"
              stroke="#38BDF8"
              strokeWidth="1.8"
              fill="none"
            />
            <polygon
              points="133,32 172,32 191,65 172,98 133,98 114,65"
              stroke="rgba(56,189,248,0.25)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="4 3"
            />

            {/* Phenolic Group (-OH) */}
            <line x1="107" y1="65" x2="65" y2="65" stroke="#94A3B8" strokeWidth="1.8" />
            <circle cx="50" cy="65" r="13" fill="#0A1128" stroke="#34D399" strokeWidth="1.5" />
            <text x="50" y="69" textAnchor="middle" fill="#D1FAE5" fontSize="10" fontWeight="bold" fontFamily="monospace">OH</text>

            {/* Acetamido Group (-NH-CO-CH3) */}
            <line x1="198" y1="65" x2="235" y2="65" stroke="#94A3B8" strokeWidth="1.8" />
            <circle cx="245" cy="65" r="12" fill="#0A1128" stroke="#818CF8" strokeWidth="1.5" />
            <text x="245" y="69" textAnchor="middle" fill="#EDE9FE" fontSize="9" fontWeight="bold" fontFamily="monospace">NH</text>

            <line x1="257" y1="65" x2="278" y2="48" stroke="#94A3B8" strokeWidth="1.8" />
            {/* Carbonyl Oxygen */}
            <line x1="278" y1="48" x2="278" y2="25" stroke="#F87171" strokeWidth="1.8" />
            <line x1="282" y1="48" x2="282" y2="25" stroke="#F87171" strokeWidth="1.8" />
            <circle cx="280" cy="16" r="10" fill="#0A1128" stroke="#F87171" strokeWidth="1.5" />
            <text x="280" y="20" textAnchor="middle" fill="#FEE2E2" fontSize="9" fontWeight="bold" fontFamily="monospace">O</text>

            {/* Methyl Group */}
            <line x1="278" y1="48" x2="305" y2="62" stroke="#94A3B8" strokeWidth="1.8" />
            <text x="308" y="75" fill="#E2E8F0" fontSize="9" fontWeight="bold" fontFamily="monospace">CH₃</text>
          </svg>
        </div>

        {/* Quality Assay & Analytical Ledger */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2 bg-[#0F172A] border border-slate-800 rounded-[4px]">
            <span className="text-[9px] uppercase text-slate-400 block">HPLC Assay</span>
            <span className="text-white font-bold text-xs mt-0.5 block">99.82%</span>
            <span className="text-[#34D399] text-[9px]">Spec: ≥99.0%</span>
          </div>
          <div className="p-2 bg-[#0F172A] border border-slate-800 rounded-[4px]">
            <span className="text-[9px] uppercase text-slate-400 block">Loss on Drying</span>
            <span className="text-white font-bold text-xs mt-0.5 block">0.24%</span>
            <span className="text-[#34D399] text-[9px]">Spec: ≤0.5%</span>
          </div>
          <div className="p-2 bg-[#0F172A] border border-slate-800 rounded-[4px]">
            <span className="text-[9px] uppercase text-slate-400 block">Sulfated Ash</span>
            <span className="text-white font-bold text-xs mt-0.5 block">0.03%</span>
            <span className="text-[#34D399] text-[9px]">Spec: ≤0.1%</span>
          </div>
        </div>

        {/* Technical Validation Line */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>WHO-GMP & DMF Ready</span>
          </div>
          <span className="text-[#38BDF8]">Full COA Dossier Attached</span>
        </div>

      </div>
    </div>
  );
}
