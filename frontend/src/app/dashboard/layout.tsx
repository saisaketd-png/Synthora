"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Building2,
  Users,
  ShoppingCart,
  LogOut,
  Shield,
  ChevronRight,
  Menu,
  X,
  Hexagon,
  Bell,
  PlusCircle,
  FlaskConical,
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
  isExternal?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Admin Route Protection Guard
    if (pathname.startsWith("/dashboard/admin") && currentUser.role !== "ADMIN") {
      if (currentUser.role === "SUPPLIER") {
        router.push("/dashboard/supplier");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    setUser(currentUser);

    const handleAuthChange = () => {
      const updated = getAuthUser();
      if (!updated) {
        router.push("/login");
      } else {
        // Re-check admin route guard on auth change
        if (pathname.startsWith("/dashboard/admin") && updated.role !== "ADMIN") {
          if (updated.role === "SUPPLIER") {
            router.push("/dashboard/supplier");
          } else {
            router.push("/dashboard");
          }
          return;
        }
        setUser(updated);
      }
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [router, pathname]);

  // Close mobile sidebar on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN" || pathname.startsWith("/dashboard/admin");
  const isSupplier = !isAdmin && (user.role === "SUPPLIER" || pathname.startsWith("/dashboard/supplier"));

  const buyerNavItems: NavItem[] = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "My RFQs",
      href: "/dashboard/rfqs",
      icon: FileText,
      badge: "Inquiries",
    },
    {
      name: "Purchase Orders",
      href: "/dashboard/orders",
      icon: Package,
      badge: "POs",
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: "Alerts",
    },
    {
      name: "Chemical Catalog",
      href: "/products",
      icon: Building2,
      isExternal: true,
    },
  ];

  const supplierNavItems: NavItem[] = [
    {
      name: "Overview",
      href: "/dashboard/supplier",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Product Inventory",
      href: "/dashboard/supplier/products",
      icon: Package,
      badge: "Chemicals",
    },
    {
      name: "RFQ Inbox",
      href: "/dashboard/supplier/rfqs",
      icon: FileText,
      badge: "Quotes",
    },
    {
      name: "Incoming Orders",
      href: "/dashboard/supplier/orders",
      icon: ShoppingCart,
      badge: "POs",
    },
    {
      name: "Company Profile",
      href: "/dashboard/supplier/profile",
      icon: Building2,
      badge: "Profile",
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: "Alerts",
    },
    {
      name: "Chemical Catalog",
      href: "/products",
      icon: FlaskConical,
      isExternal: true,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      name: "Overview",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Master Catalog",
      href: "/dashboard/admin/catalog",
      icon: FlaskConical,
      badge: "Canonical",
    },
    {
      name: "User Management",
      href: "/dashboard/admin/users",
      icon: Users,
      badge: "Accounts",
    },
    {
      name: "Supplier Moderation",
      href: "/dashboard/admin/suppliers",
      icon: Building2,
      badge: "Verification",
    },
    {
      name: "Legacy Products",
      href: "/dashboard/admin/products",
      icon: Package,
      badge: "Legacy",
    },
    {
      name: "RFQ Oversight",
      href: "/dashboard/admin/transactions/rfqs",
      icon: FileText,
      badge: "Quotes",
    },
    {
      name: "Order Oversight",
      href: "/dashboard/admin/transactions/orders",
      icon: ShoppingCart,
      badge: "POs",
    },
    {
      name: "Platform Alerts",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: "Alerts",
    },
  ];

  const navItems = isAdmin
    ? adminNavItems
    : isSupplier
    ? supplierNavItems
    : buyerNavItems;

  const roleBadgeStyle = isAdmin
    ? "bg-amber-50 text-amber-800 border-amber-300"
    : isSupplier
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  const roleLabel = isAdmin
    ? "Admin Workspace"
    : isSupplier
    ? "Supplier Workspace"
    : "Buyer Workspace";

  const avatarStyle = isAdmin
    ? "bg-amber-100 text-amber-800"
    : isSupplier
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-100 text-blue-700";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased font-sans">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Sidebar Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-7 h-7 text-[#0A192F]">
              <Hexagon className="w-7 h-7 fill-current absolute" />
              <Hexagon className="w-3 h-3 text-teal-400 absolute" strokeWidth={3} />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Synthora
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleBadgeStyle}`}
            >
              <Shield className="w-3.5 h-3.5" />
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Direct Catalog Sourcing Link */}
          <Link
            href="/products"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            Chemical Catalog
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Live Notification Bell */}
          <NotificationBell isSupplier={isSupplier} />

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${avatarStyle}`}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate leading-none">
                {user.email.split("@")[0]}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                {isAdmin ? "Admin" : isSupplier ? "Supplier" : "Buyer"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Sign Out"
            aria-label="Sign Out of Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200/80 p-4 space-y-6 flex-shrink-0">
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Workspace Navigation
            </p>
            <nav className="space-y-1 pt-2" aria-label="Sidebar Navigation">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href) && (!item.isExternal || pathname === item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? isAdmin
                          ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs"
                          : isSupplier
                          ? "bg-purple-50 text-purple-700 border border-purple-200 font-bold shadow-2xs"
                          : "bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`w-4 h-4 ${
                          isActive
                            ? isAdmin
                              ? "text-amber-700"
                              : isSupplier
                              ? "text-purple-600"
                              : "text-blue-600"
                            : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <p className="text-xs font-bold text-slate-800">
                {isAdmin ? "Governance Portal" : "Need Procurement Help?"}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isAdmin
                  ? "All actions are recorded to the immutable audit log."
                  : "Connect with chemical sourcing support for inquiries."}
              </p>
              {!isAdmin && (
                <Link
                  href="/resources"
                  className="pt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Procurement Guide <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="w-72 bg-white h-full p-5 space-y-6 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {roleLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href) && (!item.isExternal || pathname === item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all min-h-[44px] ${
                        isActive
                          ? isAdmin
                            ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold"
                            : isSupplier
                            ? "bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                            : "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
