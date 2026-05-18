import { supabase } from "@/lib/supabase";
import { normalizeAddressQuery } from "@/utils/normalizeAddressQuery";

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
  async search(query: string) {
    const normalized = normalizeAddressQuery(query);
    if (!normalized) return [];

    const { data, error } = await supabase
      .from("locations")
      .select(LOCATION_LIST_COLUMNS)
      .or(`address.ilike.%${normalized}%,location_id.ilike.%${normalized}%`)
      .is("deleted_at", null)
      .limit(20);

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("locations")
      .select(
        `
        ${LOCATION_FULL_COLUMNS},
        inspections (
          inspection_id, inspection_date, inspector, inspection_type,
          inspection_rating, status, deleted_at
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return {
      location: data,
      inspections: data.inspections || [],
      complaints: [],
    };
  },

  async create(data: any) {
    const { data: result, error } = await supabase
      .from("locations")
      .insert([data])
      .select(LOCATION_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return result;
  },

  async findByLocationId(locationId: string) {
    const { data, error } = await supabase
      .from("locations")
      .select("id")
      .eq("location_id", locationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("locations")
      .update({
        ...updates,
      })
      .eq("id", id)
      .select(LOCATION_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },
};
