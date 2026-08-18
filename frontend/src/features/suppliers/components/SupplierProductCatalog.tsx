import { SupplierProductPublicResponse, SupplierProductListResponse } from "@/features/suppliers/types";
import { Package, ExternalLink, Activity, Beaker } from "lucide-react";
import Link from "next/link";

export function SupplierProductCatalog({ 
  products,
  supplierId
}: { 
  products: SupplierProductListResponse;
  supplierId: string;
}) {
  
  if (products.content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-sm">
        <Package className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">No Public Products Listed</h3>
        <p className="text-sm text-slate-500 max-w-sm text-center">
          This supplier has not yet published any products to their public catalog. 
          You can still request a quote directly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.content.map(product => (
        <div key={product.id} className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col md:flex-row gap-6">
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {product.name}
                </h3>
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                  <span>{product.category}</span>
                  {product.casNumber && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>CAS: {product.casNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-slate-600 mb-6 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-sm border border-slate-100">
              {product.purity && (
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Beaker className="w-3.5 h-3.5"/> Purity</div>
                  <div className="text-sm font-bold text-slate-900">{product.purity}%</div>
                </div>
              )}
              {product.grade && (
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Grade</div>
                  <div className="text-sm font-bold text-slate-900">{product.grade}</div>
                </div>
              )}
              {product.moqKg && (
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Package className="w-3.5 h-3.5"/> MOQ</div>
                  <div className="text-sm font-bold text-slate-900">{product.moqKg} kg</div>
                </div>
              )}
              {product.leadTimeDays && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Lead Time</div>
                  <div className="text-sm font-bold text-slate-900">{product.leadTimeDays} Days</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col justify-end">
             <Link 
                href={`/products/${product.id}`}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-full transition-colors text-sm w-full md:w-auto"
              >
                View Product <ExternalLink className="w-4 h-4" />
             </Link>
          </div>
          
        </div>
      ))}
    </div>
  );
}
