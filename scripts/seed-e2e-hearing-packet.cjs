const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "E2E_TEST_EMAIL",
  "E2E_TEST_PASSWORD",
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;

const seedSlug = process.env.E2E_SEED_SLUG ?? "hearing-packet";
const seedTag = `E2E-${seedSlug}`;
const seedAddress = process.env.E2E_COMPLAINT_ADDRESS ?? `123 ${seedTag} Test St`;
const inspectorName = process.env.E2E_INSPECTOR_NAME ?? "E2E Inspector";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const toDate = (value) => new Date(`${value}T00:00:00Z`);
const toDateString = (value) => value.toISOString().split("T")[0];
const addDays = (value, days) => new Date(value.getTime() + days * 86_400_000);

async function ensureUser() {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  let user = listData?.users?.find(
    (candidate) => candidate.email?.toLowerCase() === testEmail.toLowerCase(),
  );

  if (!user) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: "E2E",
        last_name: "Manager",
      },
    });
    if (createError) throw createError;
    user = created.user;
  } else {
    // Update password for existing user
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: testPassword,
    });
    if (updateError) throw updateError;
  }

  if (!user) throw new Error("Unable to create or locate test user.");

  const profilePayload = {
    id: user.id,
    email: testEmail,
    first_name: "E2E",
    last_name: "Manager",
    role: "Program Manager",
    signature_text: "E2E Manager",
    signature_style: "Style 1 — Classic",
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("users")
    .upsert(profilePayload, { onConflict: "id" });
  if (profileError) throw profileError;

  return user;
}

async function ensureComplaint(assignedTo, hearingDate) {
  const { data: existing, error: existingError } = await supabase
    .from("complaints")
    .select("id, legacy_complaint_id")
    .eq("legacy_complaint_id", seedTag)
    .is("deleted_at", null)
    .maybeSingle();
  if (existingError) throw existingError;

  const payload = {
    legacy_complaint_id: seedTag,
    address: seedAddress,
    description: `E2E hearing packet seed for ${seedTag}`,
    status: "Escalated",
    assigned_to: assignedTo,
    hearing_status: "Referred",
    hearing_date: hearingDate,
    date_entered: toDateString(addDays(new Date(), -3)),
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("complaints")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  const { data: created, error: createError } = await supabase
    .from("complaints")
    .insert(payload)
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

async function ensureInspection(complaintId, inspectionDate) {
  const { data: existing, error: existingError } = await supabase
    .from("inspections")
    .select("inspection_id")
    .eq("complaint_id", complaintId)
    .is("deleted_at", null)
    .order("inspection_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.inspection_id) return existing.inspection_id;

  const { data, error } = await supabase
    .from("inspections")
    .insert({
      complaint_id: complaintId,
      inspector: inspectorName,
      inspection_date: inspectionDate,
      inspection_type: "Complaint",
      status: "Submitted",
      facility_address: seedAddress,
      legacy_complaint_ref: seedTag,
      updated_at: new Date().toISOString(),
    })
    .select("inspection_id")
    .single();
  if (error) throw error;
  return data.inspection_id;
}

async function ensureInspectionPhoto(inspectionId, complaintId, photoDate) {
  const { data: existing, error: existingError } = await supabase
    .from("inspection_photos")
    .select("id")
    .eq("inspection_id", inspectionId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const photoPayload = {
    inspection_id: inspectionId,
    complaint_id: complaintId,
    photo_url: "https://placehold.co/800x600/png?text=E2E+Photo",
    photo_type: "Violation",
    caption: "E2E inspection photo",
    violation_label: "§ 581(b)(4)",
    uploaded_at: `${photoDate}T10:30:00Z`,
    legacy_complaint_ref: seedTag,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("inspection_photos")
    .insert(photoPayload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureChronology(complaintId, inspectionDate) {
  const { data: existing, error: existingError } = await supabase
    .from("chronology")
    .select("id")
    .eq("complaint_id", complaintId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("chronology")
    .insert({
      complaint_id: complaintId,
      summary: "Initial inspection conducted; violations documented.",
      entry_date: inspectionDate,
      entry_type: "Inspection",
      created_by: inspectorName,
      visibility: "Public",
      chronology_order: 1,
      citation_code: "§ 581(b)(4) — Unsanitary Conditions",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureServiceLog(complaintId, noticeDate) {
  const { data: existing, error: existingError } = await supabase
    .from("service_log")
    .select("id")
    .eq("complaint_id", complaintId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("service_log")
    .insert({
      complaint_id: complaintId,
      notice_type: "Notice of Hearing",
      service_method: "Certified Mail",
      service_date: noticeDate,
      recipient: "E2E Respondent",
      status: "Mailed",
      proof_of_service: true,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertPacket(complaintId, hearingDate, noticeServiceDate) {
  const caseNumber =
    process.env.E2E_CASE_NUMBER ??
    `#HHP-${String(new Date().getFullYear()).slice(-2)}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const basePayload = {
    hearing_date: hearingDate,
    packet_status: "In Progress",
    assigned_to: testEmail,
    case_number: caseNumber,
    program_code: "HHP",
    hearing_time: "10:00 AM",
    hearing_location: "49 South Van Ness Ave.",
    packet_type: "Draft",
    proposed_actions: ["declare_nuisance"],
    enforcement_json: { enforcementSummary: "E2E enforcement summary" },
    chronology_snapshot: `${noticeServiceDate}  |  Inspection  |  Initial inspection documented`,
    exhibit_labeling_complete: true,
    page_numbering_complete: true,
    notice_service_date: noticeServiceDate,
    generated_at: addDays(toDate(hearingDate), -6).toISOString(),
    inspector_signature: JSON.stringify({
      text: "E2E Inspector",
      style: "Style 1 — Classic",
    }),
    manager_signature: JSON.stringify({
      text: "E2E Manager",
      style: "Style 1 — Classic",
    }),
    updated_at: new Date().toISOString(),
  };

  let packet = await supabase
    .from("hearing_packets")
    .select("id")
    .eq("complaint_id", complaintId)
    .is("deleted_at", null)
    .maybeSingle();

  if (packet.error && packet.error.message?.includes("complaint_id")) {
    packet = await supabase
      .from("hearing_packets")
      .select("id")
      .eq("complaint_uuid", complaintId)
      .is("deleted_at", null)
      .maybeSingle();
  }

  if (packet.data?.id) {
    const updateAttempt = await supabase
      .from("hearing_packets")
      .update(basePayload)
      .eq("id", packet.data.id)
      .select("id")
      .single();

    if (updateAttempt.error && updateAttempt.error.message?.includes("complaint_id")) {
      const fallback = { ...basePayload, complaint_uuid: complaintId, complaint: seedTag };
      const { error } = await supabase
        .from("hearing_packets")
        .update(fallback)
        .eq("id", packet.data.id);
      if (error) throw error;
    } else if (updateAttempt.error) {
      throw updateAttempt.error;
    }
    return packet.data.id;
  }

  const insertPayload = {
    ...basePayload,
    complaint_id: complaintId,
    legacy_complaint_ref: seedTag,
  };

  let insertResult = await supabase
    .from("hearing_packets")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertResult.error && insertResult.error.message?.includes("complaint_id")) {
    insertResult = await supabase
      .from("hearing_packets")
      .insert({
        ...basePayload,
        complaint_uuid: complaintId,
        complaint: seedTag,
      })
      .select("id")
      .single();
  }

  if (insertResult.error) throw insertResult.error;
  return insertResult.data.id;
}

async function run() {
  console.log(`Seeding hearing packet data for ${seedTag}...`);

  await ensureUser();

  const hearingDate = process.env.E2E_HEARING_DATE ?? toDateString(addDays(new Date(), 21));
  const noticeServiceDate = toDateString(addDays(toDate(hearingDate), -14));
  const inspectionDate = toDateString(addDays(toDate(hearingDate), -30));

  const complaintId = await ensureComplaint(testEmail, hearingDate);
  const inspectionId = await ensureInspection(complaintId, inspectionDate);
  await ensureInspectionPhoto(inspectionId, complaintId, inspectionDate);
  await ensureChronology(complaintId, inspectionDate);
  await ensureServiceLog(complaintId, noticeServiceDate);
  const packetId = await upsertPacket(complaintId, hearingDate, noticeServiceDate);

  console.log("Seed complete:", {
    complaintId,
    inspectionId,
    packetId,
    hearingDate,
  });
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
