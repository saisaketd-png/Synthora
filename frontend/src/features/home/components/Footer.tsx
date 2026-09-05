import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-[#94A3B8] pt-12 pb-10 text-xs border-t border-[#1E293B]">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 12-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#1E293B]">
          
          {/* Column 1 (4 cols): Brand identity & direct procurement contact channels */}
          <div className="lg:col-span-4 space-y-4">
            <KemKendraLogo
              href="/"
              variant="dark"
              size="md"
              subtitle="Enterprise Chemical Sourcing"
            />

            <p className="text-[#94A3B8] leading-relaxed max-w-sm text-xs">
              Enterprise B2B digital exchange for compendial APIs, pharmaceutical intermediates, laboratory solvents, and specialty chemicals. Connecting audited manufacturers and institutional buyers worldwide.
            </p>

            {/* Procurement Desk - Clean integrated typographic layout */}
            <div className="pt-2 space-y-2 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                <a href="tel:+917676447077" className="hover:text-white transition-colors">
                  +91 7676447077
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                <a href="mailto:kemkendra1@gmail.com" className="hover:text-white transition-colors">
                  kemkendra1@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                <span>Bengaluru, Karnataka</span>
              </div>
            </div>
          </div>

          {/* Navigation Columns (8 cols, 4 sub-columns) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            
            {/* Column 1: Marketplace */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                Marketplace
              </h3>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    Browse Chemicals
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=API" className="hover:text-white transition-colors">
                    Active Ingredients (APIs)
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=INTERMEDIATE" className="hover:text-white transition-colors">
                    Pharma Intermediates
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=SOLVENT" className="hover:text-white transition-colors">
                    Solvents & Reagents
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-white transition-colors">
                    Chemical Categories
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Buyers */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                For Buyers
              </h3>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Create Buyer Account
                  </Link>
                </li>
                <li>
                  <Link href="/rfq" className="hover:text-white transition-colors">
                    Submit Sourcing RFQ
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Procurement Desk
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    Specification Guides
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Suppliers */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                For Suppliers
              </h3>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>
                  <Link href="/register/supplier" className="hover:text-white transition-colors">
                    Sell on KemKendra
                  </Link>
                </li>
                <li>
                  <Link href="/register/supplier" className="hover:text-white transition-colors">
                    Supplier Registration
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Supplier Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    Compliance Verification
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Company & Trust */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                Company & Trust
              </h3>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About KemKendra
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Helpdesk
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    Compliance & COA Guides
                  </Link>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Legal Copyright Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[#64748B] gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>© {new Date().getFullYear()} KemKendra Enterprise B2B Marketplace Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              About Us
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Contact Desk
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
