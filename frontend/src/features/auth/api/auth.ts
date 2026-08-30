import { resolveApiUrl } from "@/lib/apiUrl";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
};

export type AuthUser = {
  email: string;
  role: "USER" | "SUPPLIER" | "ADMIN" | string;
  exp?: number;
};

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

  return response.json();
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
const LEGACY_TOKEN_KEY = "synthora_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  }
  return token;
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
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

export function logout(): void {
  if (typeof window !== "undefined") {
    removeAuthToken();
    window.dispatchEvent(new Event("auth-changed"));
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
  const token = getAuthToken();
  const targetUrl = resolveApiUrl("/api/v1/users/me");
  const response = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
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
  const token = getAuthToken();
  const targetUrl = resolveApiUrl("/api/v1/users/me");
  const response = await fetch(targetUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
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
  const token = getAuthToken();
  const targetUrl = resolveApiUrl("/api/v1/users/me/change-password");
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
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

export async function verifyEmail(data: {
  token: string;
}): Promise<{ message: string }> {
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