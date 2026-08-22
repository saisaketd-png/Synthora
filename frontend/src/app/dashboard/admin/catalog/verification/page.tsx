"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldCatalogVerificationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/admin/suppliers/verification");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs font-bold text-slate-500 min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <span>Redirecting to Supplier Moderation Verification Queue...</span>
    </div>
  );
}
