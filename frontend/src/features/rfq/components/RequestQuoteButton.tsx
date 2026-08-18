"use client";

import React, { useState } from "react";
import { FileCheck } from "lucide-react";
import RfqModal from "./RfqModal";

export type RequestQuoteButtonProps = {
  productId: string;
  productName: string;
  supplierId: number;
  supplierName: string;
  supplierCountry: string;
  defaultQuantity?: number;
  className?: string;
  children?: React.ReactNode;
};

export default function RequestQuoteButton({
  productId,
  productName,
  supplierId,
  supplierName,
  supplierCountry,
  defaultQuantity,
  className,
  children
}: RequestQuoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={className || "w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-3 px-4 rounded-sm transition-colors text-sm"}
      >
        {children || (
          <>
            <FileCheck className="w-4 h-4" />
            Request Quote (RFQ)
          </>
        )}
      </button>
      
      <RfqModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        productId={productId}
        productName={productName}
        supplierId={supplierId}
        supplierName={supplierName}
        supplierCountry={supplierCountry}
        defaultQuantity={defaultQuantity}
      />
    </>
  );
}
