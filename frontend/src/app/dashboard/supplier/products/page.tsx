"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { getMyProducts, deleteProduct } from "@/features/products/api/manageProducts";
import { Product, ProductPage } from "@/features/products/types/product";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { SectionHeader } from "@/shared/components/SectionHeader";
import { ProductPagination } from "@/features/products/components/ProductPagination";

export default function SupplierProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "0", 10);

  const [productPage, setProductPage] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProducts(page, 20, "createdAt", "desc");
      setProductPage(data);
    } catch (err: any) {
      setError(err.message || "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("DELETE PRODUCT?\n\nThis will permanently remove the product from your supplier catalog.")) {
      return;
    }
    
    try {
      setDeleteLoading(id);
      await deleteProduct(id);
      await loadProducts();
    } catch (err: any) {
      alert("Failed to delete product: " + (err.message || "Unknown error"));
    } finally {
      setDeleteLoading(null);
    }
  };

  const columns: Column<Product>[] = [
    {
      header: "Product",
      cell: (p) => (
        <div>
          <div className="font-bold text-slate-900">{p.name}</div>
          <div className="text-[11px] text-slate-500 max-w-[200px] truncate">{p.description}</div>
        </div>
      ),
    },
    {
      header: "CAS",
      accessorKey: "casNumber",
      cell: (p) => p.casNumber ? <span className="font-mono text-slate-600">{p.casNumber}</span> : "-",
    },
    {
      header: "Purity",
      cell: (p) => p.purity != null ? `${p.purity}%` : "-",
    },
    {
      header: "Stock",
      cell: (p) => (
        <span className={`font-bold ${p.stock > 0 ? 'text-slate-900' : 'text-rose-600'}`}>
          {p.stock} {p.packaging ? <span className="text-slate-400 font-normal">({p.packaging})</span> : ""}
        </span>
      ),
    },
    {
      header: "MOQ",
      cell: (p) => p.moqKg != null ? `${p.moqKg} kg` : "-",
    },
    {
      header: "Price",
      cell: (p) => p.price != null ? `$${p.price.toFixed(2)}` : "-",
    },
    {
      header: "Lead Time",
      cell: (p) => p.leadTimeDays != null ? `${p.leadTimeDays} days` : "-",
    },
    {
      header: "Status",
      cell: (p) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          p.availabilityStatus === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700' :
          p.availabilityStatus === 'OUT_OF_STOCK' ? 'bg-rose-50 text-rose-700' :
          p.availabilityStatus === 'MADE_TO_ORDER' ? 'bg-blue-50 text-blue-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {p.availabilityStatus ? p.availabilityStatus.replace(/_/g, ' ') : 'UNKNOWN'}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (p) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/supplier/products/${p.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(p.id)}
            disabled={deleteLoading === p.id}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Product Catalog"
          subtitle="Manage your enterprise inventory and commercial specifications"
        />
        <Link
          href="/dashboard/supplier/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-sm transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <EnterpriseTable
              columns={columns}
              data={productPage?.content || []}
              keyExtractor={(p) => p.id}
              emptyTitle="NO PRODUCTS LISTED"
              emptyDescription="No products have been added to your supplier catalog yet."
            />
          </div>
          
          <div className="block lg:hidden space-y-4">
            {(!productPage?.content || productPage.content.length === 0) ? (
              <div className="text-center p-8 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-900 font-bold mb-2">NO PRODUCTS LISTED</p>
                <p className="text-sm text-slate-500 mb-6">No products have been added to your supplier catalog yet.</p>
              </div>
            ) : (
              productPage.content.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{p.casNumber || 'No CAS'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.availabilityStatus === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700' :
                      p.availabilityStatus === 'OUT_OF_STOCK' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {p.availabilityStatus ? p.availabilityStatus.replace(/_/g, ' ') : 'UNKNOWN'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Stock: <span className="font-bold text-slate-900">{p.stock}</span></span>
                    <span className="text-slate-500">Price: <span className="font-bold text-slate-900">${p.price?.toFixed(2) || '0.00'}</span></span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/dashboard/supplier/products/${p.id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleteLoading === p.id}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {productPage && productPage.totalElements > 0 && (
            <ProductPagination
              queryParams={{ page }}
              totalElements={productPage.totalElements}
              currentCount={productPage.content.length}
            />
          )}
        </>
      )}
    </div>
  );
}
