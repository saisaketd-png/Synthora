import { resolveApiUrl } from "@/lib/apiUrl";
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getCsrfToken,
} from "@/features/auth/api/auth";

let isRedirectingToLogin = false;
let refreshPromise: Promise<string> | null = null;

function handleSessionExpired() {
  if (typeof window === "undefined") return;

  removeAuthToken();
  window.dispatchEvent(new Event("auth-changed"));

  const currentPath = window.location.pathname;
  const isProtectedPath = currentPath.startsWith("/dashboard");

  if (isProtectedPath && !isRedirectingToLogin) {
    isRedirectingToLogin = true;
    const redirectUrl = `/login?session_expired=true&redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = redirectUrl;
    setTimeout(() => {
      isRedirectingToLogin = false;
    }, 3000);
  }
}

async function executeRefreshToken(): Promise<string> {
  const targetUrl = resolveApiUrl("/api/v1/auth/refresh");
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers["X-XSRF-TOKEN"] = csrfToken;
  }

  const response = await fetch(targetUrl, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Refresh failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("Invalid refresh response: token missing");
  }

  setAuthToken(data.token);
  window.dispatchEvent(new Event("auth-changed"));
  return data.token;
}

export async function requestTokenRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = executeRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const token = getAuthToken();

  if (!token) {
    handleSessionExpired();
    throw new Error("Authentication required");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  }

  const targetUrl = resolveApiUrl(path);

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  const isAuthEndpoint =
    path.includes("/api/v1/auth/refresh") ||
    path.includes("/api/v1/auth/login") ||
    path.includes("/api/v1/auth/logout");

  if (response.status === 401 && !isAuthEndpoint) {
    if (!isRetry) {
      try {
        const newToken = await requestTokenRefresh();
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set("Authorization", `Bearer ${newToken}`);
        if (options.body && !retryHeaders.has("Content-Type")) {
          if (!(options.body instanceof FormData)) {
            retryHeaders.set("Content-Type", "application/json");
          }
        }
        return await fetch(targetUrl, {
          ...options,
          headers: retryHeaders,
        });
      } catch {
        handleSessionExpired();
      }
    } else {
      handleSessionExpired();
    }
  }

  return response;
}