/**
 * inspectors.ts
 *
 * Single source of truth for the list of inspector names used throughout the app.
 * Names must exactly match the "Assigned To" field values stored in the database,
 * as they are used both for filtering complaints and for display in dropdowns.
 *
 * When a new inspector joins, add their full name here and the inspector dropdown
 * on AllComplaintsPage, InspectionHistoryPage, and ComplaintEntryPage will update automatically.
 */

export const INSPECTORS = ['David Arrizon', 'Adaku Ude'] as const;
export type InspectorName = typeof INSPECTORS[number];
