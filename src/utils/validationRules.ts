/**
 * validationRules.ts
 *
 * SOP-driven validation rules engine for the Director's Hearing Packet system.
 * Single source of truth for statutory restrictions and lead omission rules.
 * Imported by both frontend components and backend endpoints.
 *
 * Two rule categories:
 *  1. STATUTORY_RESTRICTION — regex patterns blocking California state health code citations
 *  2. LEAD_OMISSION         — keyword blocklist removing lead-related references everywhere
 */

// ── 1. Statutory Restriction ──────────────────────────────────────────────────
// Regex patterns matching common California state health and safety code citation formats.
// Any user input or AI-generated text matching these patterns must be rejected.

export const CA_STATE_CODE_PATTERNS: RegExp[] = [
  // "Cal. H&S", "Cal H&S Code", "California Health and Safety Code"
  /Cal(?:ifornia)?\.?\s*H(?:ealth)?\s*(?:&|and)\s*S(?:afety)?\s*(?:Code)?/i,
  // "CA HSC", "CA H&S"
  /\bCA\s*H(?:SC|&S)\b/i,
  // "Cal HSC", "Cal H&S"
  /\bCal\.?\s*H(?:SC|&S)\b/i,
  // "Health & Safety Code § 17XXX" — state section numbers typically 4+ digits
  /Health\s*(?:&|and)\s*Safety\s*Code\s*[§Ss]?\s*\d{4}/i,
  // "HSC § 1234"
  /\bHSC\s*[§Ss]?\s*\d{4,}/i,
  // "California Health and Safety Code" / "California H&S Code"
  /California\s+(?:Health\s+(?:and|&)\s+Safety|H(?:ealth)?\s*(?:&|and)\s*S(?:afety)?)\s*Code/i,
  // "California Code of Regulations", "Cal. Code of Regulations"
  /(?:California|Cal\.?|CA)\s+Code\s+of\s+Regulations/i,
  // "CCR § 35000"
  /\bCCR\s*[§Ss]?\s*\d/i,
  // "Title 17 California" / "Title 17 of the California"
  /Title\s+17\s+(?:of\s+(?:the\s+)?)?(?:California|Cal\.?)/i,
  // "Cal. Civil Code"
  /\bCal\.?\s*Civ(?:il)?\s*Code\b/i,
  // "Business and Professions Code"
  /\bBusiness\s*(?:&|and)\s*Professions\s*Code\b/i,
  // Generic "State Health Code" reference
  /\bState\s+Health\s+(?:and\s+Safety\s+)?Code\b/i,
];

/**
 * Returns true if the input text contains a California state code citation.
 * Used to validate user-typed text fields and AI output before display.
 */
export function containsCAStateCode(text: string): boolean {
  return CA_STATE_CODE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Error message shown when a California state code citation is detected.
 * Direct users to SFHC citations exclusively.
 */
export const CA_STATE_CODE_ERROR =
  "California state codes are not accepted — cite San Francisco Health Code articles only " +
  "(Article 11, Article 11A, Article 2, Sec. 283, etc.).";

// ── 2. Lead Omission Rule ─────────────────────────────────────────────────────
// Keywords and phrases to be excluded from autocomplete lists, AI suggestion prompts,
// dropdown options, and contextual text generators.

export const LEAD_KEYWORDS: string[] = [
  "lead-based paint",
  "lead based paint",
  "lead safety",
  "lead abatement",
  "lead hazard",
  "lead mitigation",
  "lead clearance",
  "lead inspection",
  "lead testing",
  "lead paint",
  "lead poisoning",
  "lead exposure",
  "blood lead",
  "lead dust",
  "lead soil",
  "lead remediation",
  "lead encapsulation",
  "lead disclosure",
  "XRF testing",
  "x-ray fluorescence",
  // Standalone "lead" checked separately as a whole word
  "lead",
];

/**
 * Returns true if the text contains lead-related keywords (case-insensitive).
 * The word "lead" is matched as a whole word only (avoids false positives like "lead actor").
 */
export function containsLeadKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  for (const keyword of LEAD_KEYWORDS) {
    if (keyword === "lead") {
      if (/\blead\b/i.test(lower)) return true;
    } else {
      if (lower.includes(keyword.toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * Filter a list of violation-like objects to exclude any whose label or
 * defaultCorrectiveAction contain lead-related references.
 * Use at render time to ensure lead content never appears in dropdowns or chips.
 */
export function filterLeadViolations<T extends { label: string; defaultCorrectiveAction?: string }>(
  violations: T[],
): T[] {
  return violations.filter((v) => {
    if (containsLeadKeyword(v.label)) return false;
    if (v.defaultCorrectiveAction && containsLeadKeyword(v.defaultCorrectiveAction)) return false;
    return true;
  });
}

/**
 * System prompt additions for AI endpoints.
 * Append to any corrective action / suggestion prompt to enforce both rules.
 */
export const AI_EXCLUSION_DIRECTIVES = `
STATUTORY RESTRICTION — MANDATORY:
All violation citations must reference the San Francisco Health Code exclusively — Article 11, Article 11A, Article 2, and other relevant SFHC articles. Never cite or reference California state health and safety codes, Cal. H&S Code, HSC, California Code of Regulations (CCR), or any state-level statute.

LEAD OMISSION RULE — MANDATORY:
Never mention lead, lead-based paint, lead safety, lead abatement, lead hazard, lead mitigation, lead clearance, lead dust, XRF testing, or any lead-related term in any suggestion, corrective action, or observation. This includes implicit references to lead in pre-1978 building contexts.
`.trim();

// ── 3. Biohazard Protocol Prohibition Patterns ────────────────────────────────
// Three hard prohibitions from the Director's Rules Sec. XIV and Sec. VIII.
// Violations here are equal in severity to California state code citations.

export const BIOHAZARD_PROHIBITION_PATTERNS: Array<{
  pattern: RegExp;
  shortLabel: string;
  violation: string;
  correction: string;
}> = [
  {
    pattern:
      /(?:bleach|hypochlorite).{0,60}(?:ammonia|glass\s*cleaner)|(?:ammonia|glass\s*cleaner).{0,60}(?:bleach|hypochlorite)/i,
    shortLabel: "Bleach + ammonia mixing",
    violation:
      "Mixing bleach (hypochlorite) with ammonia produces poisonous chlorine gas — this is " +
      "explicitly prohibited by Director's Rules Sec. XIV.",
    correction:
      "Use bleach solution and ammonia-based cleaners separately, never together. " +
      "(Director's Rules Sec. XIV)",
  },
  {
    pattern:
      /(?:vacuum(?:ing|ed)?|sweep(?:ing)?|swept)\s+(?:up\s+)?(?:feces|droppings?|waste|urine|contaminated|rodent|animal|bird)\b|(?:feces|droppings?|waste|urine|contaminated)\b.{0,50}(?:vacuum(?:ing|ed)?|sweep(?:ing)?|swept)\b/i,
    shortLabel: "Vacuuming/sweeping unsterilized waste",
    violation:
      "Vacuuming or sweeping unsterilized feces, droppings, or contaminated surfaces aerosolizes " +
      "disease organisms — explicitly prohibited by Director's Rules Sec. XIV.",
    correction:
      "Disinfect all contaminated surfaces with bleach solution FIRST, then remove residue " +
      "using dampened paper towels and sealed disposal bags. (Director's Rules Sec. XIV)",
  },
  {
    pattern: /spray\s*foam/i,
    shortLabel: "Spray foam for rodent exclusion",
    violation:
      "Spray foam is explicitly prohibited for rodent exclusion — rodents can chew through it. " +
      "(Director's Rules Sec. VIII)",
    correction:
      "Seal all gaps larger than ¼ inch with approved rodent-proof materials: sheet metal, " +
      "¼-inch wire metal mesh, concrete, or cement. (Director's Rules Sec. VIII)",
  },
];

/**
 * Returns all biohazard violations found in text as an array of
 * { shortLabel, violation, correction } objects.
 * An empty array means no violations.
 */
export function getBiohazardViolations(
  text: string,
): Array<{ shortLabel: string; violation: string; correction: string }> {
  return BIOHAZARD_PROHIBITION_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ shortLabel, violation, correction }) => ({
      shortLabel,
      violation,
      correction,
    }),
  );
}

/** Returns true if any biohazard prohibition pattern matches the text. */
export function containsBiohazardViolation(text: string): boolean {
  return BIOHAZARD_PROHIBITION_PATTERNS.some(({ pattern }) => pattern.test(text));
}

/**
 * Returns a user-facing inline error string for all biohazard violations found,
 * or undefined if the text is clean.
 */
export function getBiohazardViolationError(text: string): string | undefined {
  const hits = getBiohazardViolations(text);
  if (hits.length === 0) return undefined;
  return hits.map((h) => `⚠ ${h.shortLabel}: ${h.correction}`).join(" • ");
}

/**
 * Convenience: returns the first applicable error for a field —
 * CA state code takes priority, then biohazard protocol violations.
 */
export function getFieldValidationError(text: string): string | undefined {
  if (!text) return undefined;
  if (containsCAStateCode(text)) return CA_STATE_CODE_ERROR;
  return getBiohazardViolationError(text);
}

/** Static banner-level error message for when a biohazard prohibition is triggered. */
export const BIOHAZARD_VIOLATION_ERROR =
  "This text contradicts Director's Rules safe cleanup protocols — check for prohibited " +
  "chemical combinations (bleach + ammonia), cleanup methods (vacuuming unsterilized waste), " +
  "or excluded materials (spray foam for rodent exclusion).";

// ── 4. Statutory Cross-Mapping ────────────────────────────────────────────────
// When a California state code is detected, suggest the nearest SFHC Article 11 equivalent
// based on keyword context in the surrounding text.

export type SfhcSuggestion = {
  code: string; // e.g. '§ 581(b)(4)'
  label: string; // e.g. 'Unsanitary Conditions'
  description: string; // contextual hint shown in the suggestion card
};

export const STATE_TO_SFHC_MAP: Array<{
  keywords: string[];
  suggestion: SfhcSuggestion;
}> = [
  {
    keywords: ["rodent", "rat", "rats", "mouse", "mice", "gnaw", "burrow"],
    suggestion: {
      code: "§ 581(b)(13)",
      label: "Rodents",
      description: "Covers rat, mouse, and other rodent infestations and associated evidence",
    },
  },
  {
    keywords: [
      "insect",
      "vermin",
      "bug",
      "cockroach",
      "roach",
      "bedbug",
      "bed bug",
      "mosquito",
      "fly",
      "flea",
      "termite",
      "ant",
    ],
    suggestion: {
      code: "§ 581(b)(8)",
      label: "Noxious Insects / Vermin",
      description:
        "Covers insect infestations including cockroaches, bed bugs, mosquitoes, and other pests",
    },
  },
  {
    keywords: [
      "sewage",
      "sewer",
      "urine",
      "feces",
      "fecal",
      "human waste",
      "animal waste",
      "septic",
      "drain",
    ],
    suggestion: {
      code: "§ 581(b)(5)",
      label: "Sewage / Human Waste",
      description: "Covers sewage leaks, human/animal waste accumulation, and drainage failures",
    },
  },
  {
    keywords: ["mold", "mould", "fungus", "fungi", "moisture", "damp", "water damage", "leak"],
    suggestion: {
      code: "§ 581(b)(6)",
      label: "Mold Growth",
      description: "Covers mold, moisture damage, and conditions supporting fungal growth",
    },
  },
  {
    keywords: ["pigeon", "bird", "flock", "avian", "nesting", "roosting"],
    suggestion: {
      code: "§ 581(b)(7)",
      label: "Pigeons / Birds",
      description: "Covers pigeon and bird infestations and associated waste hazards",
    },
  },
  {
    keywords: ["vegetation", "plant", "weed", "shrub", "overgrown", "garden", "yard"],
    suggestion: {
      code: "§ 581(b)(2)",
      label: "Overgrown Vegetation",
      description: "Covers overgrown plants, weeds, and vegetation posing health or safety hazards",
    },
  },
  {
    keywords: ["refuse", "garbage", "trash", "debris", "litter", "dump", "junk"],
    suggestion: {
      code: "§ 581(b)(1)",
      label: "Garbage / Refuse / Waste",
      description: "Covers accumulation of garbage, refuse, and solid waste materials",
    },
  },
  {
    keywords: [
      "structural",
      "habitability",
      "deteriorat",
      "defect",
      "damage",
      "plaster",
      "ceiling",
      "wall",
      "floor",
      "paint",
      "building condition",
    ],
    suggestion: {
      code: "§ 581(b)(4)",
      label: "Unsanitary Conditions",
      description:
        "Covers structural defects, habitability issues, and general unsanitary building conditions",
    },
  },
];

/**
 * Given text that contains a California state code citation, return the closest
 * SFHC Article 11 equivalent based on keyword context in the text.
 * Falls back to § 581(b)(4) (Unsanitary Conditions) if no specific match found.
 */
export function getSfhcSuggestion(text: string): SfhcSuggestion {
  const lower = text.toLowerCase();
  for (const entry of STATE_TO_SFHC_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.suggestion;
    }
  }
  return {
    code: "§ 581(b)(4)",
    label: "Unsanitary Conditions",
    description:
      "General-purpose citation for sanitary code violations. Review the specific conditions and select a more precise code if applicable.",
  };
}

/**
 * Replace the first matching California state code phrase in the text
 * with the given SFHC code string (e.g., '§ 581(b)(4)').
 * The rest of the summary text is preserved exactly.
 */
export function replaceStateCodeWithSfhc(text: string, sfhcCode: string): string {
  let result = text;
  for (const pattern of CA_STATE_CODE_PATTERNS) {
    // Reset lastIndex for global patterns, replace only first occurrence
    const replaced = result.replace(pattern, sfhcCode);
    if (replaced !== result) {
      result = replaced;
      break;
    }
  }
  return result;
}
