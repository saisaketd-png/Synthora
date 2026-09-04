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
    <div className="group flex flex-col bg-white border border-[#E4E4E7] hover:border-[#0052CC] rounded-[8px] overflow-hidden transition-colors shadow-tactile-card">
      {/* 1. Technical Product Image */}
      <div className="relative h-48 bg-[#FAFAFA] border-b border-[#E4E4E7] flex items-center justify-center p-4">
        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase bg-[#ECFDF5] text-[#059669] border border-[rgba(5,150,105,0.2)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            {status}
          </span>
        </div>

        {/* Category Tag */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase bg-[#EFF6FF] text-[#0052CC] border border-[#BFDBFE]">
            {product.category ? product.category.replace(/_/g, " ") : "Specialty"}
          </span>
        </div>

        {resolvedImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedImageUrl}
            alt={`${product.name} chemical sample`}
            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-102"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#64748B]">
            <FlaskConical className="w-12 h-12 stroke-1 mb-1 text-[#94A3B8]" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
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
            className="font-bold text-sm sm:text-[15px] text-[#0F172A] group-hover:text-[#0052CC] transition-colors line-clamp-1 uppercase tracking-tight"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <span>CAS: <strong className="text-[#0F172A] font-semibold">{product.casNumber}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#E4E4E7] text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
              Purity
            </span>
            <strong className="text-[#059669] font-semibold text-xs mt-0.5 block">
              {product.purity || "99.0%"}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block font-mono">
              MOQ
            </span>
            <strong className="text-[#0F172A] font-semibold font-mono text-xs mt-0.5 block">
              {product.moq}
            </strong>
          </div>
        </div>

        <div className="pt-0.5 flex items-center justify-between">
          <span className="text-[11px] text-[#64748B] font-medium truncate max-w-[130px]">
            {product.supplier.name}
          </span>
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#0747A6] transition-colors"
          >
            <span>View Monograph</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
