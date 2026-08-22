"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FlaskConical,
  Layers,
  Building2,
  User,
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Package,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Bookmark,
  Bell,
  Activity,
  Users,
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/useUnreadNotificationCount";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const { unreadCount } = useUnreadNotificationCount();

  useEffect(() => {
    setMounted(true);
    setUser(getAuthUser());

    const handleAuth = () => setUser(getAuthUser());
    window.addEventListener("auth-changed", handleAuth);
    window.addEventListener("storage", handleAuth);

    return () => {
      window.removeEventListener("auth-changed", handleAuth);
      window.removeEventListener("storage", handleAuth);
    };
  }, []);

  // Close drawer on path change
  useEffect(() => {
    setMoreDrawerOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const isAdmin = user?.role === "ADMIN";
  const isSupplier = !isAdmin && user?.role === "SUPPLIER";
  const isBuyer = !isAdmin && !isSupplier && user !== null;

  const handleSignOut = () => {
    logout();
    setUser(null);
    setMoreDrawerOpen(false);
    window.location.href = "/";
  };

  // Define 5 Core Bottom Tabs based on Role
  const tabs = isAdmin
    ? [
        { label: "Console", href: "/dashboard/admin/operations", icon: LayoutDashboard },
        { label: "Catalog", href: "/dashboard/admin/catalog", icon: Layers },
        { label: "Quality", href: "/dashboard/admin/suppliers/quality", icon: ShieldCheck },
        { label: "RFQs", href: "/dashboard/admin/transactions/rfqs", icon: FileText },
      ]
    : isSupplier
    ? [
        { label: "Console", href: "/dashboard/supplier", icon: LayoutDashboard },
        { label: "Products", href: "/dashboard/supplier/products", icon: Package },
        { label: "RFQs", href: "/dashboard/supplier/rfqs", icon: FileText },
        { label: "Orders", href: "/dashboard/supplier/orders", icon: ShoppingBag },
      ]
    : isBuyer
    ? [
        { label: "Desk", href: "/dashboard/buyer", icon: LayoutDashboard },
        { label: "RFQs", href: "/dashboard/rfqs", icon: FileText },
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
        { label: "Catalog", href: "/products", icon: FlaskConical },
      ]
    : [
        { label: "Home", href: "/", icon: Home },
        { label: "Catalog", href: "/products", icon: FlaskConical },
        { label: "Categories", href: "/categories", icon: Layers },
        { label: "Suppliers", href: "/suppliers", icon: Building2 },
      ];

  const userDisplayName = user?.email ? user.email.split("@")[0] : "Account";

  return (
    <>
      {/* 1. FIXED MOBILE BOTTOM NAVIGATION BAR (Height 58px) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DFE1E6] h-[58px] shadow-lg flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile Bottom Navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== "/dashboard" && tab.href !== "/dashboard/admin");

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-all ${
                isActive ? "text-[#0052CC]" : "text-[#5E6C84] hover:text-[#091E42]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 ${
                  isActive ? "font-bold text-[#0052CC]" : "font-medium text-[#5E6C84]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: User Account / More Menu */}
        {user ? (
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-all relative ${
              moreDrawerOpen ? "text-[#0052CC]" : "text-[#5E6C84] hover:text-[#091E42]"
            }`}
            aria-label="Open Workspace Menu"
          >
            <div className="relative">
              <div className="w-5 h-5 rounded-md bg-[#DEEBFF] text-[#0747A6] font-bold text-[10px] flex items-center justify-center font-mono">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0052CC] ring-1 ring-white"
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                moreDrawerOpen ? "font-bold text-[#0052CC]" : "font-medium text-[#5E6C84]"
              }`}
            >
              Workspace
            </span>
          </button>
        ) : (
          <Link
            href="/login"
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-all ${
              pathname === "/login" ? "text-[#0052CC]" : "text-[#5E6C84] hover:text-[#091E42]"
            }`}
          >
            <User className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] font-medium text-[#5E6C84] mt-0.5">Sign In</span>
          </Link>
        )}
      </nav>

      {/* 2. MORE / WORKSPACE MOBILE DRAWER */}
      {moreDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="bg-white w-[300px] max-w-[85vw] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#DEEBFF] text-[#0747A6] font-bold text-sm flex items-center justify-center font-mono shrink-0">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <strong className="text-sm text-[#091E42] block truncate">
                    {userDisplayName}
                  </strong>
                  <span className="text-[10px] font-mono font-bold text-[#0052CC] uppercase">
                    {user?.role} WORKSPACE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#091E42] rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 p-3 overflow-y-auto space-y-4">
              {/* Buyer Links */}
              {isBuyer && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                    Procurement Operations
                  </span>
                  <Link
                    href="/dashboard/buyer"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0052CC]" />
                    <span>Procurement Desk</span>
                  </Link>
                  <Link
                    href="/dashboard/rfqs"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <FileText className="w-4 h-4 text-[#0052CC]" />
                    <span>My Sourcing RFQs</span>
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0052CC]" />
                    <span>Purchase Orders</span>
                  </Link>
                  <Link
                    href="/dashboard/buyer/shortlist"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Bookmark className="w-4 h-4 text-[#0052CC]" />
                    <span>Saved Shortlists</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-[#0052CC]" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold font-mono bg-[#0052CC] text-white rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Supplier Links */}
              {isSupplier && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                    Supplier Operations
                  </span>
                  <Link
                    href="/dashboard/supplier"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0052CC]" />
                    <span>Supplier Operations</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/products"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Package className="w-4 h-4 text-[#0052CC]" />
                    <span>Product Offerings</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/rfqs"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <FileText className="w-4 h-4 text-[#0052CC]" />
                    <span>RFQ Inquiries</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/orders"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0052CC]" />
                    <span>Purchase Orders</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/profile"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Building2 className="w-4 h-4 text-[#0052CC]" />
                    <span>Company Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/verification"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#00875A]" />
                    <span>Compliance & Verification</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-[#0052CC]" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold font-mono bg-[#0052CC] text-white rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Admin Links */}
              {isAdmin && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                    Administration
                  </span>
                  <Link
                    href="/dashboard/admin/operations"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0052CC]" />
                    <span>Operations Console</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/catalog"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Layers className="w-4 h-4 text-[#0052CC]" />
                    <span>Master Catalog</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/suppliers"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Building2 className="w-4 h-4 text-[#0052CC]" />
                    <span>Supplier Moderation</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/suppliers/quality"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#00875A]" />
                    <span>Supplier Verification</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/users"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Users className="w-4 h-4 text-[#0052CC]" />
                    <span>User Management</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/transactions/rfqs"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <FileText className="w-4 h-4 text-[#0052CC]" />
                    <span>RFQ Oversight</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/transactions/orders"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0052CC]" />
                    <span>Order Oversight</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-[#0052CC]" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold font-mono bg-[#0052CC] text-white rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard/admin/activity"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                  >
                    <Activity className="w-4 h-4 text-[#0052CC]" />
                    <span>Audit Logs</span>
                  </Link>
                </div>
              )}

              {/* Public Marketplace Quick Navigation */}
              <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                  Public Marketplace
                </span>
                <Link
                  href="/products"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                >
                  <FlaskConical className="w-4 h-4 text-[#0052CC]" />
                  <span>Chemical Catalog</span>
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                >
                  <Layers className="w-4 h-4 text-[#0052CC]" />
                  <span>Categories</span>
                </Link>
                <Link
                  href="/suppliers"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] rounded-xl"
                >
                  <Building2 className="w-4 h-4 text-[#0052CC]" />
                  <span>Verified Suppliers</span>
                </Link>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 h-11 px-4 text-[#DE350B] hover:bg-[#FFEBE6] bg-white border border-[#FFBDAD] rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
