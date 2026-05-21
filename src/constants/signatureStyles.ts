/**
 * Signature style definitions for hearing packet documents.
 */

export const SIGNATURE_STYLES = [
  {
    key: "Style 1 — Classic",
    label: "Style 1 — Classic",
    font: '"Dancing Script", cursive',
    size: "26px",
  },
  {
    key: "Style 2 — Flowing",
    label: "Style 2 — Flowing",
    font: '"Great Vibes", cursive',
    size: "28px",
  },
  {
    key: "Style 3 — Formal",
    label: "Style 3 — Formal",
    font: '"Pinyon Script", cursive',
    size: "28px",
  },
  {
    key: "Style 4 — Modern",
    label: "Style 4 — Modern",
    font: '"Pacifico", cursive',
    size: "22px",
  },
] as const;

export type SignatureStyleKey = (typeof SIGNATURE_STYLES)[number]["key"];

export function getSignatureFont(style: string | undefined): {
  font: string;
  size: string;
} {
  const match = SIGNATURE_STYLES.find((s) => s.key === style);
  return match
    ? { font: match.font, size: match.size }
    : { font: '"Dancing Script", cursive', size: "26px" };
}
