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
  FlaskConical,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  ShoppingBag,
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { SynthoraLogo } from "@/shared/components/SynthoraLogo";

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

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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

  // Role subtitle
  const roleSubtitle = isAdmin
    ? "ADMIN OPERATIONS"
    : isSupplier
    ? "SUPPLIER OPERATIONS"
    : isBuyer
    ? "BUYER PROCUREMENT"
    : "B2B CHEMICALS";

  const publicNavLinks = [
    { name: "Chemical Catalog", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "Suppliers", href: "/suppliers" },
    { name: "Resources", href: "/resources" },
  ];

  const userDisplayName = user?.email ? user.email.split("@")[0] : "Account";
  const avatarLetter = userDisplayName.charAt(0).toUpperCase();
  const rfqHref = user?.role === "BUYER" ? "/dashboard/rfqs" : "/products";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#DFE1E6] h-[66px] shadow-2xs flex items-center">
      <div className="max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3 lg:gap-5">
        
        {/* 1. LEFT: SYNTHORA BRAND & PRIMARY NAV */}
        <div className="flex items-center gap-5 lg:gap-6 shrink-0">
          <SynthoraLogo
            href="/"
            size="md"
            subtitle={roleSubtitle}
            className="w-[170px] shrink-0"
          />

          {/* Primary Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Global Navigation">
            {publicNavLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-[13px] font-bold transition-all ${
                    isActive
                      ? "bg-[#DEEBFF] text-[#0052CC]"
                      : "text-[#42526E] hover:bg-[#EBECF0] hover:text-[#091E42]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. CENTER: GLOBAL SEARCH (MAX 520px) */}
        <div className="flex-1 max-w-[520px] mx-auto hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6C84]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by chemical name, CAS, formula or category..."
              className="w-full h-[42px] pl-9 pr-3 text-xs sm:text-[13px] bg-[#FAFBFC] hover:bg-white focus:bg-white border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] transition-all text-[#091E42] placeholder:text-[#5E6C84] font-medium shadow-2xs"
            />
          </form>
        </div>

        {/* 3. RIGHT: ACTIONS, NOTIFICATIONS & USER WORKSPACE TRIGGER */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Request Quote Button (40px) */}
          <Link
            href={rfqHref}
            className="hidden sm:inline-flex items-center gap-1.5 h-[40px] px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs sm:text-[13px] font-bold rounded-lg transition-all shadow-2xs active:scale-[0.99]"
          >
            <span>Request Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Compact Notifications Bell (38px Square) */}
          {mounted && user && (
            <div className="flex items-center">
              <NotificationBell isSupplier={isSupplier} />
            </div>
          )}

          {/* Compact User Workspace Trigger */}
          {mounted && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`h-[40px] px-2.5 rounded-lg border transition-all flex items-center gap-2.5 bg-white hover:bg-[#FAFBFC] shadow-2xs focus:outline-none w-[160px] sm:w-[170px] ${
                  isUserMenuOpen ? "border-[#0052CC] ring-1 ring-[#0052CC]/20" : "border-[#DFE1E6]"
                }`}
                aria-expanded={isUserMenuOpen}
              >
                {/* Avatar Initial (28px) */}
                <div className="w-7 h-7 rounded-md bg-[#DEEBFF] text-[#0747A6] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                  {avatarLetter}
                </div>

                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#091E42] leading-tight truncate w-full">
                    {userDisplayName}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#5E6C84] uppercase">
                    {user.role}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-[#5E6C84] shrink-0 transition-transform duration-150 ${isUserMenuOpen ? "rotate-180 text-[#0052CC]" : ""}`} />
              </button>

              {/* Compact Professional User Dropdown (270px) */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-[270px] bg-white rounded-xl border border-[#DFE1E6] shadow-lg p-1.5 z-50 text-xs font-medium divide-y divide-[#DFE1E6] animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Compact Header (Height ~70px) */}
                  <div className="p-2.5 bg-[#FAFBFC] rounded-lg mb-1 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-[#DEEBFF] text-[#0747A6] font-bold text-sm flex items-center justify-center font-mono shrink-0">
                        {avatarLetter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#091E42] block truncate">
                          {userDisplayName}
                        </span>
                        <span className="text-[11px] text-[#5E6C84] block truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="pt-0.5 flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-[#0747A6] bg-[#DEEBFF] px-1.5 py-0.2 rounded uppercase">
                        {user.role}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006644] bg-[#E3FCEF] border border-[#ABF5D1] px-1.5 py-0.2 rounded">
                        <ShieldCheck className="w-3 h-3 text-[#00875A]" /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Workspace Actions (Role-Tailored, 38px Items) */}
                  <div className="py-1 space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#5E6C84] px-2.5 py-0.5 block">
                      Workspace
                    </span>

                    {/* Buyer Navigation Items */}
                    {isBuyer && (
                      <>
                        <Link
                          href="/dashboard/buyer"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Procurement Desk</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Manage sourcing activity</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/rfqs"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">My Sourcing RFQs</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Track quotation requests</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/orders"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Purchase Orders</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Track active orders</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/buyer/shortlist"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bookmark className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Saved Shortlists</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Saved supplier offerings</span>
                          </div>
                        </Link>
                      </>
                    )}

                    {/* Supplier Navigation Items */}
                    {isSupplier && (
                      <>
                        <Link
                          href="/dashboard/supplier"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Supplier Operations</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Commercial dashboard</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/supplier/products"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Package className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Product Offerings</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Catalog & inventory</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/supplier/rfqs"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">RFQ Inquiries</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Incoming quote requests</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/supplier/orders"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Purchase Orders</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Active order fulfillment</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/supplier/verification"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00875A] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Verification Status</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">KYC & documents</span>
                          </div>
                        </Link>
                      </>
                    )}

                    {/* Admin Navigation Items */}
                    {isAdmin && (
                      <>
                        <Link
                          href="/dashboard/admin/operations"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Operations Console</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Marketplace metrics</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/admin/catalog"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Layers className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Master Catalog</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Chemical monographs</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/admin/suppliers/quality"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00875A] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Supplier Verification</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Quality audits & KYC</span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/admin/transactions/rfqs"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Transactions & RFQs</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Inquiries & orders</span>
                          </div>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[#DE350B] hover:bg-[#FFEBE6] rounded-lg transition-colors text-left font-semibold text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : mounted ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="h-[38px] px-3.5 text-xs font-semibold text-[#091E42] hover:bg-[#F4F5F7] rounded-lg border border-[#DFE1E6] transition-all flex items-center justify-center shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="h-[38px] px-4 text-xs font-bold text-white bg-[#091E42] hover:bg-[#172B4D] rounded-lg transition-all flex items-center justify-center shadow-2xs"
              >
                Register
              </Link>
            </div>
          ) : null}

          {/* Mobile Drawer Toggle */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="h-[38px] w-[38px] flex items-center justify-center rounded-lg border border-[#DFE1E6] bg-white text-[#091E42] hover:bg-[#FAFBFC]"
              aria-label="Toggle mobile menu"
            >
              {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[66px] z-40 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-[280px] h-[calc(100vh-66px)] p-5 overflow-y-auto space-y-5 shadow-2xl">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#5E6C84] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chemicals, CAS, formula..."
                className="w-full h-10 pl-8 pr-3 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC]"
              />
            </form>

            <div className="space-y-1 border-b border-[#DFE1E6] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1.5">
                Marketplace
              </span>
              {publicNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#091E42] hover:bg-[#F4F5F7]"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-1">
              <Link
                href={rfqHref}
                className="w-full h-10 bg-[#0052CC] text-white text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 shadow-xs"
                onClick={() => setIsMobileOpen(false)}
              >
                <span>Request Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
