import { z } from "zod";

export const enforcementFlagsSchema = z.object({
  nuisanceAbatement: z.boolean().default(false),
  costRecovery: z.boolean().default(false),
  appealHealthPermit: z.boolean().default(false),
  appealNonPermitted: z.boolean().default(false),
});

export const statusHistoryEntrySchema = z.object({
  timestamp: z.string(),
  userName: z.string().optional(),
  fromStatus: z.string().optional(),
  toStatus: z.string().optional(),
  action: z.string().optional(),
  notes: z.string().optional(),
});

export const packetValidationResultSchema = z.object({
  rule_slug: z.string(),
  status: z.string(),
  severity: z.string().optional(),
  message: z.string().optional(),
}).passthrough();

export const checklistSchema = z.record(z.string(), z.boolean());

export const packetSnapshotSchema = z.record(z.string(), z.unknown());

export type EnforcementFlags = z.infer<typeof enforcementFlagsSchema>;
export type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;
export type PacketValidationResult = z.infer<typeof packetValidationResultSchema>;
export type ChecklistData = z.infer<typeof checklistSchema>;
export type PacketSnapshot = z.infer<typeof packetSnapshotSchema>;
