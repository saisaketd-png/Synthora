import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function BuyerSupplierSplit() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Split Screen 50% / 50% Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E4E4E7]">
          
          {/* LEFT 50%: BUYERS */}
          <div className="py-8 lg:py-0 lg:pr-14 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#0052CC] block">
                For Institutional Buyers
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
                Source with clarity.
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed max-w-lg">
                Procure chemical raw materials with full regulatory traceability, direct manufacturer pricing, and audited batch COA records.
              </p>

              <ul className="space-y-3 pt-2 text-sm text-[#0F172A]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Discover chemicals by CAS number, assay purity, and compendial grade</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Request and compare structured commercial quotations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Issue legally binding purchase orders with tracked fulfillment</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0052CC] hover:text-[#0747A6]"
              >
                <span>For Buyers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT 50%: SUPPLIERS */}
          <div className="py-8 lg:py-0 lg:pl-14 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#059669] block">
                For Chemical Manufacturers
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
                Turn capability into demand.
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed max-w-lg">
                Connect directly with qualified institutional buyers, receive structured inquiries, and build lasting export distribution channels.
              </p>

              <ul className="space-y-3 pt-2 text-sm text-[#0F172A]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>List catalog offerings with verified technical monographs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Receive high-intent RFQs filtered by technical specifications</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Manage commercial negotiations and confirmed purchase orders</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Link
                href="/register/supplier"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#059669] hover:text-[#047857]"
              >
                <span>For Suppliers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
