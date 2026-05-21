import { supabase } from "@/lib/supabase";
import { normalizeAddressQuery } from "@/utils/normalizeAddressQuery";
import { Database } from "@/types/database";

type Location = Database["public"]["Tables"]["locations"]["Row"];
type LocationInsert = Database["public"]["Tables"]["locations"]["Insert"];
type LocationUpdate = Database["public"]["Tables"]["locations"]["Update"];

export const LOCATION_LIST_COLUMNS = `
  id, address, location_id, owner_name, owner_address,
  owner_phone, owner_email, facility_type, dba,
  number_of_units, number_of_rooms, deleted_at
`;

export const LOCATION_FULL_COLUMNS = `
  ${LOCATION_LIST_COLUMNS},
  healthy_housing, census_tract, current_fees,
  block_lot, management_name, responsible_party,
  responsible_party_phone, responsible_party_email,
  building_features, verification_date, imported_reports
`;

export const locationService = {
  async search(query: string): Promise<Location[]> {
    const normalized = normalizeAddressQuery(query);
    if (!normalized) return [];

    const { data, error } = await supabase
      .from("locations")
      .select(LOCATION_LIST_COLUMNS)
      .or(`address.ilike.%${normalized}%,location_id.ilike.%${normalized}%`)
      .is("deleted_at", null)
      .limit(20);

    if (error) throw error;
    return data as Location[];
  },

  async getById(
    id: string,
  ): Promise<{ location: Location; inspections: any[]; complaints: any[] }> {
    const { data, error } = await supabase
      .from("locations")
      .select(
        `
        ${LOCATION_FULL_COLUMNS},
        inspections!location_id (
          inspection_id, inspection_date, inspector, inspection_type,
          inspection_rating, status, deleted_at
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return {
      location: data as any as Location,
      inspections: (data as any).inspections || [],
      complaints: [],
    };
  },

  async create(data: LocationInsert): Promise<Location> {
    const { data: result, error } = await supabase
      .from("locations")
      .insert([data])
      .select(LOCATION_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return result as Location;
  },

  async getRecent(limit: number = 5): Promise<Location[]> {
    const { data, error } = await supabase
      .from("locations")
      .select(LOCATION_LIST_COLUMNS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Location[];
  },

  async findByLocationId(locationId: string): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from("locations")
      .select("id")
      .eq("location_id", locationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: LocationUpdate): Promise<Location> {
    const { data, error } = await supabase
      .from("locations")
      .update({
        ...updates,
      })
      .eq("id", id)
      .select(LOCATION_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data as Location;
  },
};
