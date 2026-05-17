/**
 * Normalizes an address search query for more resilient Supabase ilike matching.
 *
 * 1. Strips common trailing city/state suffixes that users type but aren't stored in the DB.
 * 2. Escapes special `ilike` pattern characters (`%`, `_`) so user input isn't treated as wildcards.
 */
const ADDRESS_SUFFIXES_TO_STRIP = [
  /\bSan\s+Francisco\b/gi,
  /\bSF\b/g,
  /\bCA\b/g,
  /\bCalifornia\b/gi,
  /\b,\s*$/g, // trailing comma after stripping
];

export function normalizeAddressQuery(query: string): string {
  let normalized = query.trim();

  for (const pattern of ADDRESS_SUFFIXES_TO_STRIP) {
    normalized = normalized.replace(pattern, "");
  }

  // Collapse leftover double spaces and re-trim
  normalized = normalized.replace(/\s{2,}/g, " ").trim();

  // Escape ilike special characters so user input is treated as literals
  normalized = normalized.replace(/%/g, "\\%").replace(/_/g, "\\_");

  return normalized;
}
