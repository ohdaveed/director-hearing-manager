/**
 * directorsRulesStandards.ts — Directors_Rules_Standards
 *
 * Pre-authorized regulatory language blocks extracted verbatim from:
 * "Director's Rules and Regulations for Prevention and Control of Rodents
 *  and other Vectors, and to promote Housing Habitability"
 * SFDPH Environmental Health Section — 09/2007 (SOGI-edited 12/2019)
 * Pursuant to Article 11, Sec. 581–596 of the San Francisco Health Code.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  READ-ONLY — This file is a static constants library.                  ║
 * ║  Do NOT expose to users, store in a database, or allow runtime edits.  ║
 * ║  If SFDPH publishes a revised edition, update this file manually.      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Consumed by:
 *  - src/api/suggestCorrectiveAction.ts  (guided AI injection)
 *  - src/utils/validationRules.ts        (biohazard prohibition reference)
 */

// ── Shared types ──────────────────────────────────────────────────────────────

export type StandardEntry = {
  /** Section reference within the Director's Rules document */
  sourceSection: string;
  /** Short human-readable title for the standard */
  shortTitle: string;
  /** Verbatim regulatory text — must not be paraphrased in AI output */
  verbatimText: string;
};

export type StandardsCategory = {
  name: string;
  entries: StandardEntry[];
};

// ── Category 1: Structural Gaps & Sealing ────────────────────────────────────

export const STRUCTURAL_GAPS_SEALING: StandardEntry[] = [
  {
    sourceSection: 'Sec. VIII — Vector Exclusion',
    shortTitle: 'Exterior door/window gaps — ¼-inch threshold',
    verbatimText:
      'Gaps greater than ¼ inch around exterior doors and windows shall be repaired.',
  },
  {
    sourceSection: 'Sec. VIII — Vector Exclusion',
    shortTitle: 'Pipe/conduit wall openings — approved materials',
    verbatimText:
      'Openings in exterior walls, particularly around pipes or conduits shall be sealed with ' +
      'hardware cloth, copper mesh, caulk, sheet metal, concrete or mortar.',
  },
  {
    sourceSection: 'Sec. VIII — Vector Exclusion',
    shortTitle: 'Attic/crawl-space openings — corrosion-resistant screening',
    verbatimText:
      'Exterior openings into attics or crawl spaces shall be covered with corrosions-resistant ' +
      'wire screening, perforated vinyl, or other similar material to prevent the entry of birds, ' +
      'bats, rodents, and other animals.',
  },
  {
    sourceSection: 'Sec. VIII — Vector Exclusion / Corrective Action Precedents',
    shortTitle: 'Hole sealing — ¼-inch rule, SPRAY FOAM PROHIBITED',
    verbatimText:
      'Seal all holes larger than ¼ inch with rodent-proof materials such as sheet metal, ¼ inch ' +
      'wire metal mesh, concrete, cement, etc. to prevent rodent access. DO NOT USE SPRAY FOAM.',
  },
];

// ── Category 2: Screen Mesh Standards ────────────────────────────────────────

export const SCREEN_MESH_STANDARDS: StandardEntry[] = [
  {
    sourceSection: 'Sec. VIII — Vector Exclusion',
    shortTitle: 'Fly/mosquito screen specification — 16-mesh per inch, tight-fitting frames',
    verbatimText:
      'Where flies and mosquitoes are a nuisance, every doorway, window or other device with ' +
      'openings to outdoor space and used for ventilation shall have screens of at least 16-mesh ' +
      'per one inch set in tight-fitting frames, or such other devices as will effectively prevent ' +
      'their entrance into the living space or commercial space.',
  },
];

// ── Category 3: Landscape Clear Distances ─────────────────────────────────────

export const LANDSCAPE_CLEAR_DISTANCES: StandardEntry[] = [
  {
    sourceSection: 'Sec. VII-3 — Landscape Management',
    shortTitle: 'Tree/shrub branch setback — minimum 3 feet from buildings',
    verbatimText:
      'Maintain tree/shrub branches, at least 3 feet away from or above buildings to prevent ' +
      'rats and other wildlife from gaining access by climbing or jumping.',
  },
  {
    sourceSection: 'Sec. VII-3 — Landscape Management',
    shortTitle: 'Fence/wall clear space — minimum 24 inches',
    verbatimText:
      'Maintain a clear space of at least 24 inches along side fences and exterior walls of ' +
      'buildings. Rats like to run along walls and under cover, so they will avoid these areas.',
  },
  {
    sourceSection: 'Sec. VIII — Vector Exclusion',
    shortTitle: 'Foundation brush/grass clearance — minimum 2 feet',
    verbatimText:
      'Clear brush and grass at least 2 feet around the foundation of the structure. ' +
      'Rodents prefer not to cross open ground.',
  },
  {
    sourceSection: 'Sec. VIII — Vector Exclusion',
    shortTitle: 'Roof/balcony vegetation setback — trim to 3 feet',
    verbatimText: 'Shrubs, vines and trees shall be trimmed to 3 feet away from the roof or balconies.',
  },
  {
    sourceSection: 'Sec. VII-3 — Landscape Management',
    shortTitle: 'Dense groundcover — remove to eliminate burrow/runway harborage',
    verbatimText: 'Remove or thin out dense groundcover that can hide burrows, runways and drains.',
  },
  {
    sourceSection: 'Sec. VII-3 — Landscape Management',
    shortTitle: 'Gravel foundation deterrent — rodents avoid gravel',
    verbatimText:
      'Apply a few inches of gravel around foundations and in any area where rats may be ' +
      'burrowing. Rats will avoid gravel.',
  },
];

// ── Category 4: Material Storage & Stacking Elevations ───────────────────────

export const MATERIAL_STORAGE_STACKING: StandardEntry[] = [
  {
    sourceSection: 'Sec. VII-2 — Proper Storage Practices',
    shortTitle: 'Ground elevation minimum — 6 inches',
    verbatimText:
      'Stored items shall be stacked neatly in piles and elevated at least 6 inches from the ground.',
  },
  {
    sourceSection: 'Sec. VII-2 — Proper Storage Practices',
    shortTitle: 'Wall/fence clearance minimum — 6 inches between piles and walls',
    verbatimText:
      'With at least 6 inches of space between the piles and exterior walls of any structure or fence.',
  },
  {
    sourceSection: 'Sec. VII-2 — Corrective Action Precedents',
    shortTitle: 'Temporary storage pile specs — 6–10 in apart, 6–10 in from walls, max 4 ft tall',
    verbatimText:
      'All unnecessary items shall be discarded or recycled. Where it is necessary to temporarily ' +
      'store items, all such items shall be stored neatly in piles 6–10 inches apart and 6–10 inches ' +
      'away from walls and furniture. Piles shall be no more than 4 ft tall.',
  },
  {
    sourceSection: 'Sec. VII-2 — Proper Storage Practices',
    shortTitle: 'No water collection — items shall be drained, covered, and inverted',
    verbatimText:
      'Stored items shall not collect water that would permit the breeding of insect disease vectors ' +
      'such as mosquitoes. Stored items shall be drained, covered and inverted.',
  },
  {
    sourceSection: 'Sec. VII-1 — Proper Sanitation',
    shortTitle: 'Container spec — rodent-proof, insect-vector-proof, watertight, tight-fitting lids',
    verbatimText:
      'Such containers shall be rodent-proof, insect disease vector-proof and watertight with tight ' +
      'fitting lids. Plastic bags may be used as garbage and refuse container liners, but shall not be ' +
      'used without the container for on-site storage of garbage or refuse.',
  },
];

// ── Category 5: Biohazard & Chemical Protocols ───────────────────────────────

export const BIOHAZARD_CHEMICAL_PROTOCOLS: StandardEntry[] = [
  {
    sourceSection: 'Sec. XIV — Procedures for Safe Cleanup',
    shortTitle: 'Disinfectant for animal waste — sodium hypochlorite (bleach)',
    verbatimText:
      'Spray animal urine stains or feces with an appropriate disinfectant such as a solution of a ' +
      'sodium hypochlorite product (bleach) or other disinfectant until thoroughly soaked. With your ' +
      'hand covered by a plastic bag, use a paper towel to pick up the urine and the droppings. ' +
      'Wrap the paper towel in the plastic bag and discard it outdoors in a sealed container.',
  },
  {
    sourceSection: 'Sec. XIV — Procedures for Safe Cleanup',
    shortTitle: 'PROHIBITION: NEVER mix bleach (hypochlorite) and ammonia — produces chlorine gas',
    verbatimText:
      'NEVER mix hypochlorite products (bleach) and ammonia products (such as glass cleaner) ' +
      'because poisonous chlorine gas will be created.',
  },
  {
    sourceSection: 'Sec. XIV — Procedures for Safe Cleanup',
    shortTitle: 'PROHIBITION: Do NOT vacuum or sweep unsterilized feces/droppings',
    verbatimText:
      'Do not vacuum or sweep urine, feces, droppings or contaminated surfaces unless they have ' +
      'been disinfected. Sweeping will put the disease organisms into the air you breathe.',
  },
  {
    sourceSection: 'Sec. XIV — Procedures for Safe Cleanup (per CDC guidance)',
    shortTitle: 'Required PPE — disposable gloves, plastic bag hand cover',
    verbatimText:
      'Use personal protective equipment (PPE) such as disposable gloves and other precautions ' +
      'for cleaning up dead rodents and their urine, droppings, nesting or other contaminated ' +
      'materials or surfaces.',
  },
  {
    sourceSection: 'Sec. XIV — Procedures for Safe Cleanup',
    shortTitle: 'Dead animal disposal — disinfect, double-bag in 2 plastic bags, covered garbage can',
    verbatimText:
      'Spray dead animal with a disinfectant or chlorine solution to kill mites, fleas and other ' +
      'organisms. Place the dead animal or bird into 2 plastic bags and seal it. Promptly dispose ' +
      'of the wrapped animal or bird into a covered garbage can.',
  },
  {
    sourceSection: 'Sec. XIV — Procedures for Safe Cleanup',
    shortTitle: 'Post-cleanup hand hygiene — soap/water or alcohol-based hand gel',
    verbatimText:
      'After removing gloves, thoroughly wash hands with soap and water, or use an alcohol-based ' +
      'hand gel when soap and water are not immediately available.',
  },
  {
    sourceSection: 'Appendix A — CA Business & Professions Code Sec. 8538',
    shortTitle: 'Pesticide advance notice — written notice to owner/manager/occupant required',
    verbatimText:
      'A registered structural pest control company shall provide the owner, or owner\'s agent, ' +
      'and tenant of the premises for which the work is to be done with clear written notice ' +
      'prior to performing any pest control work. (Referenced per Director\'s Rules Appendix A.)',
  },
];

// ── Violation code → standards mapping ───────────────────────────────────────
// Keys are SFHC short-code substrings matched against the violation code field.

const VIOLATION_STANDARDS_MAP: Array<{ codeSubstring: string; categories: StandardsCategory[] }> = [
  {
    codeSubstring: '581(b)(13)',
    categories: [
      { name: 'Structural Gaps & Sealing', entries: STRUCTURAL_GAPS_SEALING },
      { name: 'Landscape Clear Distances', entries: LANDSCAPE_CLEAR_DISTANCES },
      { name: 'Material Storage & Stacking', entries: MATERIAL_STORAGE_STACKING },
    ],
  },
  {
    codeSubstring: '581(b)(7)',
    categories: [
      { name: 'Structural Gaps & Sealing', entries: STRUCTURAL_GAPS_SEALING },
      { name: 'Screen Mesh Standards', entries: SCREEN_MESH_STANDARDS },
    ],
  },
  {
    // Human/Animal Waste — check before generic (b)(1) to avoid partial match swallowing it
    codeSubstring: '581(b)(1),(5)',
    categories: [
      { name: 'Biohazard & Chemical Protocols', entries: BIOHAZARD_CHEMICAL_PROTOCOLS },
    ],
  },
  {
    // Garbage/Refuse/Waste — generic (b)(1)
    codeSubstring: '581(b)(1)',
    categories: [
      { name: 'Material Storage & Stacking', entries: MATERIAL_STORAGE_STACKING },
      { name: 'Biohazard & Chemical Protocols', entries: BIOHAZARD_CHEMICAL_PROTOCOLS },
    ],
  },
  {
    // Unsanitary Conditions — (b)(4)
    codeSubstring: '581(b)(4)',
    categories: [
      { name: 'Biohazard & Chemical Protocols', entries: BIOHAZARD_CHEMICAL_PROTOCOLS },
    ],
  },
  {
    // Excessive Materials
    codeSubstring: '581(b)(18)',
    categories: [
      { name: 'Material Storage & Stacking', entries: MATERIAL_STORAGE_STACKING },
    ],
  },
  {
    // Overgrown Vegetation
    codeSubstring: '581(b)(2)',
    categories: [
      { name: 'Landscape Clear Distances', entries: LANDSCAPE_CLEAR_DISTANCES },
    ],
  },
  {
    // Noxious Insects (flies, mosquitoes, cockroaches) — (b)(8)
    // Placed last so the more-specific (b)(13), (b)(7) entries match first
    codeSubstring: '581(b)(8)',
    categories: [
      { name: 'Screen Mesh Standards', entries: SCREEN_MESH_STANDARDS },
      { name: 'Structural Gaps & Sealing', entries: STRUCTURAL_GAPS_SEALING },
      { name: 'Biohazard & Chemical Protocols', entries: BIOHAZARD_CHEMICAL_PROTOCOLS },
    ],
  },
];

/**
 * Returns the applicable StandardsCategory arrays for a given violation string.
 * Matching is substring-based so "Article 11 § 581(b)(13)" correctly resolves.
 *
 * @param violationText - The violation code or label string from the inspection form.
 * @returns Matched StandardsCategory array (empty if no match).
 */
export function getStandardsForViolationCode(violationText: string): StandardsCategory[] {
  const entry = VIOLATION_STANDARDS_MAP.find(({ codeSubstring }) =>
    violationText.includes(codeSubstring)
  );
  return entry?.categories ?? [];
}

/**
 * Converts matched standards categories into a concise system-prompt block
 * for guided AI corrective-action generation.
 *
 * The AI is instructed to use the exact measurements, distances, and material
 * names as written — no rounding, paraphrasing, or substituting figures.
 */
export function buildStandardsPromptBlock(categories: StandardsCategory[]): string {
  if (categories.length === 0) return '';

  const lines: string[] = [
    'REGULATORY STANDARDS — GUIDED SPECIFICITY:',
    'The following pre-authorized regulatory metrics apply to this violation. ' +
    'You MUST incorporate the exact measurements, distances, and approved material names ' +
    'when writing corrective actions. Do not round, paraphrase, or substitute these figures.',
    '',
  ];

  for (const cat of categories) {
    lines.push(`[${cat.name.toUpperCase()}]`);
    for (const entry of cat.entries) {
      lines.push(`• ${entry.shortTitle}`);
      lines.push(`  Source: ${entry.sourceSection}`);
      lines.push(`  Text: "${entry.verbatimText}"`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
