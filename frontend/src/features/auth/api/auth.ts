const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

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
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = "Login failed";

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Ignore invalid/non-JSON error response
    }

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