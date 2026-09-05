import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online";

export default function robots(): MetadataRoute.Robots {
  const publicAllowed = [
    "/",
    "/products",
    "/products/*",
    "/chemicals",
    "/chemicals/*",
    "/categories",
    "/categories/*",
    "/suppliers",
    "/suppliers/*",
    "/about",
    "/contact",
    "/industries",
    "/resources",
    "/terms",
    "/privacy",
    "/llms.txt",
    "/llms-full.txt",
    "/.well-known/llms.txt",
    "/sitemap.xml",
  ];

  const privateDisallowed = [
    "/dashboard/",
    "/dashboard/*",
    "/admin/",
    "/admin/*",
    "/login",
    "/register",
    "/register/*",
    "/rfq",
    "/rfq/*",
    "/api/",
    "/api/*",
    "/verify-email",
    "/reset-password",
    "/forgot-password",
  ];

  return {
    rules: [
      // Standard search engine crawlers (Google, Bing, etc.)
      {
        userAgent: "*",
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      // AI Search & Autonomous Agents (ChatGPT, Claude, Perplexity, Gemini, Apple, Meta, Cohere)
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "Meta-ExternalAgent",
          "cohere-ai",
        ],
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
