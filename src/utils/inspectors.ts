/**
 * inspectors.ts
 *
 * Single source of truth for the list of inspectors used throughout the app.
 *
 * We store assignments using emails in the database for RLS compatibility,
 * but display full names in the UI.
 */

export interface Inspector {
  name: string;
  email: string;
}

export const INSPECTORS: Inspector[] = [
  { name: "David Arrizon", email: "david.arrizon@sfdph.org" },
  { name: "Adaku Ude", email: "adaku.ude@sfdph.org" },
];

export type InspectorName = (typeof INSPECTORS)[number]["name"];
