import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://synthora.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/categories",
          "/categories/*",
          "/suppliers",
          "/suppliers/*",
          "/industries",
          "/resources",
        ],
        disallow: [
          "/dashboard/",
          "/dashboard/*",
          "/admin/",
          "/admin/*",
          "/login",
          "/register",
          "/register/*",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
