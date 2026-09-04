/**
 * Centralized Category Definitions, Abbreviations, and Presentation Helpers
 * Decouples display formatting and code prefixing from database identity.
 */

export const CATEGORY_ABBREVIATIONS: Record<string, string> = {
  API: "API",
  INTERMEDIATE: "INT",
  EXCIPIENT: "EXC",
  SOLVENT: "SOL",
  SPECIALTY_CHEMICAL: "SPC",
  LAB_CHEMICAL: "LAB",
  CONTRACT_MANUFACTURING: "CMO",
  OTHER: "OTH",
};

/**
 * Returns clean category abbreviation (e.g. API, EXC, INT, SOL, SPC, LAB)
 * Fallback is "CAT"
 */
export function getCategoryAbbreviation(category?: string | null): string {
  if (!category) return "CAT";
  const normalized = category.trim().toUpperCase();
  return CATEGORY_ABBREVIATIONS[normalized] || "CAT";
}

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  API: "API",
  INTERMEDIATE: "Pharma Intermediate",
  EXCIPIENT: "Excipient",
  SOLVENT: "Solvent",
  SPECIALTY_CHEMICAL: "Specialty Chemical",
  LAB_CHEMICAL: "Lab Chemical",
  CONTRACT_MANUFACTURING: "Contract Manufacturing",
  OTHER: "Other Chemical",
};

/**
 * Returns formatted human-readable category name
 */
export function getCategoryDisplayName(category?: string | null): string {
  if (!category) return "Uncategorized";
  const normalized = category.trim().toUpperCase();
  return CATEGORY_DISPLAY_NAMES[normalized] || category.replace(/_/g, " ");
}
