import { z } from "zod";

export const inspectionSchema = z.object({
  inspection_date: z.string().min(1, "Inspection date is required"),
  time_in: z.string().optional(),
  time_out: z.string().optional(),
  inspection_type: z.string().min(1, "Inspection type is required"),
  inspection_rating: z.enum(["Satisfactory", "Unsatisfactory"]).optional(),
  access_granted_by: z.string().optional(),
  dba: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  notes: z.string().optional(),
  global_observations: z.array(z.string()).optional(),
  areas_inspected: z.array(z.string()).optional(),
});

export type InspectionData = z.infer<typeof inspectionSchema>;
