import { z } from "zod";

export const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  location_id: z.string().optional(),
  owner_name: z.string().optional(),
  owner_address: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  facility_type: z.string().optional(),
  number_of_units: z.number().min(0).optional().nullable(),
  number_of_rooms: z.number().min(0).optional().nullable(),
  healthy_housing: z.boolean().optional(),
  census_tract: z.string().optional(),
  block_lot: z.string().optional(),
  dba: z.string().optional(),
  management_name: z.string().optional(),
  responsible_party: z.string().optional(),
  responsible_party_phone: z.string().optional(),
  responsible_party_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  building_features: z.array(z.string()).optional(),
});

export type LocationData = z.infer<typeof locationSchema>;
