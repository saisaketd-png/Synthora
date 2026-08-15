import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { ShieldCheck, MapPin, FlaskConical, FileCheck, ArrowRight, PackageOpen } from "lucide-react";
import Link from "next/link";
import { fetchProductDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { Product } from "@/features/products/types/product";
import SupplierComparison from "@/features/products/components/SupplierComparison";
import RequestQuoteButton from "@/features/rfq/components/RequestQuoteButton";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let product: Product;

  try {
    product = await fetchProductDetail(resolvedParams.id);
  } catch (err) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="text-xs text-slate-500 mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-[#0F3D91]">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#0F3D91]">Products</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
            {/* Left Column: Image & Basic Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="aspect-square bg-white border border-slate-200 rounded-sm flex items-center justify-center p-8 relative">
                <FlaskConical className="w-24 h-24 text-slate-300" />
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#17B5AE]/10 text-[#17B5AE] px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-[#17B5AE]/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </div>
              </div>
            </div>

            {/* Middle Column: Details & Technical Data */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#0F3D91] bg-[#0F3D91]/5 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>
                <h1 className="font-serif text-3xl font-extrabold text-slate-900 leading-tight">
                  {product.name}
                </h1>
                <p className="text-sm text-slate-500 mt-2 font-mono">
                  CAS: {product.casNumber || "N/A"}
                </p>
              </div>

              <div className="prose prose-sm prose-slate">
                <p className="leading-relaxed">
                  High-purity {product.name.toLowerCase()} manufactured under cGMP guidelines. 
                  Suitable for pharmaceutical compounding, synthetic precursors, and analytical applications. 
                  Comprehensive documentation including Certificate of Analysis (COA) and Material Safety Data Sheet (MSDS) provided upon request.
                </p>
                <p className="leading-relaxed mt-2 text-slate-600">
                  {product.description}
                </p>
              </div>


              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Technical Specifications
                </h3>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 text-sm">

                  {/* CAS Number */}
                  <div>
                    <dt className="text-slate-500 mb-1">CAS Number</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.casNumber || "N/A"}
                    </dd>
                  </div>

                  {/* Molecular Formula */}
                  <div>
                    <dt className="text-slate-500 mb-1">Molecular Formula</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.molecularFormula || "N/A"}
                    </dd>
                  </div>

                  {/* Purity */}
                  <div>
                    <dt className="text-slate-500 mb-1">Purity</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.purity ? `${product.purity}%` : "N/A"}
                    </dd>
                  </div>

                  {/* Grade */}
                  <div>
                    <dt className="text-slate-500 mb-1">Grade</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.grade || "N/A"}
                    </dd>
                  </div>

                  {/* Packaging */}
                  <div>
                    <dt className="text-slate-500 mb-1">Packaging</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.packaging || "N/A"}
                    </dd>
                  </div>

                  {/* MOQ */}
                  <div>
                    <dt className="text-slate-500 mb-1">MOQ</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.moqKg ? `${product.moqKg} kg` : "N/A"}
                    </dd>
                  </div>

                  {/* Lead Time */}
                  <div>
                    <dt className="text-slate-500 mb-1">Lead Time</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.leadTimeDays ? `${product.leadTimeDays} days` : "N/A"}
                    </dd>
                  </div>

                  {/* Availability */}
                  <div>
                    <dt className="text-slate-500 mb-1">Availability</dt>
                    <dd className="font-semibold text-slate-900">
                      {product.availabilityStatus || "N/A"}
                    </dd>
                  </div>

                </dl>
              </div>
            </div>

            {/* Right Column: Sourcing & Supplier */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm sticky top-24">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                    <span className="text-sm font-semibold text-slate-500">Target Price</span>
                    <span className="text-2xl font-bold text-slate-900">${product.price.toFixed(2)} / kg</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-500">MOQ</span>
                    <span className="font-bold text-slate-900">
                      {product.moqKg ? `${product.moqKg} kg` : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-500">Availability</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm text-xs">
                      {product.stock > 0 ? "In Stock" : "On Request"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                    Supplier Profile
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {(product.sellerName || "U").charAt(0)}
                    </div>
                    <div>
                      <Link href={`/suppliers/${product.sellerId || 'demo'}`} className="font-bold text-[#0F3D91] hover:underline block leading-tight">
                        {product.sellerName || "Unknown Supplier"}
                      </Link>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                       {"India"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <RequestQuoteButton 
                     productId={product.id} 
                     productName={product.name} 
                     supplierId={Number(product.sellerId) || 1} 
                     supplierName={product.sellerName || "Unknown Supplier"} 
                     supplierCountry={"India"} 
                     defaultQuantity={product.moqKg || 10} 
                  />
                  <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold py-3 px-4 rounded-sm transition-colors text-sm">
                    Contact Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Supplier Comparison Section */}
          <div className="mt-8">
            <SupplierComparison productId={resolvedParams.id} productName={product.name} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
