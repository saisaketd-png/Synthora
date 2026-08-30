import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Building2 } from "lucide-react";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";

export function Footer() {
  return (
    <footer className="bg-[#0A192F] text-slate-300 pt-16 pb-12 text-sm border-t border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Brand & Enterprise Procurement Contacts (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <KemKendraLogo
              href="/"
              variant="dark"
              size="lg"
              subtitle="Enterprise Chemical Sourcing"
            />

            <p className="text-slate-400 leading-relaxed max-w-sm text-sm">
              Enterprise B2B Marketplace for APIs, Pharmaceutical Intermediates, Solvents, & Specialty Chemicals. Connecting verified chemical manufacturers and institutional buyers worldwide.
            </p>

            {/* Procurement & Onboarding Contact Panel */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Procurement & Onboarding Support</span>
              </div>
              <div className="space-y-2 text-slate-400 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Procurement Desk: +1 (800) 555-SYNTH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Supplier Relations: suppliers@kemkendra.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>HQ: 400 Pharma Tech Blvd, Boston, MA 02110</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Columns (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Column 1: Chemical Catalog */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                Catalog & Sourcing
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <Link href="/products" className="hover:text-teal-400 transition-colors">
                    All Chemical Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=API" className="hover:text-teal-400 transition-colors">
                    Active APIs
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=INTERMEDIATE" className="hover:text-teal-400 transition-colors">
                    Intermediates
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=SOLVENT" className="hover:text-teal-400 transition-colors">
                    Solvents & Reagents
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=SPECIALTY_CHEMICAL" className="hover:text-teal-400 transition-colors">
                    Specialty Chemicals
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Classifications */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                Classifications
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <Link href="/categories" className="hover:text-teal-400 transition-colors">
                    Category Directory
                  </Link>
                </li>
                <li>
                  <Link href="/suppliers" className="hover:text-teal-400 transition-colors">
                    Verified Suppliers
                  </Link>
                </li>
                <li>
                  <Link href="/industries" className="hover:text-teal-400 transition-colors">
                    Industry Solutions
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-teal-400 transition-colors">
                    Technical Specifications
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Sourcing & Governance */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                Sourcing & Trade
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <Link href="/register" className="hover:text-teal-400 transition-colors">
                    Buyer Registration
                  </Link>
                </li>
                <li>
                  <Link href="/register/supplier" className="hover:text-teal-400 transition-colors">
                    Become a Supplier
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-teal-400 transition-colors">
                    Account Login
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-teal-400 transition-colors">
                    Quality Documentation (COA/MSDS)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Platform & Legal */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                Compliance & Trust
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <Link href="/resources" className="hover:text-teal-400 transition-colors">
                    Compliance Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-teal-400 transition-colors">
                    Export Readiness
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-teal-400 transition-colors">
                    Security Architecture
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-teal-400 transition-colors">
                    Audit Verification
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>© {new Date().getFullYear()} KemKendra Enterprise B2B Marketplace Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/resources" className="hover:text-white transition-colors">
              Privacy Standards
            </Link>
            <Link href="/resources" className="hover:text-white transition-colors">
              Terms of Procurement
            </Link>
            <Link href="/resources" className="hover:text-white transition-colors">
              Security Specifications
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
