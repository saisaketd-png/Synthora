import Link from "next/link";
import { Product } from "../types/product";
import { ShieldCheck, Flag } from "lucide-react";

interface ProductCatalogTableProps {
  products: Product[];
}

export function ProductCatalogTable({ products }: ProductCatalogTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left text-[13px] whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3.5 sticky left-0 bg-slate-50 z-10 w-64 shadow-[inset_-1px_0_0_0_#e2e8f0]">
                Product
              </th>
              <th scope="col" className="px-4 py-3.5">CAS No.</th>
              <th scope="col" className="px-4 py-3.5">Category</th>
              <th scope="col" className="px-4 py-3.5 w-48">Supplier</th>
              <th scope="col" className="px-4 py-3.5">Country</th>
              <th scope="col" className="px-4 py-3.5">Purity</th>
              <th scope="col" className="px-4 py-3.5 text-right">MOQ / Price</th>
              <th scope="col" className="px-4 py-3.5 text-center">Availability</th>
              <th scope="col" className="px-4 py-3.5 text-center sticky right-0 bg-slate-50 z-10 shadow-[inset_1px_0_0_0_#e2e8f0]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors h-[60px] group">
                <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[inset_-1px_0_0_0_#e2e8f0] transition-colors">
                  <Link href={`/products/${p.id}`} className="font-bold text-[#0A192F] hover:text-blue-600 truncate block w-60">
                    {p.name}
                  </Link>
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
                  <div className="flex items-center gap-1.5">
                    {p.verificationStatus && (
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    )}
                    <Link href={`/suppliers/${p.sellerId}`} className="hover:underline truncate text-slate-900">
                      {p.sellerName}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Flag className="w-3.5 h-3.5" />
                    <span>{p.country || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-2 font-mono">
                  {p.purity ? `${p.purity}` : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-slate-900">{formatPrice(p.price)}</span>
                    <span className="text-[11px] text-slate-400">Min: {p.moq || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    p.availability === "In Stock" || p.stock > 0 ? "bg-teal-50 text-teal-700" :
                    p.availability === "Limited" ? "bg-orange-50 text-orange-700" : 
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {p.availability || (p.stock > 0 ? "In Stock" : "Made to Order")}
                  </span>
                </td>
                <td className="px-4 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[inset_1px_0_0_0_#e2e8f0] transition-colors">
                  <Link
                    href={`/rfq?productId=${p.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] bg-white border border-slate-200 text-slate-800 text-[12px] font-bold rounded-full hover:bg-slate-50 transition-colors"
                  >
                    Request Quote
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {products.map((p) => (
          <div key={p.id} className="p-4 bg-white flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/products/${p.id}`} className="font-bold text-[#0A192F] hover:text-blue-600 text-[15px] leading-tight">
                  {p.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-slate-500">CAS: {p.casNumber || "—"}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs text-slate-500">{p.category}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                    p.availability === "In Stock" || p.stock > 0 ? "bg-teal-50 text-teal-700" :
                    p.availability === "Limited" ? "bg-orange-50 text-orange-700" : 
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {p.availability || (p.stock > 0 ? "In Stock" : "Order")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-md border border-slate-100">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Supplier</span>
                <Link href={`/suppliers/${p.sellerId}`} className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                  {p.verificationStatus && <ShieldCheck className="w-3 h-3 text-teal-500 shrink-0" />}
                  {p.sellerName}
                </Link>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Country</span>
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                  <Flag className="w-3 h-3 text-slate-400" />
                  {p.country || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Purity</span>
                <span className="text-xs font-mono font-medium text-slate-700 mt-0.5 block">{p.purity || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Price / MOQ</span>
                <span className="text-xs font-mono font-bold text-[#0A192F] mt-0.5 block">
                  {formatPrice(p.price)} <span className="font-normal text-slate-500 text-[10px]">/ {p.moq || "—"}</span>
                </span>
              </div>
            </div>

            <Link
              href={`/rfq?productId=${p.id}`}
              className="mt-1 w-full flex items-center justify-center px-4 py-2 min-h-[44px] bg-white border border-slate-200 text-slate-800 text-[13px] font-bold rounded-full hover:bg-slate-50 transition-colors"
            >
              Request Quote
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
