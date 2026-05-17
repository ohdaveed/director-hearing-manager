/**
 * badgeThemes.ts
 *
 * Unified theme registry for all badge/pill styling across the app.
 * Every status badge, violation badge, photo type badge, and action-panel
 * party indicator pulls its Tailwind classes from this single source of truth.
 *
 * Badge hierarchy (three tiers):
 *  Tier 1 – Neutral/working:  New, Monitoring, Closed variants
 *  Tier 2 – Active/progress:  Contact Pending, Inspection Scheduled
 *  Tier 3 – Critical/urgent:  NOV Issued, Re-Inspection Due (warning)
 *                              Non-Compliant, Escalated (destructive)
 */

import type { ComplaintStatus } from "./complaintStatuses";

// ── Complaint status badges ───────────────────────────────────────────────────

/** Tailwind CSS classes for complaint status badges (three-tier hierarchy). */
export const COMPLAINT_STATUS_THEME: Record<ComplaintStatus, string> = {
  // Tier 1 — Neutral / working states
  New: "bg-muted text-muted-foreground",
  Monitoring: "bg-muted text-muted-foreground",
  "Closed — Compliant": "bg-success/10 text-success",
  "Closed — No Violation": "bg-muted text-muted-foreground",
  "Closed — Unfounded": "bg-muted text-muted-foreground",
  Withdrawn: "bg-muted text-muted-foreground",
  "Referred to Outside Agency": "bg-muted text-muted-foreground",

  // Tier 2 — Active / in-progress states
  "Contact Pending": "bg-primary/10 text-primary",
  "Inspection Scheduled": "bg-primary/10 text-primary",

  // Tier 3 — Compliance-critical / high-urgency states
  "NOV Issued": "bg-accent/20 text-accent-foreground font-semibold",
  "Re-Inspection Due": "bg-accent/20 text-accent-foreground font-semibold",
  "Non-Compliant": "bg-destructive/10 text-destructive font-semibold",
  Escalated: "bg-destructive/20 text-destructive font-semibold",
};

// ── Inspection status badges ──────────────────────────────────────────────────

/**
 * Badge classes for inspection-level statuses (Draft / Submitted).
 * Draft uses a dashed border + muted fill so it is visually distinct from
 * compliance-critical complaint badges.
 */
export const INSPECTION_STATUS_THEME: Record<string, string> = {
  Submitted: "bg-primary/10 text-primary",
  Draft: "bg-muted/60 text-muted-foreground border border-dashed border-border",
};

// ── Violation due-date badges ─────────────────────────────────────────────────

/**
 * Badge classes for violation due-date urgency indicators.
 * 48hrs = critical (destructive), 30days = standard (muted), 90days = extended (warning).
 */
export const VIOLATION_DUE_BADGE_THEME: Record<string, string> = {
  "48hrs": "bg-destructive/10 text-destructive border-destructive/30",
  "30days": "bg-muted text-muted-foreground border-border",
  "90days": "bg-accent/10 text-accent-foreground border-accent/30",
};

// ── Photo type badges ─────────────────────────────────────────────────────────

/**
 * Badge classes for inspection photo categories.
 * Violation = destructive, Abatement = success, Memo = primary, General = muted.
 */
export const PHOTO_TYPE_THEME: Record<string, string> = {
  Violation: "bg-destructive/10 text-destructive border-destructive/30",
  Abatement: "bg-success/10 text-success border-success/30",
  "Memo of Visit": "bg-primary/10 text-primary border-primary/30",
  General: "bg-muted text-muted-foreground border-border",
};

// ── Action party theme (Owner / Tenant) ───────────────────────────────────────

/**
 * Icon and badge backgrounds for Owner vs Tenant action assignment panels.
 * Owner = primary blue tint, Tenant = accent/secondary tint.
 */
export const ACTION_PARTY_THEME: Record<
  "Owner" | "Tenant",
  { icon: string; badge: string }
> = {
  Owner: {
    icon: "bg-primary/15 text-primary",
    badge: "bg-primary/15 text-primary",
  },
  Tenant: {
    icon: "bg-accent/15 text-accent-foreground",
    badge: "bg-accent/15 text-accent-foreground",
  },
};
