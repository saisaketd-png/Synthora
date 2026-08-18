import { Navbar } from "@/features/home/components/Navbar";
import { Footer } from "@/features/home/components/Footer";
import { FileCheck, Send, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RFQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/10 text-blue-600 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>Direct Factory RFQ Submission</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Submit Request for Quotation (RFQ)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Broadcast your procurement requirements directly to verified ISO & GMP manufacturers. Receive formal quotes within 2-4 hours.
            </p>
          </div>

          <form action="#" method="POST" className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Chemical Name or CAS # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol / CAS 103-90-2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Required Monograph Grade *
                </label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white">
                  <option value="USP">USP Grade</option>
                  <option value="EP">EP (European Pharmacopoeia)</option>
                  <option value="IP">IP Grade</option>
                  <option value="HPLC">HPLC / Analytical Solvent</option>
                  <option value="INDUSTRIAL">Industrial / Tech Grade</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Required Target Quantity (kg / L) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2,500 kg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Destination Port / Country *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamburg, Germany"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Additional Technical Specs / Special Packaging Requirements
              </label>
              <textarea
                rows={4}
                placeholder="Specify impurity thresholds, mesh size, container type (e.g. 25kg drums), or custom synthesis parameters..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit RFQ to Verified Suppliers</span>
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
