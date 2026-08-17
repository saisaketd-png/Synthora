"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Building2,
  LogOut,
  Shield,
  ChevronRight,
  Menu,
  X,
  Hexagon,
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";

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
    setUser(currentUser);

    const handleAuthChange = () => {
      const updated = getAuthUser();
      if (!updated) {
        router.push("/login");
      } else {
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
        <div className="w-8 h-8 border-4 border-[#17B5AE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSupplier = user.role === "SUPPLIER" || pathname.startsWith("/dashboard/supplier");

  const buyerNavItems = [
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
      badge: "Quotes",
    },
    {
      name: "Purchase Orders",
      href: "/dashboard/orders",
      icon: Package,
      badge: "POs",
    },
    {
      name: "Browse Catalog",
      href: "/products",
      icon: Building2,
      isExternal: true,
    },
  ];

  const supplierNavItems = [
    {
      name: "Overview",
      href: "/dashboard/supplier",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "RFQ Inbox",
      href: "/dashboard/supplier/rfqs",
      icon: FileText,
      badge: "Inquiries",
    },
    {
      name: "Incoming Orders",
      href: "/dashboard/supplier/orders",
      icon: Package,
      badge: "POs",
    },
    {
      name: "Browse Catalog",
      href: "/products",
      icon: Building2,
      isExternal: true,
    },
  ];

  const navItems = isSupplier ? supplierNavItems : buyerNavItems;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Sidebar"
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isSupplier
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              <Shield className="w-3 h-3" />
              {isSupplier ? "Supplier Workspace" : "Buyer Workspace"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            Chemical Catalog
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isSupplier ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-800 hidden md:block max-w-[150px] truncate">
              {user.email}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 p-4 space-y-6 flex-shrink-0">
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Navigation
            </p>
            <nav className="space-y-1 pt-2">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href) && (!item.isExternal || pathname === item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? isSupplier
                          ? "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs"
                          : "bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={`w-4 h-4 ${
                          isActive
                            ? isSupplier
                              ? "text-purple-600"
                              : "text-blue-600"
                            : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-bold text-slate-700">Need Help?</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Connect with procurement support for specialized inquiries.
              </p>
              <Link
                href="/resources"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                Procurement Guide <ChevronRight className="w-3 h-3" />
              </Link>
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
              className="w-64 bg-white h-full p-4 space-y-6 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isSupplier ? "Supplier Workspace" : "Buyer Workspace"}
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? isSupplier
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
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
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
