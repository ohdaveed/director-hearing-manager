import { z } from "zod";

export const complaintFormSchema = z.object({
  locAddress: z.string().min(1, "Property address is required"),
  description: z.string().min(1, "Description is required"),
  dateReceived: z.string().min(1, "Date received is required"),
  dateAssigned: z.string().min(1, "Date assigned is required"),
  assignedTo: z.string().min(1, "Inspector assignment is required"),
  complaintType: z.string().min(1, "Complaint type is required"),
  assignedProgram: z.string().min(1, "Assigned program is required"),
  methodReceived: z.string().min(1, "Method received is required"),
  complainantEmail: z
    .string()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Invalid email format",
    )
    .optional()
    .default(""),
  complainantPhone: z.string().optional().default(""),
  locOwnerEmail: z
    .string()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Invalid email format",
    )
    .optional()
    .default(""),
  // Hearing Information
  hearing_rp_name: z.string().optional().default(""),
  hearing_rp_phone: z.string().optional().default(""),
  hearing_rp_email: z
    .string()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Invalid email format",
    )
    .optional()
    .default(""),
  hearing_rp_address: z.string().optional().default(""),
  purpose_of_hearing: z.string().optional().default(""),
  notice_of_hearing_date: z.string().optional().default(""),
  hearing_order_date: z.string().optional().default(""),
});

export type ComplaintFormData = z.infer<typeof complaintFormSchema>;
