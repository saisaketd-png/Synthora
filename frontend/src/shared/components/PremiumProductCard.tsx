import React from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";

export interface PremiumProduct {
  id: string;
  name: string;
  casNumber: string;
  category: string;
  purity?: string;
  stockStatus?: "In Stock" | "Low Stock" | "Made to Order";
  supplier: {
    id: string;
    name: string;
    isVerified: boolean;
    country: string;
    countryCode: string;
  };
  moq: string;
  image?: string;
}

interface PremiumProductCardProps {
  product: PremiumProduct;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function PremiumProductCard({ product }: PremiumProductCardProps) {
  const status = product.stockStatus || "In Stock";
  const resolvedImageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${API_URL}${product.image}`
    : null;

  return (
    <div className="group flex flex-col bg-white border border-[#DFE1E6] hover:border-[#0052CC] rounded-xl overflow-hidden transition-all duration-200 shadow-2xs">
      {/* 1. Large Technical Product Image (Occupies ~55-60% of visual card height) */}
      <div className="relative h-52 bg-[#FAFBFC] border-b border-[#DFE1E6] flex items-center justify-center p-4">
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00875A]" />
            {status}
          </span>
        </div>

        {/* Category Tag */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF]">
            {product.category ? product.category.replace(/_/g, " ") : "Specialty"}
          </span>
        </div>

        {resolvedImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedImageUrl}
            alt={`${product.name} chemical sample`}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#5E6C84]">
            <FlaskConical className="w-14 h-14 stroke-1 mb-1 text-[#8993A4]" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5E6C84]">
              Chemical Sample
            </span>
          </div>
        )}
      </div>

      {/* 2. Technical Metadata & Specifications */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <Link
            href={`/products/${product.id}`}
            className="font-extrabold text-sm sm:text-base text-[#091E42] group-hover:text-[#0052CC] transition-colors line-clamp-1 uppercase tracking-tight"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-[#5E6C84]">
            <span>CAS: <strong className="text-[#091E42]">{product.casNumber}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#F4F5F7] text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
              Purity
            </span>
            <strong className="text-[#091E42] font-bold text-xs mt-0.5 block">
              {product.purity || "99.0%"}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
              MOQ
            </span>
            <strong className="text-[#091E42] font-bold font-mono text-xs mt-0.5 block">
              {product.moq}
            </strong>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <span className="text-[11px] text-[#5E6C84] font-medium truncate max-w-[140px]">
            {product.supplier.name}
          </span>
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:text-[#0747A6] transition-colors"
          >
            <span>View Product</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
