"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Hexagon,
  LogOut,
  FileText,
  Package,
  User as UserIcon,
  Shield,
  Building2
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";

export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const currentUser = getAuthUser();
    setUser(currentUser);

    const handleAuthChange = () => {
      setUser(getAuthUser());
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    logout();
    setUser(null);
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const isSupplier = user?.role === "SUPPLIER";

  const publicNavLinks = [
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "Suppliers", href: "/suppliers" },
    { name: "Solutions", href: "/industries" },
    { name: "Resources", href: "/resources" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">
        
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8 lg:gap-10">
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
          <nav className="hidden lg:flex items-center space-x-6" aria-label="Global Navigation">
            {publicNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[13px] font-semibold transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm py-1 ${
                    isActive
                      ? "text-blue-600 font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Authenticated Workspace Links on Desktop */}
            {mounted && user && (
              <div className="flex items-center space-x-4 pl-3 border-l border-slate-200">
                {isSupplier ? (
                  <>
                    <Link
                      href="/dashboard/supplier/rfqs"
                      className={`text-[13px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        pathname.startsWith("/dashboard/supplier/rfqs")
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      RFQ Inbox
                    </Link>
                    <Link
                      href="/dashboard/supplier/orders"
                      className={`text-[13px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        pathname.startsWith("/dashboard/supplier/orders")
                          ? "bg-teal-50 text-[#17B5AE]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 text-[#17B5AE]" />
                      Orders
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/rfqs"
                      className={`text-[13px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        pathname.startsWith("/dashboard/rfqs")
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      My RFQs
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      className={`text-[13px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        pathname.startsWith("/dashboard/orders")
                          ? "bg-teal-50 text-[#17B5AE]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 text-[#17B5AE]" />
                      Orders
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right: Actions / Auth State */}
        <div className="hidden sm:flex items-center space-x-3">
          {mounted && user ? (
            <div className="flex items-center space-x-3">
              {/* Submit RFQ CTA for Buyers */}
              {!isSupplier && (
                <Link
                  href="/products"
                  className="px-4 py-2 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm shadow-blue-600/20"
                >
                  Submit RFQ
                </Link>
              )}

              {/* User Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 transition-all text-left"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSupplier ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                      {user.email.split("@")[0]}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                      {isSupplier ? "Supplier" : "Buyer"}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.email}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${
                        isSupplier
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        <Shield className="w-2.5 h-2.5" />
                        {isSupplier ? "Supplier Workspace" : "Buyer Workspace"}
                      </span>
                    </div>

                    <div className="py-1">
                      {isSupplier ? (
                        <>
                          <Link
                            href="/dashboard/supplier"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                            Supplier Overview
                          </Link>
                          <Link
                            href="/dashboard/supplier/rfqs"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                            RFQ Inbox
                          </Link>
                          <Link
                            href="/dashboard/supplier/orders"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Package className="w-4 h-4 text-[#17B5AE]" />
                            Incoming Orders
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Shield className="w-4 h-4 text-blue-600" />
                            Buyer Overview
                          </Link>
                          <Link
                            href="/dashboard/rfqs"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                            My RFQs
                          </Link>
                          <Link
                            href="/dashboard/orders"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Package className="w-4 h-4 text-[#17B5AE]" />
                            Purchase Orders
                          </Link>
                        </>
                      )}
                      <Link
                        href="/products"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Browse Chemical Catalog
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Sign In
              </Link>
              <Link
                href="/products"
                className="px-5 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
              >
                Submit RFQ
              </Link>
            </div>
          )}
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
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl absolute w-full left-0 top-20 z-50">
          {/* User Info Header in Mobile Drawer */}
          {mounted && user && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                  {user.email}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                  {isSupplier ? "Supplier Workspace" : "Buyer Workspace"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-bold text-rose-600 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}

          {/* Authenticated Workspace Links */}
          {mounted && user && (
            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Workspace
              </p>
              {isSupplier ? (
                <>
                  <Link
                    href="/dashboard/supplier/rfqs"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 rounded-lg flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    RFQ Inbox
                  </Link>
                  <Link
                    href="/dashboard/supplier/orders"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-4 py-2.5 text-sm font-bold text-[#17B5AE] bg-teal-50 rounded-lg flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Incoming Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard/rfqs"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 rounded-lg flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    My RFQs
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-4 py-2.5 text-sm font-bold text-[#17B5AE] bg-teal-50 rounded-lg flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Purchase Orders
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Discovery Links */}
          <nav className="flex flex-col space-y-1 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Catalog & Resources
            </p>
            {publicNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between"
              >
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>

          {/* Logged-out CTA Actions */}
          {(!mounted || !user) && (
            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3 px-2">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="text-center py-3 text-sm font-bold text-slate-700 border border-slate-200 rounded-full"
              >
                Sign In
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileOpen(false)}
                className="text-center py-3 text-sm font-bold text-white bg-blue-600 rounded-full"
              >
                Submit RFQ
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
