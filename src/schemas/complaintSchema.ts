import { z } from "zod";

export const complaintFormSchema = z.object({
  complaintId: z.string().optional().default(""),
  caseNumber311: z.string().optional().default(""),
  dateReceived: z.string().min(1, "Date received is required"),
  locAddress: z.string().min(1, "Property address is required"),
  locLocationId: z.string().optional().default(""),
  locBlockLot: z.string().optional().default(""),
  locOwnerName: z.string().optional().default(""),
  locOwnerAddress: z.string().optional().default(""),
  locOwnerPhone: z.string().optional().default(""),
  locOwnerEmail: z
    .string()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email format")
    .optional()
    .default(""),
  locFacilityType: z.string().optional().default(""),
  locNumUnits: z.string().optional().default(""),
  locHealthyHousing: z.boolean().optional().default(false),
  locCensusTract: z.string().optional().default(""),
  unitNumber: z.string().optional().default(""),
  facilityName: z.string().optional().default(""),
  facilityOwnership: z.string().optional().default(""),
  complaintType: z.string().min(1, "Complaint type is required"),
  complaintSubtype: z.string().optional().default(""),
  methodReceived: z.string().min(1, "Method received is required"),
  assignedProgram: z.string().min(1, "Assigned program is required"),
  dateAssigned: z.string().min(1, "Date assigned is required"),
  description: z.string().min(1, "Description is required"),
  categories: z.array(z.string()).optional().default([]),
  assignedTo: z.string().min(1, "Inspector assignment is required"),
  complainantAnonymous: z.boolean().optional().default(false),
  complainantName: z.string().optional().default(""),
  complainantPhone: z.string().optional().default(""),
  complainantEmail: z
    .string()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email format")
    .optional()
    .default(""),
  complainantAddress: z.string().optional().default(""),
  complainantContactDates: z.string().optional().default(""),
  status: z.string().optional().default("New"),
  dateClosed: z.string().optional().default(""),
  // Hearing Information
  hearing_rp_name: z.string().optional().default(""),
  hearing_rp_phone: z.string().optional().default(""),
  hearing_rp_email: z
    .string()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email format")
    .optional()
    .default(""),
  hearing_rp_address: z.string().optional().default(""),
  purpose_of_hearing: z.string().optional().default(""),
  notice_of_hearing_date: z.string().optional().default(""),
  hearing_order_date: z.string().optional().default(""),
});

export type ComplaintFormData = z.infer<typeof complaintFormSchema>;
