"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OldCatalogVerificationDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.supplierId as string;

  useEffect(() => {
    if (supplierId) {
      router.replace(`/dashboard/admin/suppliers/verification/${supplierId}`);
    } else {
      router.replace("/dashboard/admin/suppliers/verification");
    }
  }, [router, supplierId]);

  return (
    <div className="p-8 text-center text-xs font-bold text-slate-500 min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <span>Redirecting to Supplier Due-Diligence Workspace...</span>
    </div>
  );
}
