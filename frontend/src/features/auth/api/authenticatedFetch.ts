const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

let isRedirectingToLogin = false;

function handleSessionExpired() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("synthora_token");
  window.dispatchEvent(new Event("auth-changed"));

  if (!isRedirectingToLogin && !window.location.pathname.startsWith("/login")) {
    isRedirectingToLogin = true;
    const currentPath = window.location.pathname;
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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    handleSessionExpired();
  }

  return response;
}