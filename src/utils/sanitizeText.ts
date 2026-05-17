/**
 * Replace Unicode replacement characters (U+FFFD, shown as "ï¿½" or "â€™") with
 * a standard apostrophe. These appear when Windows-1252 encoded text (e.g.
 * "smart quotes" / curly apostrophes) is stored without proper encoding conversion.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  // Replace the Unicode replacement character with a standard apostrophe
  return text.replace(/\uFFFD/g, "'");
}
