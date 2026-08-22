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
  Menu,
  X,
  Hexagon,
  Bell,
  FlaskConical,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Activity,
  Bookmark,
} from "lucide-react";
import { getAuthUser, logout, AuthUser } from "@/features/auth/api/auth";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { SynthoraLogo } from "@/shared/components/SynthoraLogo";

interface NavSection {
  title?: string;
  items: NavItem[];
}

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  if (!mounted || !user) {
    return (
      <div className="h-screen w-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN" || pathname.startsWith("/dashboard/admin");
  const isSupplier = !isAdmin && (user.role === "SUPPLIER" || pathname.startsWith("/dashboard/supplier"));

  const buyerNavSections: NavSection[] = [
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Procurement Desk",
          href: "/dashboard/buyer",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: "My Sourcing RFQs",
          href: "/dashboard/rfqs",
          icon: FileText,
        },
        {
          name: "Purchase Orders",
          href: "/dashboard/orders",
          icon: ShoppingCart,
        },
        {
          name: "Saved Shortlists",
          href: "/dashboard/buyer/shortlist",
          icon: Bookmark,
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          name: "System Alerts",
          href: "/dashboard/notifications",
          icon: Bell,
        },
      ],
    },
  ];

  const supplierNavSections: NavSection[] = [
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Supplier Operations",
          href: "/dashboard/supplier",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: "Product Offerings",
          href: "/dashboard/supplier/products",
          icon: Package,
        },
        {
          name: "RFQ Inquiries",
          href: "/dashboard/supplier/rfqs",
          icon: FileText,
        },
        {
          name: "Purchase Orders",
          href: "/dashboard/supplier/orders",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "ORGANIZATION",
      items: [
        {
          name: "Company Profile",
          href: "/dashboard/supplier/profile",
          icon: Building2,
        },
        {
          name: "Compliance & Verification",
          href: "/dashboard/supplier/verification",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          name: "Supplier Alerts",
          href: "/dashboard/notifications",
          icon: Bell,
        },
      ],
    },
  ];

  const adminNavSections: NavSection[] = [
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Operations Console",
          href: "/dashboard/admin/operations",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: "Master Catalog",
          href: "/dashboard/admin/catalog",
          icon: Layers,
        },
        {
          name: "Supplier Moderation",
          href: "/dashboard/admin/suppliers",
          icon: Building2,
        },
        {
          name: "Supplier Verification",
          href: "/dashboard/admin/suppliers/quality",
          icon: ShieldCheck,
        },
        {
          name: "Offering Review",
          href: "/dashboard/admin/catalog/offerings/quality",
          icon: Package,
        },
        {
          name: "User Management",
          href: "/dashboard/admin/users",
          icon: Users,
        },
      ],
    },
    {
      title: "TRANSACTIONS",
      items: [
        {
          name: "RFQ Oversight",
          href: "/dashboard/admin/transactions/rfqs",
          icon: FileText,
        },
        {
          name: "Order Oversight",
          href: "/dashboard/admin/transactions/orders",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          name: "Platform Alerts",
          href: "/dashboard/notifications",
          icon: Bell,
        },
        {
          name: "Audit Logs",
          href: "/dashboard/admin/activity",
          icon: Activity,
        },
      ],
    },
  ];

  const navSections = isAdmin
    ? adminNavSections
    : isSupplier
    ? supplierNavSections
    : buyerNavSections;

  const workspaceLabel = isAdmin
    ? "ADMIN OPERATIONS"
    : isSupplier
    ? "SUPPLIER OPERATIONS"
    : "BUYER PROCUREMENT";

  const userDisplayName = user.email.split("@")[0];

  return (
    <div className="h-screen w-screen bg-[#F4F5F7] flex flex-col font-sans text-[#172B4D] overflow-hidden">
      {/* 1. FIXED TOP HEADER (64px) */}
      <header className="shrink-0 z-40 bg-white border-b border-[#DFE1E6] h-[64px] flex items-center justify-between px-4 sm:px-6">
        {/* Left Brand & Workspace Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-[#5E6C84] hover:bg-[#F4F5F7] rounded-lg focus:outline-none"
            aria-label="Toggle Sidebar Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <SynthoraLogo
            href="/"
            size="sm"
            subtitle={workspaceLabel}
          />
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-[#F4F5F7] transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chemical Catalog</span>
            <ArrowUpRight className="w-3 h-3 text-[#5E6C84]" />
          </Link>

          <div className="h-4 w-px bg-[#DFE1E6]" />

          <NotificationBell isSupplier={isSupplier} />

          <div className="h-4 w-px bg-[#DFE1E6]" />

          {/* User Account / Role Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-bold font-mono text-[#091E42] leading-tight max-w-[100px] sm:max-w-[140px] truncate">
                {userDisplayName}
              </span>
              <span className="text-[9px] font-mono font-semibold text-[#5E6C84] uppercase">
                {user.role}
              </span>
            </div>

            <div className="h-4 w-px bg-[#DFE1E6]" />

            <button
              onClick={handleSignOut}
              className="p-1.5 text-[#5E6C84] hover:text-[#DE350B] hover:bg-[#FFEBE6] rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY (FIXED SIDEBAR + INDEPENDENTLY SCROLLABLE CONTENT) */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* FIXED DESKTOP SIDEBAR / MOBILE DRAWER (270px) */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-[270px] bg-[#FAFBFC] border-r border-[#DFE1E6] transform transition-transform duration-150 ease-in-out lg:translate-x-0 lg:static flex flex-col shrink-0 ${
            sidebarOpen ? "translate-x-0 top-[64px] h-[calc(100vh-64px)] shadow-2xl" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Scrollable Navigation Groups */}
          <div className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {section.title && (
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                    {section.title}
                  </span>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/dashboard/admin";

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center justify-between px-3 h-9.5 rounded-lg text-xs sm:text-[13px] transition-colors ${
                          isActive
                            ? "bg-[#EBECF0] text-[#091E42] font-bold border-l-[3px] border-[#0052CC]"
                            : "text-[#172B4D] hover:bg-[#F4F5F7]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-[#0052CC]" : "text-[#5E6C84] group-hover:text-[#172B4D]"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                              isActive
                                ? "bg-white text-[#091E42] border-[#DFE1E6]"
                                : "bg-[#F4F5F7] text-[#5E6C84] border-[#DFE1E6]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* FIXED SYSTEM STATUS FOOTER */}
          <div className="p-3 border-t border-[#DFE1E6] bg-white text-[11px] text-[#5E6C84] space-y-0.5 shrink-0">
            <div className="font-semibold text-[#091E42]">Synthora Industrial</div>
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span>Production Environment</span>
              <span className="text-[#00875A] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00875A]" />
                Live
              </span>
            </div>
          </div>
        </aside>

        {/* INDEPENDENTLY SCROLLABLE MAIN CONTENT PANE (Fluid Responsive Padding) */}
        <main className="flex-1 min-w-0 bg-[#F4F5F7] p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
