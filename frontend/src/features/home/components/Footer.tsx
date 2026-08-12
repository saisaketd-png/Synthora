import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0B132B] text-slate-300 pt-16 pb-8 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12 border-b border-slate-800">
          {/* Brand & Procurement Contacts (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-400 text-[#0B132B] font-serif font-extrabold flex items-center justify-center text-base rounded-sm">
                S
              </div>
              <span className="text-xl font-serif font-extrabold tracking-tight text-white">
                SYNTHORA
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Global B2B Marketplace for APIs, Pharmaceutical Intermediates, Solvents, & Fine Chemicals. Built for verified enterprise procurement managers.
            </p>

            {/* Procurement & Onboarding Contact Panel */}
            <div className="p-4 bg-slate-900 rounded-sm border border-slate-800 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Procurement & Onboarding Desk</span>
              </div>
              <div className="space-y-2 text-slate-400 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Global Procurement: +1 (800) 555-SYNTH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Supplier Onboarding: suppliers@synthora.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>HQ: 400 Pharma Tech Blvd, Boston, MA 02110</span>
                </div>
              </div>
            </div>
          </div>

          {/* Links Columns (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Column 1: Marketplace */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-6">
                Marketplace
              </h3>
              <ul className="space-y-3.5 text-[13px] text-slate-400 font-medium">
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    API Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    Intermediates
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    Solvents & Reagents
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    Specialty Chemicals
                  </Link>
                </li>
                <li>
                  <Link href="/rfq" className="hover:text-white transition-colors">
                    Submit Digital RFQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-6">
                Resources
              </h3>
              <ul className="space-y-3.5 text-[13px] text-slate-400 font-medium">
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    Market Insights
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    Regulatory Updates
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    API Pricing Reports
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    COA / MSDS Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-6">
                Company
              </h3>
              <ul className="space-y-3.5 text-[13px] text-slate-400 font-medium">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Synthora
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="hover:text-white transition-colors">
                    Press & Media
                  </Link>
                </li>
                <li>
                  <Link href="/investors" className="hover:text-white transition-colors">
                    Investor Relations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-6">
                Support
              </h3>
              <ul className="space-y-3.5 text-[13px] text-slate-400 font-medium">
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white transition-colors">
                    Procurement Support
                  </Link>
                </li>
                <li>
                  <Link href="/become-supplier" className="hover:text-white transition-colors">
                    Supplier Onboarding
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>© {new Date().getFullYear()} Synthora Enterprise B2B Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Procurement
            </Link>
            <Link href="/security" className="hover:text-white transition-colors">
              Security & Audit
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
