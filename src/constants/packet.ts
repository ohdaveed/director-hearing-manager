export const MANAGER_ROLES = ["Program Manager", "Admin", "Super Admin"] as const;

export const PROGRAM_CODES = ["HHV", "HHP", "VEC", "ENV"] as const;

export const STATUS_BADGE: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  "Under Review": "bg-warning/10 text-warning",
  "Changes Requested": "bg-destructive/10 text-destructive",
  Approved: "bg-success/10 text-success",
  Complete: "bg-success/10 text-success",
  Submitted: "bg-primary/10 text-primary",
};

export const VALIDATION_BADGE: Record<string, string> = {
  pass: "bg-success/10 text-success border-success/20",
  fail: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

export const EVENT_BADGE: Record<string, string> = {
  success: "bg-success/10 text-success border-success/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-muted text-muted-foreground border-border",
};

export const PROPOSED_ACTION_OPTIONS = [
  { label: "Declare Nuisance", value: "declare_nuisance" },
  { label: "Assess Fines", value: "assess_fines" },
  { label: "Permit Suspension", value: "permit_suspension" },
  { label: "Permit Revocation", value: "permit_revocation" },
  { label: "Other", value: "other" },
] as const;
