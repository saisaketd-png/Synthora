import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { SupplierSpotlight } from "@/features/home/components/SupplierSpotlight";

export default function SuppliersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Supplier Directory
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
            Discover verified chemical manufacturers, request audits, and streamline your onboarding process with our audited supplier network.
          </p>
        </div>

        <SupplierSpotlight />
      </main>

      <Footer />
    </div>
  );
}
