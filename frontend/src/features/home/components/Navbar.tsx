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
import { KemKendraLogo } from "@/shared/components/KemkendraLogo";

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
    <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7] h-16 shadow-tactile-card flex items-center">
      <div className="max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3 lg:gap-5">
        
        {/* 1. LEFT: KEMKENDRA BRAND & PRIMARY NAV */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <KemKendraLogo
              href="/"
              size="md"
              layout="horizontal"
            />
            {user && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#F4F4F5] text-[#0F172A] border border-[#E4E4E7]">
                {isAdmin ? "Admin" : isSupplier ? "Supplier" : "Buyer"}
              </span>
            )}
          </div>

          {/* Primary Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Global Navigation">
            {publicNavLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#EFF6FF] text-[#0052CC] font-semibold"
                      : "text-[#475569] hover:bg-[#FAFAFA] hover:text-[#0F172A]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. CENTER: GLOBAL SEARCH (MAX 500px) */}
        <div className="flex-1 max-w-[500px] mx-auto hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chemical name, CAS, formula or category..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#FAFAFA] hover:bg-white focus:bg-white border border-[#E4E4E7] rounded-[6px] focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-colors text-[#0F172A] placeholder:text-[#94A3B8] font-normal shadow-xs"
            />
          </form>
        </div>

        {/* 3. RIGHT: ACTIONS, NOTIFICATIONS & USER WORKSPACE TRIGGER */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Request Quote Button */}
          <Link
            href={rfqHref}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs active:scale-[0.99]"
          >
            <span>Request Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Compact Notifications Bell */}
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
                className={`h-9 px-2.5 rounded-[6px] border transition-colors flex items-center gap-2 bg-white hover:bg-[#FAFAFA] shadow-xs focus:outline-none w-[150px] sm:w-[165px] ${
                  isUserMenuOpen ? "border-[#0052CC] ring-1 ring-[#0052CC]" : "border-[#E4E4E7]"
                }`}
                aria-expanded={isUserMenuOpen}
              >
                {/* Avatar Initial */}
                <div className="w-6 h-6 rounded-[4px] bg-[#EFF6FF] text-[#0052CC] font-semibold text-xs flex items-center justify-center font-mono shrink-0">
                  {avatarLetter}
                </div>

                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#0F172A] leading-tight truncate w-full">
                    {userDisplayName}
                  </span>
                  <span className="text-[9px] font-mono text-[#64748B] uppercase">
                    {user.role}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] shrink-0 transition-transform duration-150 ${isUserMenuOpen ? "rotate-180 text-[#0052CC]" : ""}`} />
              </button>

              {/* Compact Professional User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-[260px] bg-white rounded-[8px] border border-[#E4E4E7] shadow-tactile-modal p-1.5 z-50 text-xs font-normal divide-y divide-[#E4E4E7] animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Compact Header (Height ~70px) */}
                  <div className="p-2.5 bg-[#FAFAFA] rounded-[6px] mb-1 space-y-1.5 border border-[#E4E4E7]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[4px] bg-[#EFF6FF] text-[#0052CC] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                        {avatarLetter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-[#0F172A] block truncate">
                          {userDisplayName}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="pt-0.5 flex items-center justify-between">
                      <span className="text-[9px] font-mono font-semibold text-[#0052CC] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded-[4px] uppercase">
                        {user.role}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] px-1.5 py-0.2 rounded-[4px]">
                        <ShieldCheck className="w-3 h-3 text-[#059669]" /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Workspace Actions (Role-Tailored, 38px Items) */}
                  <div className="py-1 space-y-0.5">
                    <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-[#64748B] px-2.5 py-0.5 block">
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

                        <Link
                          href="/dashboard/notifications"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bell className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Notifications</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">System & order alerts</span>
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

                        <Link
                          href="/dashboard/notifications"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bell className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Notifications</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">RFQ & inquiry alerts</span>
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

                        <Link
                          href="/dashboard/notifications"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[#172B4D] hover:text-[#091E42] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bell className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs block">Notifications</span>
                            <span className="text-[10px] text-[#5E6C84] block truncate">Platform oversight alerts</span>
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
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-[6px] transition-colors text-left font-semibold text-xs cursor-pointer"
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
                className="h-9 px-3.5 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7] transition-colors flex items-center justify-center shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="h-9 px-3.5 text-xs font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] rounded-[6px] transition-colors flex items-center justify-center shadow-xs active:scale-[0.99]"
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
              className="h-9 w-9 flex items-center justify-center rounded-[6px] border border-[#E4E4E7] bg-white text-[#0F172A] hover:bg-[#FAFAFA]"
              aria-label="Toggle mobile menu"
            >
              {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-[#0F172A]/40 backdrop-blur-[2px] flex justify-end">
          <div className="bg-white w-[280px] h-[calc(100vh-64px)] p-4 overflow-y-auto space-y-4 shadow-tactile-modal border-l border-[#E4E4E7]">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chemicals, CAS, formula..."
                className="w-full h-9 pl-8 pr-3 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-[6px] focus:outline-none focus:border-[#0052CC] text-[#0F172A]"
              />
            </form>

            <div className="space-y-0.5 border-b border-[#E4E4E7] pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1 font-mono px-2">
                Marketplace
              </span>
              {publicNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA]"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-1">
              <Link
                href={rfqHref}
                className="w-full h-9 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] inline-flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99]"
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
