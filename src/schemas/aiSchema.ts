import { z } from "zod";

export const aiViolationSchema = z.object({
  code: z.string(),
  observation: z.string(),
  correctiveAction: z.string(),
  regulatoryStandards: z.string().optional(),
});

export const aiViolationListSchema = z.array(aiViolationSchema);

export const complianceIssueSchema = z.object({
  id: z.string(),
  category: z.enum([
    "missing_section",
    "incorrect_sequence",
    "formatting",
    "content",
    "missing_element",
  ]),
  severity: z.enum(["critical", "major", "minor", "info"]),
  description: z.string(),
  location: z.string().optional(),
  suggestion: z.string(),
  reference: z.string().optional(),
});

export const complianceResultSchema = z.object({
  isCompliant: z.boolean(),
  score: z.number(),
  issues: z.array(complianceIssueSchema),
  summary: z.string(),
  missingSections: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type AIViolation = z.infer<typeof aiViolationSchema>;
export type ComplianceIssue = z.infer<typeof complianceIssueSchema>;
export type ComplianceResult = z.infer<typeof complianceResultSchema>;
