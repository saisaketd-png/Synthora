import React from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";

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
    countryCode: string; // ISO 2-letter code for flag
  };
  moq: string;
  image?: string;
}

interface PremiumProductCardProps {
  product: PremiumProduct;
}

export function PremiumProductCard({ product }: PremiumProductCardProps) {
  // Determine badge colors based on stock status
  const status = product.stockStatus || "In Stock";
  let badgeClasses = "bg-teal-50 text-teal-600";
  if (status === "Low Stock") badgeClasses = "bg-orange-50 text-orange-600";
  if (status === "Made to Order") badgeClasses = "bg-indigo-50 text-indigo-600";

  return (
    <div className="group relative flex flex-col bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 rounded-[2rem] p-3 transition-all duration-300">
      <Link href={`/products/${product.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>
      
      {/* Thumbnail area with badge */}
      <div className="relative h-48 bg-slate-50/80 rounded-3xl flex items-center justify-center p-4 mb-4 group-hover:bg-slate-100/80 transition-colors">
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${badgeClasses}`}>
          {status}
        </div>
        {product.image ? (
          <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <FlaskConical className="w-16 h-16 text-slate-200" strokeWidth={1.5} />
        )}
      </div>
      
      {/* Content area */}
      <div className="flex-1 flex flex-col px-3 pb-3">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {product.name}
          </h3>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md uppercase shrink-0 mt-0.5">
            {product.supplier.countryCode}
          </span>
        </div>
        
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">CAS</span>
            <span className="font-medium text-slate-800 font-mono">{product.casNumber}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">Purity</span>
            <span className="font-bold text-teal-500">{product.purity || "99.0%"}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500">MOQ</span>
            <span className="font-medium text-slate-800">{product.moq}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
