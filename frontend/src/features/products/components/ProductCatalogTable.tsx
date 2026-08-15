import Link from "next/link";
import { Product } from "../types/product";
import { ShieldCheck, Flag, FileText, Beaker } from "lucide-react";

interface ProductCatalogTableProps {
  products: Product[];
}

export function ProductCatalogTable({ products }: ProductCatalogTableProps) {
  const formatPrice = (price?: number) => {
    if (price === undefined) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const getAvailabilityColor = (status?: string, stock?: number) => {
    const s = status?.toLowerCase() || (stock && stock > 0 ? "in stock" : "made to order");
    if (s.includes("in stock")) return "bg-teal-50 text-teal-700 border-teal-100";
    if (s.includes("limited")) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left text-[13px] whitespace-nowrap border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3 sticky left-0 bg-slate-50 z-10 w-64 shadow-[inset_-1px_0_0_0_#e2e8f0]">
                Product
              </th>
              <th scope="col" className="px-4 py-3">CAS No.</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3 w-48">Supplier</th>
              <th scope="col" className="px-4 py-3">Country</th>
              <th scope="col" className="px-4 py-3">Purity</th>
              <th scope="col" className="px-4 py-3 text-right">MOQ</th>
              <th scope="col" className="px-4 py-3 text-center">Availability</th>
              <th scope="col" className="px-4 py-3 text-center">Docs</th>
              <th scope="col" className="px-4 py-3 text-center sticky right-0 bg-slate-50 z-10 shadow-[inset_1px_0_0_0_#e2e8f0]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors h-[64px] group">
                <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[inset_-1px_0_0_0_#e2e8f0] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center shrink-0">
                      <Beaker className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden w-48">
                      <Link href={`/products/${p.slug || p.id}`} className="font-bold text-[#0A192F] hover:text-blue-600 hover:underline truncate transition-colors">
                        {p.name}
                      </Link>
                      {p.molecularFormula && (
                        <span className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{p.molecularFormula}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 font-mono text-slate-600">
                  {p.casNumber || "—"}
                </td>
                <td className="px-4 py-2">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium tracking-wide">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-2 w-48 truncate">
                  <div className="flex items-center gap-1.5" title="Verified Supplier">
                    {(p.supplier?.verified || p.verificationStatus) && (
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    )}
                    <Link href={`/suppliers/${p.supplier?.id || p.sellerId}`} className="hover:underline truncate text-slate-900 font-medium">
                      {p.supplier?.name || p.sellerName || "—"}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Flag className="w-3.5 h-3.5" />
                    <span>{p.supplier?.countryName || p.supplier?.countryCode || p.country || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-2 font-mono font-medium">
                  {p.purity || "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <span className="font-mono font-bold text-slate-900">{p.moq || "Contact"}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-flex items-center justify-center px-2 py-1 border rounded-sm text-[10px] font-bold uppercase tracking-widest ${getAvailabilityColor(p.availability, p.stock)}`}>
                    {p.availability || (p.stock > 0 ? "In Stock" : "Made to Order")}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {p.coaAvailable ? (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-sm border border-blue-100" title="COA Available">COA</span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-transparent text-[10px]">COA</span>
                    )}
                    {p.msdsAvailable ? (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-sm border border-slate-200" title="MSDS Available">MSDS</span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-transparent text-[10px]">MSDS</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[inset_1px_0_0_0_#e2e8f0] transition-colors">
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <Link
                      href={`/products/${p.slug || p.id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 text-blue-600 text-[11px] font-bold rounded shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      Request Quote
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {products.map((p) => (
          <div key={p.id} className="p-4 bg-white flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded flex items-center justify-center shrink-0 border border-slate-100">
                <Beaker className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${p.slug || p.id}`} className="font-bold text-[#0A192F] hover:text-blue-600 hover:underline text-[15px] leading-tight block truncate">
                  {p.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span className="font-mono text-xs text-slate-500">CAS: {p.casNumber || "—"}</span>
                  {p.molecularFormula && (
                    <>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="font-mono text-xs text-slate-400">{p.molecularFormula}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md border border-slate-100">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Supplier</span>
                <Link href={`/suppliers/${p.supplier?.id || p.sellerId}`} className="text-xs font-medium text-slate-900 hover:underline flex items-center gap-1 mt-0.5 truncate">
                  {(p.supplier?.verified || p.verificationStatus) && <ShieldCheck className="w-3 h-3 text-teal-500 shrink-0" />}
                  {p.supplier?.name || p.sellerName || "—"}
                </Link>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Country</span>
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                  <Flag className="w-3 h-3 text-slate-400" />
                  {p.supplier?.countryName || p.supplier?.countryCode || p.country || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Purity</span>
                <span className="text-xs font-mono font-medium text-[#0A192F] mt-0.5 block">{p.purity || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">MOQ</span>
                <span className="text-xs font-mono font-bold text-[#0A192F] mt-0.5 block">{p.moq || "Contact"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className={`inline-flex items-center justify-center px-2 py-1 border rounded-sm text-[9px] font-bold uppercase tracking-widest ${getAvailabilityColor(p.availability, p.stock)}`}>
                {p.availability || (p.stock > 0 ? "In Stock" : "Order")}
              </span>
              <div className="flex gap-1">
                {p.coaAvailable && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-sm border border-blue-100">COA</span>}
                {p.msdsAvailable && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-sm border border-slate-200">MSDS</span>}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/products/${p.slug || p.id}`}
                className="flex-1 flex items-center justify-center px-4 py-2 min-h-[44px] bg-blue-600 text-white text-[13px] font-bold rounded-full hover:bg-blue-700 transition-colors shadow-sm"
              >
                Request Quote
              </Link>
              <Link
                href={`/products/${p.slug || p.id}`}
                className="flex-1 flex items-center justify-center px-4 py-2 min-h-[44px] bg-white border border-slate-200 text-slate-800 text-[13px] font-bold rounded-full hover:bg-slate-50 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
