import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Send, ChevronRight, MessageSquare, Building } from "lucide-react";
import Link from "next/link";
import { serializeJsonLd } from "@/shared/utils/security";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online";

export const metadata: Metadata = {
  title: "Contact KemKendra | Chemical Procurement & Supplier Support Desk",
  description: "Contact KemKendra's chemical procurement desk in Bengaluru, Karnataka. Call +91 7676447077 or email kemkendra1@gmail.com for bulk chemical inquiries, RFQs, and supplier verification.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact KemKendra | Chemical Procurement & Supplier Support",
    description: "Contact KemKendra's chemical procurement desk in Bengaluru, Karnataka. Call +91 7676447077 or email kemkendra1@gmail.com for bulk chemical inquiries.",
    url: `${SITE_URL}/contact`,
    siteName: "KemKendra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact KemKendra | Chemical Procurement Support",
    description: "Contact KemKendra's chemical procurement desk in Bengaluru, Karnataka.",
  },
};

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact KemKendra",
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "KemKendra",
      url: SITE_URL,
      email: "kemkendra1@gmail.com",
      telephone: "+91-7676447077",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-7676447077",
        contactType: "customer service",
        email: "kemkendra1@gmail.com",
        availableLanguage: ["English", "Hindi", "Kannada"],
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contact Us",
        item: `${SITE_URL}/contact`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] font-sans text-[#0F172A] antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(contactJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <Link href="/" className="hover:text-[#155EEF]">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="text-[#0F172A] font-extrabold">Contact Us</span>
          </nav>

          {/* Header */}
          <div className="bg-white border border-[#DCE3EC] rounded-3xl p-8 sm:p-12 shadow-2xs space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF4FF] text-[#155EEF] border border-[#BFDBFE]">
              <MessageSquare className="w-4 h-4" /> Direct Procurement Assistance
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">
              Get in Touch with KemKendra
            </h1>
            <p className="text-sm sm:text-base text-[#475467] max-w-2xl leading-relaxed">
              Whether you are sourcing hard-to-find APIs, requesting customized packaging for bulk solvents, or onboarding as a verified manufacturer, our support desk is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Contact Details Cards */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-4">
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#155EEF]" /> Registered Office
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-[#475467]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#155EEF] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">Headquarters</p>
                      <p>Bengaluru, Karnataka, India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">Direct Desk & WhatsApp</p>
                      <a href="tel:+917676447077" className="text-[#155EEF] font-bold hover:underline">
                        +91 7676447077
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#9333EA] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">Email Inquiries</p>
                      <a href="mailto:kemkendra1@gmail.com" className="text-[#155EEF] font-bold hover:underline">
                        kemkendra1@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">Business Hours</p>
                      <p>Monday – Saturday: 9:00 AM – 6:00 PM IST</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#EFF4FF] border border-[#BFDBFE] rounded-2xl p-6 space-y-2">
                <h3 className="text-sm font-bold text-[#1E40AF] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#155EEF]" /> Are you a chemical manufacturer?
                </h3>
                <p className="text-xs text-[#1E3A8A] leading-relaxed">
                  Join our audited supplier directory to connect directly with industrial and institutional chemical buyers across India and global markets.
                </p>
                <div className="pt-2">
                  <Link
                    href="/register/supplier"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#155EEF] hover:underline"
                  >
                    Apply for Manufacturer Onboarding &rarr;
                  </Link>
                </div>
              </div>

            </div>

            {/* Quick Inquiry Guidance */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Chemical Procurement Inquiries</h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    To expedite compound sourcing, please include the chemical name, CAS number, required purity or grade, and target volume in your communication.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#155EEF]">Step 1</span>
                    <p className="text-sm font-bold text-[#0F172A]">Search Catalog</p>
                    <p className="text-xs text-[#64748B]">Verify if your target CAS or compound is actively listed in our database.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#155EEF]">Step 2</span>
                    <p className="text-sm font-bold text-[#0F172A]">Submit RFQ</p>
                    <p className="text-xs text-[#64748B]">Request customized commercial bids specifying delivery terms and packaging.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#155EEF]">Step 3</span>
                    <p className="text-sm font-bold text-[#0F172A]">Review COAs</p>
                    <p className="text-xs text-[#64748B]">Inspect vendor analytical test reports and compliance documentation.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#155EEF]">Step 4</span>
                    <p className="text-sm font-bold text-[#0F172A]">Direct Procurement</p>
                    <p className="text-xs text-[#64748B]">Finalize dispatch and commercial invoicing with audited suppliers.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/products"
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#155EEF] hover:bg-[#104EC6] text-white text-xs font-bold rounded-xl shadow-2xs text-center transition-colors"
                  >
                    Browse Catalog Products
                  </Link>
                  <a
                    href="mailto:kemkendra1@gmail.com?subject=Chemical%20Procurement%20Inquiry"
                    className="w-full sm:w-auto px-6 py-2.5 bg-white border border-[#DCE3EC] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold rounded-xl text-center transition-colors"
                  >
                    Email Procurement Desk
                  </a>
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
