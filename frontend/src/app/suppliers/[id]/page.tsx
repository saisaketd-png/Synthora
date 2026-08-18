import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { ShieldCheck, MapPin, Clock, Award, Building2, Factory, FileCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplierPublicProfile, getSupplierProducts } from "@/features/suppliers/api";
import { SupplierProductCatalog } from "@/features/suppliers/components/SupplierProductCatalog";

export default async function SupplierProfilePage(props: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 0;
  const size = typeof searchParams.size === "string" ? parseInt(searchParams.size, 10) : 10;
  
  const [supplier, products] = await Promise.all([
    getSupplierPublicProfile(params.id),
    getSupplierProducts(params.id, { page, size })
  ]);

  if (!supplier) {
    return notFound();
  }

  // Handle certifications (split by comma if needed, or if it's JSON array format, etc)
  // Assuming it's a comma separated string for now.
  const certList = supplier.certifications ? supplier.certifications.split(",").map(c => c.trim()) : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="text-xs text-slate-500 mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/suppliers" className="hover:text-blue-600">Suppliers</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{supplier.name}</span>
          </nav>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden mb-8">
            {/* Header Banner */}
            <div className="h-32 bg-[#0A192F] relative">
              <div className="absolute -bottom-10 left-8">
                {supplier.logoUrl ? (
                  <img src={supplier.logoUrl} alt={supplier.name} className="w-24 h-24 rounded-sm border-4 border-white shadow-sm object-cover bg-white" />
                ) : (
                  <div className="w-24 h-24 rounded-sm bg-white border-4 border-white shadow-sm flex items-center justify-center bg-blue-600/5 text-blue-600 font-serif text-3xl font-extrabold">
                    {supplier.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-14 pb-8 px-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      {supplier.name}
                    </h1>
                    {supplier.verified && (
                      <div className="flex items-center gap-1 bg-teal-500/10 text-teal-500 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-teal-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Partner
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {supplier.countryName}
                    </span>
                    {supplier.yearsInBusiness != null && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {supplier.yearsInBusiness} Years in Business
                      </span>
                    )}
                    {supplier.website && (
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/rfqs/new?supplierId=${supplier.id}`} className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-2.5 px-6 rounded-full transition-colors text-sm">
                    <FileCheck className="w-4 h-4" />
                    Request Quote
                  </Link>
                  <a href="#catalog" className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold py-2.5 px-6 rounded-full transition-colors text-sm">
                    View Catalog
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-10 pt-8 border-t border-slate-100">
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Company Overview</h3>
                    {supplier.aboutCompany ? (
                       <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                         {supplier.aboutCompany}
                       </p>
                    ) : (
                       <p className="text-sm text-slate-400 italic">No company description provided.</p>
                    )}
                  </section>
                </div>

                <div className="space-y-8">
                  {certList.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Certifications
                      </h3>
                      <div className="space-y-2">
                        {certList.map(c => (
                          <div key={c} className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 p-2 rounded-sm">
                            <Award className="w-4 h-4 text-teal-500" />
                            <span className="font-semibold">{c}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Performance</h3>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-3">
                      {supplier.responseRate != null && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Avg Response Time</span>
                          <span className="text-sm font-bold text-slate-900">&lt; {supplier.responseRate} Hours</span>
                        </div>
                      )}
                      {supplier.exportReady && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Export Ready</span>
                          <span className="text-sm font-bold text-emerald-600">Yes</span>
                        </div>
                      )}
                      {!supplier.exportReady && supplier.responseRate == null && (
                         <span className="text-sm text-slate-400 italic">No performance data available.</span>
                      )}
                    </div>
                  </section>
                </div>
              </div>
              
              <div id="catalog" className="mt-16 pt-8 border-t border-slate-100">
                <h2 className="text-xl font-serif font-bold text-slate-900 mb-6">Product Portfolio</h2>
                <SupplierProductCatalog products={products} supplierId={supplier.id.toString()} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
