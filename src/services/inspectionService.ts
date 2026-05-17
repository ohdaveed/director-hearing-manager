import { supabase } from "@/lib/supabase";

/** Specific column selections to avoid SELECT * */
export const INSPECTION_LIST_COLUMNS = `
  inspection_id, inspection_date, inspector, inspection_type,
  inspection_rating, status, dba, facility_address, notes,
  complaint_id, location_id, submitted_at, deleted_at, created_at, updated_at
`;

export const INSPECTION_FULL_COLUMNS = `
  ${INSPECTION_LIST_COLUMNS},
  time_in, time_out, access_granted_by, contact_phone, contact_email,
  violation_count, completed_report, imported_reports
`;

export const VIOLATION_COLUMNS = `
  id, violation_label, violation_code, category,
  location_in_property, corrective_action, due_date,
  responsible_party, status, observation, exhibit_refs,
  complaint, deleted_at, created_at, updated_at
`;

export const PHOTO_COLUMNS = `
  id, photo_url, photo_type, caption, violation_label,
  complaint_id, inspector, deleted_at, created_at
`;

export const inspectionService = {
  async getAll() {
    const { data, error } = await supabase
      .from("inspections")
      .select(
        `
        ${INSPECTION_LIST_COLUMNS},
        locations ( id, address, location_id )
      `,
      )
      .is("deleted_at", null)
      .order("inspection_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("inspections")
      .select(
        `
        ${INSPECTION_FULL_COLUMNS},
        violations (
          ${VIOLATION_COLUMNS}
        ),
        inspection_photos (
          ${PHOTO_COLUMNS}
        )
      `,
      )
      .eq("inspection_id", id)
      .is("violations.deleted_at", null)
      .is("inspection_photos.deleted_at", null)
      .single();

    if (error) throw error;
    return data;
  },

  async save(inspection: any) {
    const {
      violations,
      photos,
      isDraft: _isDraft,
      summary,
      global_observations: _globalObs,
      areas_inspected: _areas,
      ...rest
    } = inspection;

    // Transform fields to match database schema
    const inspectionData = {
      ...rest,
      notes: summary, // map summary to notes column
      updated_at: new Date().toISOString(),
    };

    const { data: savedInspection, error: inspectionError } = await supabase
      .from("inspections")
      .upsert(inspectionData)
      .select(INSPECTION_LIST_COLUMNS)
      .single();

    if (inspectionError) throw inspectionError;
    const inspectionId = savedInspection.inspection_id;

    const ops: Promise<void>[] = [];

    if (violations && violations.length > 0) {
      const violationsWithId = violations.map((v: any) => ({
        ...v,
        inspection: String(inspectionId),
        inspection_uuid: inspectionId,
        updated_at: new Date().toISOString(),
      }));

      ops.push(
        (async () => {
          const { error } = await supabase
            .from("violations")
            .upsert(violationsWithId, { onConflict: "id" })
            .select();
          if (error) throw error;
        })(),
      );
    }

    if (photos && photos.length > 0) {
      const photosWithInspectionId = photos.map((p: any) => ({
        ...p,
        inspection_id: String(inspectionId),
        inspection_uuid: inspectionId,
        updated_at: new Date().toISOString(),
      }));

      ops.push(
        (async () => {
          const { error } = await supabase
            .from("inspection_photos")
            .upsert(photosWithInspectionId, { onConflict: "id" })
            .select();
          if (error) throw error;
        })(),
      );
    }

    await Promise.all(ops);

    return savedInspection;
  },
};
