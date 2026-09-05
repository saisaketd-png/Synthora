import { MetadataRoute } from "next";
import { getProducts } from "@/features/products/api/getProducts";
import { getSuppliers } from "@/features/suppliers/api";
import { CANONICAL_CATEGORIES } from "@/features/categories/api/categoryApi";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/suppliers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/industries`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/llms-full.txt`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Category taxonomy routes
  const categoryRoutes: MetadataRoute.Sitemap = CANONICAL_CATEGORIES.map((category) => ({
    url: `${BASE_URL}/categories/${category.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const productPage = await getProducts({ size: 100 });
    if (productPage && productPage.content) {
      productRoutes = productPage.content.map((product) => ({
        url: `${BASE_URL}/products/${product.productCode || product.id}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not fetch product catalog for sitemap generation:", error);
    }
  }

  // Dynamic suppliers
  let supplierRoutes: MetadataRoute.Sitemap = [];
  try {
    const supplierPage = await getSuppliers({ size: 100 });
    if (supplierPage && supplierPage.content) {
      supplierRoutes = supplierPage.content.map((supplier) => ({
        url: `${BASE_URL}/suppliers/${supplier.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not fetch supplier directory for sitemap generation:", error);
    }
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...supplierRoutes];
}
