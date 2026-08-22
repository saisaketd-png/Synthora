"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser } from "@/features/auth/api/auth";

export default function RFQRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      // Unauthenticated buyers are guided to browse verified chemical catalog compounds
      router.replace("/products");
      return;
    }

    if (user.role === "BUYER") {
      router.replace("/dashboard/rfqs");
    } else if (user.role === "SUPPLIER") {
      router.replace("/dashboard/supplier/rfqs");
    } else if (user.role === "ADMIN") {
      router.replace("/dashboard/admin/transactions/rfqs");
    } else {
      router.replace("/products");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          Redirecting to Procurement RFQ Workspace...
        </span>
      </div>
    </div>
  );
}
