/**
 * Intelligent chemical synonym parser for KemKendra.
 *
 * Requirements:
 * 1. Primary separation: Newlines (each line treated as a complete synonym).
 * 2. Secondary separation: Semicolons (explicit list delimiter).
 * 3. Commas: Only split on unambiguous list separators (e.g. "Name A, Name B").
 *    Chemical locants and naming commas (e.g. "1,4-", "2,5-", "N,N-", bracketed "(1R,2S)-")
 *    are strictly preserved as part of the chemical name.
 * 4. Trims whitespace, removes empty values, deduplicates case-insensitively while
 *    preserving the original spelling and casing of the first occurrence.
 */

function isChemicalLocantComma(left: string, right: string): boolean {
  // 1. Numeric locants: "1,4" or "1, 4" or "2,5" or "1,2,3" or "2',4'-"
  if (/\b\d+['′]?\s*$/.test(left) && /^\s*\d+['′]?\b/.test(right)) {
    return true;
  }

  // 2. Numeric locant followed by hyphen: "1,4-", "2,5-", "1, 4-", "1,2,3-"
  if (/\b\d+['′]?\s*$/.test(left) && /^\s*\d+['′]?-/.test(right)) {
    return true;
  }

  // 3. Single-letter, stereochemical, or Greek locants:
  // e.g. "N,N-", "N,O-", "alpha,beta-", "cis,trans-", "R,S-", "p,p'-"
  const locantPattern = /(?:[NnOoPpSs]|[Nn]['′]?|[Oo]['′]?|alpha|beta|gamma|delta|cis|trans|sec|tert|erythro|threo|[RSEZ])/i;
  const leftLocant = left.match(new RegExp(`\\b${locantPattern.source}\\s*$`, "i"));
  const rightLocant = right.match(new RegExp(`^\\s*${locantPattern.source}(?:-|,|\\b)`, "i"));
  if (leftLocant && rightLocant) {
    return true;
  }

  // 4. Locant followed by hyphen and chemical name fragment: e.g. ",4-cyclohexane"
  if (/\b(?:\d+|[A-Za-z])\s*$/.test(left) && /^\s*\d+-[a-zA-Z]/.test(right)) {
    return true;
  }

  // 5. If there is NO whitespace after the comma (e.g. "1,4-cyclohexanedione-2,5-dicarboxylate")
  // In chemical nomenclature, internal locants typically have no spaces.
  if (right.length > 0 && !/^\s/.test(right)) {
    const leftIsFullWord = /[a-zA-Z]{3,}$/.test(left);
    const rightIsFullWord = /^[a-zA-Z]{3,}/.test(right);
    // Only treat as list separator if both sides are independent full English/chemical words (>= 3 chars)
    if (!(leftIsFullWord && rightIsFullWord)) {
      return true;
    }
  }

  return false;
}

function splitByCommasRespectingChemicalNames(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "(" || char === "[" || char === "{") {
      bracketDepth++;
      current += char;
      continue;
    }

    if (char === ")" || char === "]" || char === "}") {
      if (bracketDepth > 0) bracketDepth--;
      current += char;
      continue;
    }

    if (char === ",") {
      // 1. Commas inside brackets/parentheses are always chemical locants/descriptors
      if (bracketDepth > 0) {
        current += char;
        continue;
      }

      const left = text.slice(0, i);
      const right = text.slice(i + 1);

      // 2. Check if comma is part of a chemical locant pattern
      if (isChemicalLocantComma(left, right)) {
        current += char;
        continue;
      }

      // 3. Unambiguous separator comma: split here
      const trimmed = current.trim();
      if (trimmed) {
        result.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) {
    result.push(trimmed);
  }

  return result;
}

/**
 * Parses user input for bulk synonym entry.
 *
 * Rule 1: When newlines or semicolons are present, they are treated as intentional record separators.
 *         Commas inside lines or semicolon blocks MUST NEVER split the chemical name.
 * Rule 2: If the input is a single line without semicolons, commas are only treated as list
 *         delimiters if they are not chemical locants or stereochemical descriptors.
 *
 * @param input Raw text from textarea
 * @returns Array of unique, trimmed chemical synonym strings
 */
export function parseChemicalSynonyms(input: string): string[] {
  if (!input || !input.trim()) return [];

  const hasNewlines = /[\r\n]/.test(input.trim());
  const hasSemicolons = input.includes(";");

  const candidates: string[] = [];

  if (hasNewlines || hasSemicolons) {
    // Lines and semicolons take full precedence: commas inside chemical names are preserved 100%
    const rawLines = input.split(/\r?\n/);
    for (const line of rawLines) {
      const parts = hasSemicolons ? line.split(";") : [line];
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          candidates.push(trimmed);
        }
      }
    }
  } else {
    // Single line without semicolons: safely split respecting chemical nomenclature
    const items = splitByCommasRespectingChemicalNames(input);
    for (const item of items) {
      const trimmed = item.trim();
      if (trimmed) {
        candidates.push(trimmed);
      }
    }
  }

  // Deduplicate case-insensitively while preserving original casing
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(candidate);
    }
  }

  return unique;
}
