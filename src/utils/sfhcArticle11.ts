/**
 * sfhcArticle11.ts
 *
 * Master list of San Francisco Health Code Article 11 citation codes.
 * This is the ONLY source of citation codes accepted by the system —
 * California state health codes are deliberately excluded.
 */

export type SfhcCode = {
  value: string;   // stored value in DB
  code: string;    // short display (§ 581(b)(8))
  label: string;   // description label
};

export const SFHC_ARTICLE_11_CODES: SfhcCode[] = [
  { value: '§ 581(b)(1)',  code: '§ 581(b)(1)',  label: 'Garbage / Refuse / Waste' },
  { value: '§ 581(b)(2)',  code: '§ 581(b)(2)',  label: 'Overgrown Vegetation' },
  { value: '§ 581(b)(3)',  code: '§ 581(b)(3)',  label: 'Accumulation of Paper Materials' },
  { value: '§ 581(b)(4)',  code: '§ 581(b)(4)',  label: 'Unsanitary Conditions' },
  { value: '§ 581(b)(5)',  code: '§ 581(b)(5)',  label: 'Sewage / Human Waste' },
  { value: '§ 581(b)(6)',  code: '§ 581(b)(6)',  label: 'Mold Growth' },
  { value: '§ 581(b)(7)',  code: '§ 581(b)(7)',  label: 'Pigeons / Birds' },
  { value: '§ 581(b)(8)',  code: '§ 581(b)(8)',  label: 'Noxious Insects / Vermin' },
  { value: '§ 581(b)(11)', code: '§ 581(b)(11)', label: 'Poison Oak' },
  { value: '§ 581(b)(13)', code: '§ 581(b)(13)', label: 'Rodents' },
  { value: '§ 581(b)(18)', code: '§ 581(b)(18)', label: 'Public Health Safety Threat' },
  { value: '§ 609',        code: '§ 609',        label: 'Unpaid Fees' },
];

/** Return a short "§ XXX — Label" display string for a stored value */
export function getCitationDisplay(value: string | undefined | null): string {
  if (!value) return '—';
  const found = SFHC_ARTICLE_11_CODES.find(c => c.value === value);
  return found ? `${found.code} — ${found.label}` : value;
}

/** Validate that a code is in the Article 11 allowed list */
export function isValidArticle11Code(value: string): boolean {
  return SFHC_ARTICLE_11_CODES.some(c => c.value === value);
}
