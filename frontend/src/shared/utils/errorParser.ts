/**
 * Reusable Frontend Error Parser
 *
 * Strips technical implementation details (Request IDs, UUIDs, SQL errors,
 * stack traces, HTTP status suffixes) from user-facing alerts and renders
 * safe, human-readable domain messages.
 */

export type ErrorContext = "registration" | "login" | "verification" | "offering" | "general";

/**
 * Sanitizes a raw error string into a clean, safe, human-readable message.
 */
export function sanitizeErrorMessage(
  rawMessage: string,
  context: ErrorContext = "general"
): string {
  if (!rawMessage || typeof rawMessage !== "string") {
    return getDefaultFallback(context);
  }

  const lower = rawMessage.toLowerCase();

  // 1. Duplicate email detection
  if (
    lower.includes("email already registered") ||
    lower.includes("email already exists") ||
    lower.includes("users_email_key") ||
    lower.includes("account with this email already exists")
  ) {
    return "An account with this email already exists. Please sign in or use another email address.";
  }

  // 2. Duplicate / Invalid mobile phone detection
  if (
    lower.includes("phone number already registered") ||
    lower.includes("mobile number already registered") ||
    lower.includes("users_phone_key") ||
    lower.includes("invalid mobile") ||
    lower.includes("invalid phone")
  ) {
    return "Please check the mobile number and try again.";
  }

  // 3. Verification token states
  if (
    lower.includes("already been used") ||
    lower.includes("already used")
  ) {
    return "This verification link has already been used or is no longer valid. Please sign in or request a new verification email.";
  }

  if (
    lower.includes("expired verification token") ||
    lower.includes("link has expired") ||
    lower.includes("token expired") ||
    (lower.includes("expired") && context === "verification")
  ) {
    return "This verification link has expired. Request a new verification email to continue.";
  }

  if (
    lower.includes("invalid or expired verification token") ||
    lower.includes("invalid token")
  ) {
    return "This verification link is invalid or has expired. Please request a new verification email.";
  }

  // 4. Server errors (HTTP 500, Database, Exception names)
  if (
    lower.includes("500") ||
    lower.includes("internal server error") ||
    lower.includes("sql") ||
    lower.includes("dataintegrityviolation") ||
    lower.includes("exception") ||
    lower.includes("stacktrace") ||
    lower.includes("hibernate") ||
    lower.includes("psqlexception")
  ) {
    if (context === "registration") {
      return "We couldn't create your account right now. Please try again later.";
    }
    return "We were unable to complete your request right now. Please try again later.";
  }

  // 5. Clean up any trailing "(HTTP 4xx/5xx, Request ID: ...)" or standalone Request IDs
  let cleaned = rawMessage
    // Remove (HTTP ..., Request ID: ...) or (HTTP ...)
    .replace(/\s*\(HTTP\s*\d+(?:,\s*Request\s*ID:[^)]+)?\)/gi, "")
    // Remove standalone Request ID: ...
    .replace(/\s*Request\s*ID:\s*[a-zA-Z0-9-]+/gi, "")
    // Remove raw UUIDs if exposed
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    // Clean up double spaces or trailing punctuation artifacts
    .replace(/\s{2,}/g, " ")
    .trim();

  // If cleaning stripped almost everything or left pure technical jargon, use fallback
  if (
    !cleaned ||
    cleaned.length < 3 ||
    lower.includes("nullpointer") ||
    lower.includes("syntaxerror")
  ) {
    return getDefaultFallback(context);
  }

  return cleaned;
}

/**
 * Extracts and sanitizes error messages from unknown thrown errors or Response objects.
 */
export function parseApiError(
  error: unknown,
  fallback?: string,
  context: ErrorContext = "general"
): string {
  // In development, log full technical details for debugging
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.debug("[ApiErrorParser Technical Trace]", error);
  }

  if (!error) {
    return fallback || getDefaultFallback(context);
  }

  let raw = "";

  if (typeof error === "string") {
    raw = error;
  } else if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, any>;
    raw = obj.message || obj.error || obj.detail || "";
  }

  if (!raw) {
    return fallback || getDefaultFallback(context);
  }

  return sanitizeErrorMessage(raw, context);
}

function getDefaultFallback(context: ErrorContext): string {
  switch (context) {
    case "registration":
      return "We couldn't create your account right now. Please try again later.";
    case "login":
      return "Invalid email or password. Please check your credentials and try again.";
    case "verification":
      return "We couldn't verify your account right now. Please request a new verification email.";
    case "offering":
      return "Unable to save commercial offering. Please review the form and try again.";
    default:
      return "An unexpected error occurred. Please try again later.";
  }
}
