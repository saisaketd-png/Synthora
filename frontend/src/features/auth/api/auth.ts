import { resolveApiUrl } from "@/lib/apiUrl";
import { authenticatedFetch } from "./authenticatedFetch";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  expiresIn?: number;
};

export type AuthUser = {
  email: string;
  role: "USER" | "SUPPLIER" | "ADMIN" | string;
  exp?: number;
};

/**
 * Reads the client-accessible XSRF-TOKEN cookie value.
 * Used exclusively for scoped CSRF header validation on cookie-authenticated mutations.
 * CRITICAL: Reads ONLY the XSRF-TOKEN cookie; never attempts to read HttpOnly refresh cookies.
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const targetUrl = resolveApiUrl("/api/v1/auth/login");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Login failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {
      // Ignore invalid/non-JSON error response
    }
    throw new Error(errorMessage);
  }

  const result: LoginResponse = await response.json();
  return result;
}

export type RegisterBuyerRequest = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

export type RegisterSupplierRequest = {
  name: string;
  email: string;
  password: string;
  companyName: string;
  country: string;
  countryCode?: string;
  phone?: string;
  city?: string;
  website?: string;
  aboutCompany?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

export async function registerBuyer(
  data: RegisterBuyerRequest
): Promise<{ id: string; name: string; email: string; role: string }> {
  const targetUrl = resolveApiUrl("/api/v1/auth/register");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Registration failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export type SupplierRegisterResponse = {
  message: string;
  userId: string;
  email: string;
  supplierId: number;
};

export async function registerSupplier(
  data: RegisterSupplierRequest
): Promise<SupplierRegisterResponse> {
  const targetUrl = resolveApiUrl("/api/v1/auth/register/supplier");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Supplier registration failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

const TOKEN_KEY = "kemkendra_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem("token", token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("token");
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = getAuthToken();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);

    // Check expiration if present
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      removeAuthToken();
      return null;
    }

    return {
      email: decoded.sub || "",
      role: decoded.role || "USER",
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    removeAuthToken();
    window.dispatchEvent(new Event("auth-changed"));

    try {
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }
      const targetUrl = resolveApiUrl("/api/v1/auth/logout");
      await fetch(targetUrl, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch {
      // Handled silently
    }
  }
}

export async function logoutAll(): Promise<void> {
  try {
    await authenticatedFetch("/api/v1/auth/logout-all", {
      method: "POST",
    });
  } catch {
    // Handled silently
  } finally {
    removeAuthToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }
  }
}

export function handleUnauthorized(redirectUrl?: string): void {
  if (typeof window !== "undefined") {
    removeAuthToken();
    window.dispatchEvent(new Event("auth-changed"));
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/dashboard")) {
      const target = redirectUrl
        ? `/login?expired=true&redirect=${encodeURIComponent(redirectUrl)}`
        : `/login?expired=true`;
      window.location.href = target;
    }
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const targetUrl = resolveApiUrl("/api/v1/auth/forgot-password");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let errorMessage = `Request failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const targetUrl = resolveApiUrl("/api/v1/auth/reset-password");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    let errorMessage = `Password reset failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const response = await authenticatedFetch("/api/v1/users/me");

  if (!response.ok) {
    let errorMessage = `Failed to fetch profile (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function updateUserProfile(data: {
  name: string;
  phone?: string;
}): Promise<UserProfile> {
  const response = await authenticatedFetch("/api/v1/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Failed to update profile (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await authenticatedFetch("/api/v1/users/me/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Failed to change password (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export type VerifyEmailResult = {
  message: string;
  token?: string;
  role?: string;
  verificationStatus?: string;
};

export async function verifyEmail(data: {
  token: string;
}): Promise<VerifyEmailResult> {
  const targetUrl = resolveApiUrl("/api/v1/auth/verify-email");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Email verification failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function resendVerification(data: {
  email: string;
}): Promise<{ message: string }> {
  const targetUrl = resolveApiUrl("/api/v1/auth/resend-verification");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Resend verification failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const requestId = response.headers.get("X-Request-ID");
      const msg = errorData.error || errorData.message || "Unknown error";
      errorMessage = `${msg} (HTTP ${response.status}${requestId ? `, Request ID: ${requestId}` : ""})`;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}