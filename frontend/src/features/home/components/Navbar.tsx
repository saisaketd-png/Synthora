"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Hexagon } from "lucide-react";

export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "Suppliers", href: "/suppliers" },
    { name: "Solutions", href: "/industries", hasDropdown: true },
    { name: "Resources", href: "/resources" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">
        
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
            aria-label="Synthora Home"
          >
            {/* Logo Icon */}
            <div className="relative flex items-center justify-center w-8 h-8 text-[#0A192F]">
              <Hexagon className="w-8 h-8 fill-current absolute" />
              <Hexagon className="w-3.5 h-3.5 text-teal-400 absolute" strokeWidth={3} />
            </div>
            
            <span className="font-extrabold tracking-tight text-xl text-slate-900">
              Synthora
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-7" aria-label="Global Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[13px] font-semibold transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm py-1 ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                  {link.hasDropdown && <ChevronDown className="w-3 h-3 text-slate-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            href="/become-supplier"
            className="px-5 py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Become a Supplier
          </Link>
          <Link
            href="/rfq"
            className="px-5 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
          >
            Submit RFQ
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Toggle Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg absolute w-full left-0 top-20">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between"
              >
                <span>{link.name}</span>
                {link.hasDropdown && <ChevronDown className="w-4 h-4 text-slate-400" />}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3 px-2">
            <Link
              href="/become-supplier"
              onClick={() => setIsMobileOpen(false)}
              className="text-center py-3 text-sm font-bold text-slate-700 border border-slate-200 rounded-full"
            >
              Become a Supplier
            </Link>
            <Link
              href="/rfq"
              onClick={() => setIsMobileOpen(false)}
              className="text-center py-3 text-sm font-bold text-white bg-blue-600 rounded-full"
            >
              Submit RFQ
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
