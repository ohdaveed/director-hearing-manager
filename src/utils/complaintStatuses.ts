/**
 * complaintStatuses.ts
 *
 * Single source of truth for complaint status values, display colours, and
 * status-related helper functions used across pages and components.
 *
 * Badge hierarchy (three tiers):
 *  Tier 1 – Neutral/working:  New, Monitoring, Closed variants
 *  Tier 2 – Active/progress:  Contact Pending, Inspection Scheduled
 *  Tier 3 – Critical/urgent:  NOV Issued, Re-Inspection Due (warning)
 *                              Non-Compliant, Escalated (destructive)
 *
 * Inspection-level statuses (Draft / Submitted) are styled separately
 * inside the inspection history rows — Draft uses a dashed-border neutral
 * pill so it doesn't compete with compliance-critical complaint badges.
 */

// ── Status arrays ─────────────────────────────────────────────────────────────

/** Statuses that represent an open/active complaint requiring attention. */
export const ACTIVE_STATUSES = [
  "New",
  "Contact Pending",
  "Inspection Scheduled",
  "NOV Issued",
  "Re-Inspection Due",
  "Non-Compliant",
  "Escalated",
  "Monitoring",
] as const;

/** Statuses that mark a complaint as resolved / no longer active. */
export const CLOSURE_STATUSES = [
  "Closed — Compliant",
  "Closed — No Violation",
  "Closed — Unfounded",
  "Withdrawn",
  "Referred to Outside Agency",
] as const;

/** All valid complaint statuses in workflow order (active first, then closures). */
export const ALL_COMPLAINT_STATUSES = [...ACTIVE_STATUSES, ...CLOSURE_STATUSES] as const;

export type ComplaintStatus = (typeof ALL_COMPLAINT_STATUSES)[number];

// ── Badge colours ─────────────────────────────────────────────────────────────
// Badge theme classes have been moved to src/utils/badgeThemes.ts for centralized styling.
// Import COMPLAINT_STATUS_THEME and INSPECTION_STATUS_THEME from there instead.

// ── Status descriptions ───────────────────────────────────────────────────────

/** One-line description shown in the status dropdown to guide inspectors. */
export const STATUS_DESCRIPTIONS: Record<string, string> = {
  New: "Received, pending review",
  "Contact Pending": "Attempting to reach responsible party",
  "Inspection Scheduled": "Access arranged, site visit planned",
  "NOV Issued": "Notice of Violation sent, corrective action required",
  "Re-Inspection Due": "Waiting to verify corrective action",
  "Non-Compliant": "Past deadline — violations unresolved",
  Escalated: "Referred to Director's Hearing or enforcement",
  Monitoring: "Requires ongoing follow-up",
  "Closed — Compliant": "All violations abated ✓",
  "Closed — No Violation": "Inspected — no violations found",
  "Closed — Unfounded": "Could not verify or complaint withdrawn",
  Withdrawn: "Complainant withdrew the complaint",
  "Referred to Outside Agency": "Referred to another agency for action",
};

// ── Hearing status ────────────────────────────────────────────────────────────

/** All valid hearing-status values in progression order. */
export const HEARING_STATUS_OPTIONS = [
  "None",
  "Referral Pending",
  "Referred",
  "Hearing Scheduled",
  "Heard",
  "Decision Issued",
] as const;

export type HearingStatus = (typeof HEARING_STATUS_OPTIONS)[number];

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Returns true when the complaint status is one of the closure statuses.
 * Useful for preventing edits on resolved complaints.
 */
export const isClosedStatus = (s: string): boolean =>
  (CLOSURE_STATUSES as readonly string[]).includes(s);

/**
 * Returns true when a complaint is past its re-inspection due date.
 */
export function isOverdue(c: {
  status?: string | null;
  reinspection_due_on_after?: string | null;
}): boolean {
  if (c.status !== "Re-Inspection Due") return false;
  if (!c.reinspection_due_on_after) return false;
  return new Date(c.reinspection_due_on_after + "T00:00:00") < new Date();
}
