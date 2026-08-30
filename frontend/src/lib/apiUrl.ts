/**
 * Centralized API URL resolution strategy for KemKendra.
 * 
 * In Browser/Client-side execution:
 *   - Base URL is "" (empty string) or NEXT_PUBLIC_API_URL, resolving to relative "/api/v1/..."
 *     which Next.js proxies to the backend via rewrites in next.config.ts.
 * 
 * In Node.js Server-side execution (SSR, Server Components, Server Actions):
 *   - Relative URLs like "/api/v1/..." throw "Failed to parse URL" in native Node fetch.
 *   - Server-side execution resolves to the absolute backend URL using BACKEND_API_URL /
 *     INTERNAL_API_URL / NEXT_PUBLIC_API_URL, defaulting to "http://127.0.0.1:8085".
 */

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side Node.js execution
    return (
      process.env.BACKEND_API_URL ||
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8085"
    ).replace(/\/+$/, "");
  }

  // Browser client-side execution
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
}

/**
 * Resolves an API path (e.g., "/api/v1/suppliers?page=0") into a safe URL
 * for the current execution context (client or server).
 */
export function resolveApiUrl(path: string): string {
  // If the path already has http:// or https://, return as-is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${cleanPath}`;
}
