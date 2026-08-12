import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { ShieldCheck, MapPin, Clock, Award, Building2, Factory, FileCheck } from "lucide-react";
import Link from "next/link";

export default function SupplierProfilePage({ params }: { params: { id: string } }) {
  // Demo supplier profile data
  const supplier = {
    id: params.id,
    name: "Apex BioPharma Exporters Ltd",
    country: "India",
    yearsInBusiness: 18,
    specialties: ["APIs", "Analgesics", "GMP Synthesis", "Custom Intermediates"],
    responseRate: "< 2 Hours",
    verified: true,
    complianceCertificates: ["US-FDA", "EU-GMP", "ISO 9001"],
    about: "Apex BioPharma is a premier exporter of high-quality active pharmaceutical ingredients and advanced intermediates. With multiple GMP-certified facilities and a robust global supply chain network, we partner with leading pharmaceutical companies worldwide.",
    facilityType: "Manufacturer & Exporter"
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="text-xs text-slate-500 mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-[#0F3D91]">Home</Link>
            <span>/</span>
            <Link href="/suppliers" className="hover:text-[#0F3D91]">Suppliers</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{supplier.name}</span>
          </nav>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden mb-8">
            {/* Header Banner */}
            <div className="h-32 bg-[#0B132B] relative">
              <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 rounded-sm bg-white border-4 border-white shadow-sm flex items-center justify-center bg-[#0F3D91]/5 text-[#0F3D91] font-serif text-3xl font-extrabold">
                  {supplier.name.charAt(0)}
                </div>
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
                      <div className="flex items-center gap-1 bg-[#17B5AE]/10 text-[#17B5AE] px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-[#17B5AE]/20">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Partner
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {supplier.country}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {supplier.yearsInBusiness} Years in Business
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-slate-400" />
                      {supplier.facilityType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button className="flex items-center justify-center gap-2 bg-[#17B5AE] hover:bg-[#149d97] text-slate-900 font-bold py-2.5 px-6 rounded-sm transition-colors text-sm">
                    <FileCheck className="w-4 h-4" />
                    Request Quote
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold py-2.5 px-6 rounded-sm transition-colors text-sm">
                    View Catalog
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-10 pt-8 border-t border-slate-100">
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Company Overview</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {supplier.about}
                    </p>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Product Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {supplier.specialties.map(s => (
                        <span key={s} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-semibold rounded-sm border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      Certifications
                    </h3>
                    <div className="space-y-2">
                      {supplier.complianceCertificates.map(c => (
                        <div key={c} className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 p-2 rounded-sm">
                          <Award className="w-4 h-4 text-[#17B5AE]" />
                          <span className="font-semibold">{c}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Performance</h3>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Avg Response Time</span>
                        <span className="text-sm font-bold text-slate-900">{supplier.responseRate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-semibold uppercase">On-Time Delivery</span>
                        <span className="text-sm font-bold text-emerald-600">98.5%</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
