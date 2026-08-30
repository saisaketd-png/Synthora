import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { ShieldCheck, MapPin, Clock, Award, Building2, Factory, FileCheck, ExternalLink, Globe2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplierPublicProfile, getSupplierProducts } from "@/features/suppliers/api";
import { SupplierProductCatalog } from "@/features/suppliers/components/SupplierProductCatalog";
import { Badge, Button, Card, PageHeader } from "@/shared/components/ui/KemkendraUI";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.com";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  try {
    const supplier = await getSupplierPublicProfile(params.id);
    if (!supplier) {
      return {
        title: "Supplier Profile | KemKendra",
        robots: { index: false, follow: true },
      };
    }
    const title = `${supplier.name} | Verified Chemical Manufacturer | KemKendra`;
    const description =
      supplier.aboutCompany ||
      `Source chemical compounds, APIs, and specialty raw materials from verified supplier ${supplier.name} on KemKendra.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/suppliers/${params.id}`,
      },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/suppliers/${params.id}`,
        siteName: "KemKendra",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Supplier Profile | KemKendra",
      robots: { index: false, follow: true },
    };
  }
}

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

  // Schema.org Organization JSON-LD
  const supplierJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: supplier.name,
    description: supplier.aboutCompany || `Verified chemical supplier ${supplier.name} on KemKendra.`,
    url: `${SITE_URL}/suppliers/${params.id}`,
    location: supplier.countryName ? {
      "@type": "Place",
      name: supplier.countryName,
    } : undefined,
  };

  const certList = supplier.certifications ? supplier.certifications.split(",").map(c => c.trim()) : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] font-sans text-[#0F172A] antialiased">
      {/* Inject Supplier Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supplierJsonLd) }}
      />
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumbs */}
          <nav className="text-xs text-[#64748B] flex items-center gap-2">
            <Link href="/" className="hover:text-[#155EEF] font-medium">Home</Link>
            <span>/</span>
            <Link href="/suppliers" className="hover:text-[#155EEF] font-medium">Suppliers</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-bold">{supplier.name}</span>
          </nav>

          {/* Supplier Header Banner Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xs overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[#0B1F3A] to-[#07152A] relative px-8">
              <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden p-1">
                  {supplier.logoUrl ? (
                    <img src={supplier.logoUrl} alt={supplier.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-[#EFF4FF] text-[#155EEF] font-bold text-3xl flex items-center justify-center">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-14 pb-8 px-6 sm:px-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                      {supplier.name}
                    </h1>
                    {supplier.verified && (
                      <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#059669] px-3 py-1 rounded-full text-xs font-bold border border-[#A7F3D0]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Supplier
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-4 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#94A3B8]" />
                      {supplier.countryName || supplier.countryCode || "Global"}
                    </span>
                    {supplier.yearsInBusiness != null && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#94A3B8]" />
                        {supplier.yearsInBusiness} Years in Business
                      </span>
                    )}
                    {supplier.website && (
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#155EEF] hover:underline font-semibold">
                        <ExternalLink className="w-4 h-4 text-[#155EEF]" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <Link
                    href={`/rfqs/new?supplierId=${supplier.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-[#155EEF] hover:bg-[#104EC6] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-2xs text-xs"
                  >
                    <FileCheck className="w-4 h-4" />
                    Request Quote
                  </Link>
                  <a
                    href="#catalog"
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold py-2.5 px-5 rounded-xl transition-colors text-xs"
                  >
                    View Chemical Catalog
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-[#E2E8F0]">
                <div className="md:col-span-2 space-y-6">
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">Company Overview</h3>
                    {supplier.aboutCompany ? (
                       <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                         {supplier.aboutCompany}
                       </p>
                    ) : (
                       <p className="text-xs text-[#94A3B8] italic">No company description provided.</p>
                    )}
                  </section>
                </div>

                <div className="space-y-6">
                  {certList.length > 0 && (
                    <section className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#64748B]" />
                        Compliance & Certifications
                      </h3>
                      <div className="space-y-2">
                        {certList.map((c) => (
                          <div key={c} className="flex items-center gap-2 text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-xl">
                            <Award className="w-4 h-4 text-[#0F9F9A] shrink-0" />
                            <span className="font-semibold">{c}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">RFQ Performance & Responsiveness</h3>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] font-semibold">Response Rate</span>
                        {supplier.responseRate !== null && supplier.responseRate !== undefined ? (
                          <strong className="text-[#0F172A] font-mono">{supplier.responseRate}%</strong>
                        ) : (
                          <span className="text-[#94A3B8] italic font-medium">No response history yet</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] font-semibold">Avg. Response Time</span>
                        {supplier.formattedResponseTime ? (
                          <strong className="text-[#0F172A] font-mono">{supplier.formattedResponseTime}</strong>
                        ) : (
                          <span className="text-[#94A3B8] italic font-medium">Not enough data</span>
                        )}
                      </div>
                      {supplier.eligibleRfqs !== undefined && supplier.eligibleRfqs !== null && supplier.eligibleRfqs > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B] font-semibold">Responded RFQs</span>
                          <strong className="text-[#0F172A] font-mono">{supplier.respondedRfqs ?? 0} / {supplier.eligibleRfqs}</strong>
                        </div>
                      )}
                      {supplier.exportReady && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B] font-semibold">Export Ready</span>
                          <strong className="text-[#059669]">Global Ready</strong>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
              
              <div id="catalog" className="pt-8 border-t border-[#E2E8F0] space-y-6">
                <h2 className="text-lg font-bold text-[#0F172A]">Chemical Product Portfolio</h2>
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
