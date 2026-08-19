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
  Shield,
  Building2,
  Search,
  PlusCircle,
  Users,
  LayoutDashboard,
  Layers,
  HelpCircle,
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileOpen(false);
    }
  };

  const handleSignOut = () => {
    logout();
    setUser(null);
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const isAdmin = user?.role === "ADMIN";
  const isSupplier = !isAdmin && user?.role === "SUPPLIER";
  const isBuyer = !isAdmin && !isSupplier && user !== null;

  const publicNavLinks = [
    { name: "Chemical Catalog", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "Suppliers", href: "/suppliers" },
    { name: "Industries", href: "/industries" },
    { name: "Resources", href: "/resources" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs h-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Left: Brand Logo & Main Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg shrink-0"
            aria-label="Synthora B2B Marketplace"
          >
            {/* Architectural Hexagon Logo */}
            <div className="relative flex items-center justify-center w-8 h-8 text-[#0A192F]">
              <Hexagon className="w-8 h-8 fill-current absolute" />
              <Hexagon className="w-3.5 h-3.5 text-teal-400 absolute" strokeWidth={3} />
            </div>
            
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-xl text-slate-900 leading-none">
                Synthora
              </span>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                B2B Chemicals
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Global Navigation">
            {publicNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? "text-blue-600 font-bold bg-blue-50/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Global Chemical Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by chemical name, CAS, or product code..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </form>
        </div>

        {/* Right: Actions / Role-Aware Auth State */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {mounted && user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Quick Action Trigger based on Role */}
              {isBuyer && (
                <Link
                  href="/products"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Submit RFQ
                </Link>
              )}

              {isSupplier && (
                <Link
                  href="/dashboard/supplier/products/new"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0A192F] hover:bg-slate-800 rounded-xl transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Product
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-xl transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Desk
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBell isSupplier={isSupplier} />

              {/* User Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/90 transition-all text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isAdmin
                        ? "bg-amber-100 text-amber-800"
                        : isSupplier
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">
                      {user.email.split("@")[0]}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      {isAdmin ? "Admin" : isSupplier ? "Supplier" : "Buyer"}
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
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${
                          isAdmin
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : isSupplier
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {isAdmin
                          ? "Admin Governance"
                          : isSupplier
                          ? "Supplier Workspace"
                          : "Buyer Workspace"}
                      </span>
                    </div>

                    <div className="py-1">
                      {isAdmin ? (
                        <>
                          <Link
                            href="/dashboard/admin"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-600" />
                            Admin Overview
                          </Link>
                          <Link
                            href="/dashboard/admin/users"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Users className="w-4 h-4 text-blue-600" />
                            User Management
                          </Link>
                          <Link
                            href="/dashboard/admin/suppliers"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Building2 className="w-4 h-4 text-purple-600" />
                            Supplier Moderation
                          </Link>
                          <Link
                            href="/dashboard/admin/products"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Package className="w-4 h-4 text-emerald-600" />
                            Product Catalog
                          </Link>
                        </>
                      ) : isSupplier ? (
                        <>
                          <Link
                            href="/dashboard/supplier"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <LayoutDashboard className="w-4 h-4 text-purple-600" />
                            Supplier Overview
                          </Link>
                          <Link
                            href="/dashboard/supplier/products"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Package className="w-4 h-4 text-emerald-600" />
                            Product Inventory
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
                            <Package className="w-4 h-4 text-teal-600" />
                            Incoming Orders
                          </Link>
                          <Link
                            href="/dashboard/supplier/profile"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Building2 className="w-4 h-4 text-slate-600" />
                            Company Profile
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
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
                            <Package className="w-4 h-4 text-teal-600" />
                            Purchase Orders
                          </Link>
                        </>
                      )}
                      <Link
                        href="/products"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-t border-slate-100"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Chemical Directory
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
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register/supplier"
                className="hidden lg:inline-flex px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border border-purple-200"
              >
                Become a Supplier
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-[#0A192F] hover:bg-slate-800 rounded-xl transition-all shadow-xs"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <div className="flex xl:hidden items-center">
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide Drawer */}
      {isMobileOpen && (
        <div className="xl:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-2xl absolute w-full left-0 top-20 z-50 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chemical name, CAS, code..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-blue-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </form>

          {/* Authenticated Workspace Section */}
          {mounted && user && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                    {user.email}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    {isAdmin ? "Admin Desk" : isSupplier ? "Supplier Workspace" : "Buyer Workspace"}
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

              <div className="grid grid-cols-2 gap-2">
                {isAdmin ? (
                  <>
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/admin/users"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      Users
                    </Link>
                  </>
                ) : isSupplier ? (
                  <>
                    <Link
                      href="/dashboard/supplier"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-600" />
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/supplier/products"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-emerald-600" />
                      Products
                    </Link>
                    <Link
                      href="/dashboard/supplier/rfqs"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      RFQ Inbox
                    </Link>
                    <Link
                      href="/dashboard/supplier/orders"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-teal-600" />
                      Orders
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/rfqs"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      My RFQs
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-teal-600" />
                      Orders
                    </Link>
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-rose-600" />
                      Alerts
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Discovery Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Marketplace Navigation
            </p>
            {publicNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="px-3.5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors min-h-[44px]"
              >
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Logged-out CTA Actions */}
          {(!mounted || !user) && (
            <div className="pt-4 border-t border-slate-200 flex flex-col space-y-2.5">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="text-center py-3 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileOpen(false)}
                className="text-center py-3 text-sm font-bold text-white bg-[#0A192F] hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] flex items-center justify-center shadow-xs"
              >
                Register as Buyer
              </Link>
              <Link
                href="/register/supplier"
                onClick={() => setIsMobileOpen(false)}
                className="text-center py-3 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
              >
                Become a Verified Supplier
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
