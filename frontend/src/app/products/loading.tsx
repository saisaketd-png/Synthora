import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <div className="h-10 bg-slate-200 rounded-md w-1/4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded-md w-1/3 mt-4 animate-pulse"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Skeleton */}
            <aside className="w-full lg:w-3/12 max-w-sm shrink-0 space-y-8">
              <div className="h-[600px] bg-slate-200 rounded-xl animate-pulse"></div>
            </aside>

            {/* Table Skeleton */}
            <div className="w-full lg:w-9/12 flex-1">
              <div className="h-16 bg-slate-200 rounded-xl w-full mb-6 animate-pulse"></div>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex p-4 gap-4 items-center h-[64px]">
                      <div className="h-8 bg-slate-200 rounded-md w-8 animate-pulse shrink-0"></div>
                      <div className="h-8 bg-slate-200 rounded-md w-48 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded-md w-24 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded-md w-32 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded-md w-16 animate-pulse"></div>
                      <div className="h-8 bg-slate-200 rounded-md w-24 ml-auto animate-pulse"></div>
                    </div>
                  ))}
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
