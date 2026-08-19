import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { IndustryGrid } from "@/features/home/components/IndustryGrid";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://synthora.com";

export const metadata: Metadata = {
  title: "Industries Served | Chemical & Pharma Sourcing | Synthora",
  description: "Explore enterprise chemical procurement solutions across Active Pharmaceutical Ingredients (APIs), specialty polymers, agrochemicals, and fine intermediates.",
  alternates: {
    canonical: `${SITE_URL}/industries`,
  },
  openGraph: {
    title: "Industries Served | Synthora",
    description: "Enterprise chemical procurement solutions tailored for specialized manufacturing sectors.",
    url: `${SITE_URL}/industries`,
    siteName: "Synthora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Industries Served | Synthora",
    description: "Enterprise chemical procurement solutions tailored for specialized manufacturing sectors.",
  },
};

export default function IndustriesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Industries Served
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Dedicated sourcing solutions tailored for specialized chemical manufacturing sectors.
          </p>
        </div>

        <IndustryGrid />
      </main>
      <Footer />
    </div>
  );
}
