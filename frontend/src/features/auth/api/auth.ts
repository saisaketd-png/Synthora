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

export async function registerSupplier(
  data: RegisterSupplierRequest
): Promise<LoginResponse> {
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

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("synthora_token");
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
      localStorage.removeItem("synthora_token");
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
    localStorage.removeItem("synthora_token");
    window.dispatchEvent(new Event("auth-changed"));
  }
}

export function handleUnauthorized(redirectUrl?: string): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("synthora_token");
    window.dispatchEvent(new Event("auth-changed"));
    const target = redirectUrl
      ? `/login?expired=true&redirect=${encodeURIComponent(redirectUrl)}`
      : `/login?expired=true`;
    window.location.href = target;
  }
}