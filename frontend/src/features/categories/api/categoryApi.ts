import { resolveApiUrl } from "@/lib/apiUrl";

export interface CategoryMetadata {
  id: string;
  key: string;
  name: string;
  description: string;
  slugs: string[];
  isComingSoon?: boolean;
}

export const CANONICAL_CATEGORIES: CategoryMetadata[] = [
  {
    id: "api",
    key: "API",
    name: "API & Actives",
    description: "Active pharmaceutical ingredients and related active raw materials.",
    slugs: ["api", "api-actives", "apis", "actives"],
  },
  {
    id: "intermediate",
    key: "INTERMEDIATE",
    name: "Pharma Intermediates",
    description: "Pharmaceutical synthesis intermediates, precursors, and building blocks.",
    slugs: ["intermediate", "intermediates", "pharma-intermediates", "pharmaceutical-intermediates"],
  },
  {
    id: "specialty-chemical",
    key: "SPECIALTY_CHEMICAL",
    name: "Specialty Chemicals",
    description: "Performance additives, fine chemicals, custom synthesis materials, and catalysts.",
    slugs: ["specialty-chemical", "specialty-chemicals", "specialty"],
  },
  {
    id: "solvent",
    key: "SOLVENT",
    name: "Solvents & Reagents",
    description: "High-purity HPLC, analytical, electronic, and industrial grade solvents.",
    slugs: ["solvent", "solvents", "solvents-reagents", "reagents"],
  },
  {
    id: "excipient",
    key: "EXCIPIENT",
    name: "Pharmaceutical Excipients",
    description: "Functional binders, coatings, disintegrants, and formulation carriers.",
    slugs: ["excipient", "excipients", "pharmaceutical-excipients"],
  },
  {
    id: "contract-manufacturing",
    key: "CONTRACT_MANUFACTURING",
    name: "Contract Manufacturing",
    description: "Custom synthesis, pilot scale formulation, and CMO/CDMO manufacturing services.",
    slugs: ["contract-manufacturing", "contract", "cmo", "custom-synthesis"],
    isComingSoon: true,
  },
];

export function findCategoryBySlug(slug: string): CategoryMetadata | undefined {
  const normalized = slug.trim().toLowerCase();
  return CANONICAL_CATEGORIES.find(
    (c) => c.id === normalized || c.key.toLowerCase() === normalized || c.slugs.includes(normalized)
  );
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(resolveApiUrl("/api/v1/public/master-products/categories/counts"), {
      cache: "no-store",
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
