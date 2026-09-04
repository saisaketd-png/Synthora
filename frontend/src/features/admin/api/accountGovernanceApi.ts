import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

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

export const accountGovernanceApi = {
  async getSuspensions(params?: {
    page?: number;
    size?: number;
    query?: string;
    activeOnly?: boolean;
    role?: string;
  }): Promise<PageResponse<AccountSuspension>> {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set("page", params.page.toString());
    if (params?.size !== undefined) searchParams.set("size", params.size.toString());
    if (params?.query) searchParams.set("query", params.query);
    if (params?.activeOnly !== undefined) searchParams.set("activeOnly", params.activeOnly.toString());
    if (params?.role) searchParams.set("role", params.role);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";

    const res = await authenticatedFetch(`/api/v1/admin/account-governance/suspensions${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch account suspensions (${res.status})`);
    }
    return res.json();
  },

  async getSuspensionDetail(id: string): Promise<AccountSuspension> {
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/suspensions/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch suspension details");
    return res.json();
  },

  async getUserGovernanceDetail(userId: string): Promise<AdminGovernanceUserDetail> {
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/users/${userId}/detail`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch user governance detail");
    return res.json();
  },

  async suspendUser(
    userId: string,
    data: { reason: string; internalNotes?: string }
  ): Promise<AccountSuspension> {
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/users/${userId}/suspend`, {
      method: "POST",
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
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/users/${userId}/reinstate`, {
      method: "POST",
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
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set("page", params.page.toString());
    if (params?.size !== undefined) searchParams.set("size", params.size.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";

    const res = await authenticatedFetch(`/api/v1/admin/account-governance/appeals${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch appeals queue");
    return res.json();
  },

  async getAppealDetail(appealId: string): Promise<AdminAppeal> {
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/appeals/${appealId}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch appeal details");
    return res.json();
  },

  async startReview(appealId: string, data?: { internalNotes?: string }): Promise<AdminAppeal> {
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/appeals/${appealId}/review`, {
      method: "POST",
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
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/appeals/${appealId}/request-information`, {
      method: "POST",
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
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/appeals/${appealId}/approve`, {
      method: "POST",
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
    const res = await authenticatedFetch(`/api/v1/admin/account-governance/appeals/${appealId}/reject`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to reject appeal");
    }
    return res.json();
  },
};
