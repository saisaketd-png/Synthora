import { resolveApiUrl } from "@/lib/apiUrl";

let isRedirectingToLogin = false;

function handleSessionExpired() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("synthora_token");
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

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("synthora_token") : null;

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

  if (response.status === 401) {
    handleSessionExpired();
  }

  return response;
}