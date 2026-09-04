import { authenticatedFetch } from "@/features/auth/api/authenticatedFetch";

export interface UserAppeal {
  id: string;
  suspensionId: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "INFORMATION_REQUIRED" | "APPROVED" | "REJECTED";
  submittedReason: string;
  userResponse: string | null;
  adminResponse: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSuspensionDetail {
  isSuspended: boolean;
  suspensionId: string | null;
  suspendedAt: string | null;
  reason: string | null;
  activeAppeal: UserAppeal | null;
}

export const userAppealApi = {
  async getMySuspension(): Promise<UserSuspensionDetail> {
    const res = await authenticatedFetch("/api/v1/account/suspension", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch suspension status");
    return res.json();
  },

  async getMyAppeals(): Promise<UserAppeal[]> {
    const res = await authenticatedFetch("/api/v1/account/appeals", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch appeals");
    return res.json();
  },

  async getMyAppealDetail(appealId: string): Promise<UserAppeal> {
    const res = await authenticatedFetch(`/api/v1/account/appeals/${appealId}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch appeal detail");
    return res.json();
  },

  async submitAppeal(reason: string): Promise<UserAppeal> {
    const res = await authenticatedFetch("/api/v1/account/appeals", {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to submit appeal");
    }
    return res.json();
  },

  async respondToInformation(appealId: string, response: string): Promise<UserAppeal> {
    const res = await authenticatedFetch(`/api/v1/account/appeals/${appealId}/response`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to submit response");
    }
    return res.json();
  },
};
