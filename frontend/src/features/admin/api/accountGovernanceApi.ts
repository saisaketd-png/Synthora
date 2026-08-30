import { resolveApiUrl } from "@/lib/apiUrl";

export interface AccountSuspension {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: "USER" | "SUPPLIER" | "ADMIN";
  userStatus: string;
  suspendedAt: string;
  suspendedByAdminId: string;
  suspendedByAdminName: string;
  suspendedByAdminEmail: string;
  reason: string;
  internalNotes: string | null;
  reinstatedAt: string | null;
  reinstatedByAdminId: string | null;
  reinstatedByAdminName: string | null;
  reinstatedByAdminEmail: string | null;
  reinstatementNotes: string | null;
  active: boolean;
}

export interface AdminAppeal {
  id: string;
  suspensionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "USER" | "SUPPLIER" | "ADMIN";
  status: "SUBMITTED" | "UNDER_REVIEW" | "INFORMATION_REQUIRED" | "APPROVED" | "REJECTED";
  submittedReason: string;
  userResponse: string | null;
  adminResponse: string | null;
  adminInternalNotes: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewedByAdminName: string | null;
  reviewedByAdminEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGovernanceUserDetail {
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "SUPPLIER" | "ADMIN";
    status: string;
    emailVerified: boolean;
    createdAt: string;
  };
  currentSuspension: AccountSuspension | null;
  suspensionHistory: AccountSuspension[];
  appealsHistory: AdminAppeal[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const accountGovernanceApi = {
  async getSuspensions(params?: {
    page?: number;
    size?: number;
    query?: string;
    activeOnly?: boolean;
    role?: string;
  }): Promise<PageResponse<AccountSuspension>> {
    const url = new URL(resolveApiUrl("/api/v1/admin/account-governance/suspensions"), window.location.origin);
    if (params?.page !== undefined) url.searchParams.set("page", params.page.toString());
    if (params?.size !== undefined) url.searchParams.set("size", params.size.toString());
    if (params?.query) url.searchParams.set("query", params.query);
    if (params?.activeOnly !== undefined) url.searchParams.set("activeOnly", params.activeOnly.toString());
    if (params?.role) url.searchParams.set("role", params.role);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch account suspensions");
    return res.json();
  },

  async getSuspensionDetail(id: string): Promise<AccountSuspension> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/suspensions/${id}`), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch suspension details");
    return res.json();
  },

  async getUserGovernanceDetail(userId: string): Promise<AdminGovernanceUserDetail> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/users/${userId}/detail`), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch user governance detail");
    return res.json();
  },

  async suspendUser(
    userId: string,
    data: { reason: string; internalNotes?: string }
  ): Promise<AccountSuspension> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/users/${userId}/suspend`), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to suspend user");
    }
    return res.json();
  },

  async reinstateUser(
    userId: string,
    data?: { notes?: string }
  ): Promise<AccountSuspension> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/users/${userId}/reinstate`), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to reinstate user");
    }
    return res.json();
  },

  async getAppeals(params?: {
    page?: number;
    size?: number;
    status?: string;
    query?: string;
  }): Promise<PageResponse<AdminAppeal>> {
    const url = new URL(resolveApiUrl("/api/v1/admin/account-governance/appeals"), window.location.origin);
    if (params?.page !== undefined) url.searchParams.set("page", params.page.toString());
    if (params?.size !== undefined) url.searchParams.set("size", params.size.toString());
    if (params?.status) url.searchParams.set("status", params.status);
    if (params?.query) url.searchParams.set("query", params.query);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch appeals queue");
    return res.json();
  },

  async getAppealDetail(appealId: string): Promise<AdminAppeal> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/appeals/${appealId}`), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch appeal details");
    return res.json();
  },

  async startReview(appealId: string, data?: { internalNotes?: string }): Promise<AdminAppeal> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/appeals/${appealId}/review`), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to start appeal review");
    }
    return res.json();
  },

  async requestInformation(
    appealId: string,
    data: { message: string; internalNotes?: string }
  ): Promise<AdminAppeal> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/appeals/${appealId}/request-information`), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to request information");
    }
    return res.json();
  },

  async approveAppeal(
    appealId: string,
    data?: { reason?: string; internalNotes?: string }
  ): Promise<AdminAppeal> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/appeals/${appealId}/approve`), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to approve appeal");
    }
    return res.json();
  },

  async rejectAppeal(
    appealId: string,
    data?: { reason?: string; internalNotes?: string }
  ): Promise<AdminAppeal> {
    const res = await fetch(resolveApiUrl(`/api/v1/admin/account-governance/appeals/${appealId}/reject`), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to reject appeal");
    }
    return res.json();
  },
};
