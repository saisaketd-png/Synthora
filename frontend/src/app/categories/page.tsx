import { Metadata } from "next";
import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { CategoryGrid } from "@/features/home/components/CategoryGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chemical Categories & Classifications | KemKendra",
  description: "Browse pharmaceutical APIs, intermediates, specialty chemicals, and solvents categorized for global enterprise procurement.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Chemical Categories & Classifications | KemKendra",
    description: "Browse pharmaceutical APIs, intermediates, specialty chemicals, and solvents categorized for global enterprise procurement.",
    url: "https://kemkendra.online/categories",
    siteName: "KemKendra",
    type: "website",
  },
};

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Chemical Categories & Classifications
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Browse pharmaceutical actives, intermediates, solvents, and specialty compounds by application.
          </p>
        </div>

        <CategoryGrid />
      </main>
      <Footer />
    </div>
  );
}
