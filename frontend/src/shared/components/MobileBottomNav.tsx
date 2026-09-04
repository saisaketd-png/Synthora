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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4E4E7] h-[58px] shadow-tactile-card flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
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
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-[6px] transition-all ${
                isActive ? "text-[#0052CC]" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 ${
                  isActive ? "font-semibold text-[#0052CC]" : "font-medium text-[#64748B]"
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
            <div className="p-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[6px] bg-[#EFF6FF] text-[#0052CC] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <strong className="text-sm font-semibold text-[#0F172A] block truncate">
                    {userDisplayName}
                  </strong>
                  <span className="text-[10px] font-mono font-semibold text-[#0052CC] uppercase">
                    {user?.role} WORKSPACE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-[6px] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 p-3 overflow-y-auto space-y-4">
              {/* Buyer Links */}
              {isBuyer && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                    Procurement Operations
                  </span>
                  <Link
                    href="/dashboard/buyer"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0052CC]" />
                    <span>Procurement Desk</span>
                  </Link>
                  <Link
                    href="/dashboard/rfqs"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <FileText className="w-4 h-4 text-[#0052CC]" />
                    <span>My Sourcing RFQs</span>
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0052CC]" />
                    <span>Purchase Orders</span>
                  </Link>
                  <Link
                    href="/dashboard/buyer/shortlist"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Bookmark className="w-4 h-4 text-[#0052CC]" />
                    <span>Saved Shortlists</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
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
                  <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                    Supplier Operations
                  </span>
                  <Link
                    href="/dashboard/supplier"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0052CC]" />
                    <span>Supplier Operations</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/products"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Package className="w-4 h-4 text-[#0052CC]" />
                    <span>Product Offerings</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/rfqs"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <FileText className="w-4 h-4 text-[#0052CC]" />
                    <span>RFQ Inquiries</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/orders"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0052CC]" />
                    <span>Purchase Orders</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/profile"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Building2 className="w-4 h-4 text-[#0052CC]" />
                    <span>Company Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/supplier/verification"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>Compliance & Verification</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-[#0052CC]" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold font-mono bg-[#0052CC] text-white rounded-[4px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Admin Links */}
              {isAdmin && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
                    Administration
                  </span>
                  <Link
                    href="/dashboard/admin/operations"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0052CC]" />
                    <span>Operations Console</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/catalog"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Layers className="w-4 h-4 text-[#0052CC]" />
                    <span>Master Catalog</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/suppliers"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Building2 className="w-4 h-4 text-[#0052CC]" />
                    <span>Supplier Moderation</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/suppliers/quality"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>Supplier Verification</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/users"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Users className="w-4 h-4 text-[#0052CC]" />
                    <span>User Management</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/transactions/rfqs"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <FileText className="w-4 h-4 text-[#0052CC]" />
                    <span>RFQ Oversight</span>
                  </Link>
                  <Link
                    href="/dashboard/admin/transactions/orders"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0052CC]" />
                    <span>Order Oversight</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-[#0052CC]" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold font-mono bg-[#0052CC] text-white rounded-[4px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard/admin/activity"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                  >
                    <Activity className="w-4 h-4 text-[#0052CC]" />
                    <span>Audit Logs</span>
                  </Link>
                </div>
              )}

              {/* Public Marketplace Quick Navigation */}
              <div className="space-y-1 pt-2 border-t border-[#E4E4E7]">
                <span className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                  Public Marketplace
                </span>
                <Link
                  href="/products"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                >
                  <FlaskConical className="w-4 h-4 text-[#0052CC]" />
                  <span>Chemical Catalog</span>
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                >
                  <Layers className="w-4 h-4 text-[#0052CC]" />
                  <span>Categories</span>
                </Link>
                <Link
                  href="/suppliers"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#FAFAFA] rounded-[6px]"
                >
                  <Building2 className="w-4 h-4 text-[#0052CC]" />
                  <span>Verified Suppliers</span>
                </Link>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="p-3 border-t border-[#E4E4E7] bg-[#FAFAFA]">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 h-9 px-4 text-[#DC2626] hover:bg-[#FEF2F2] bg-white border border-[#E4E4E7] rounded-[6px] font-semibold text-xs transition-colors cursor-pointer shadow-xs"
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
