import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { ResourcesSection } from "@/features/home/components/ResourcesSection";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://synthora.com";

export const metadata: Metadata = {
  title: "Compliance & Technical Resources | B2B Procurement | Synthora",
  description: "Access regulatory compliance guides, COA/MSDS verification handbooks, export manuals, and chemical sourcing resources.",
  alternates: {
    canonical: `${SITE_URL}/resources`,
  },
  openGraph: {
    title: "Compliance & Technical Resources | Synthora",
    description: "Access regulatory compliance guides, COA/MSDS verification handbooks, and chemical sourcing resources.",
    url: `${SITE_URL}/resources`,
    siteName: "Synthora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compliance & Technical Resources | Synthora",
    description: "Access regulatory compliance guides, COA/MSDS verification handbooks, and chemical sourcing resources.",
  },
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Compliance & Technical Resources
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Access regulatory compliance guides, COA/MSDS verification handbooks, and export manuals.
          </p>
        </div>

        <ResourcesSection />
      </main>
      <Footer />
    </div>
  );
}
