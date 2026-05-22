import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import OpenAI from "openai";
import postgres from "postgres";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

const sql = postgres(process.env.DATABASE_URL);

const PDF_PATH = "50 Rizal Street- Directors Hearing Packet.pdf";

async function extractTextFromPdf(path) {
  const data = new Uint8Array(fs.readFileSync(path));
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += `--- Page ${i} ---\n` + strings.join(" ") + "\n\n";
  }

  return fullText;
}

const SYSTEM_PROMPT = `
You are an expert San Francisco Department of Public Health data analyst.
You will be provided with the text of a "Director's Hearing Packet" for a property at 50 Rizal Street.
Your task is to extract structured data to seed a database.

ENTITY SCHEMA:

1. Location:
   - address: string
   - dba: string (Doing Business As)
   - owner_name: string
   - owner_address: string
   - facility_type: "Tourist Hotel" | "Residential Hotel" | "Apartments" | "Residential Property" | "Vacant Lot" | "City Owned Property" | "Other"
   - number_of_units: number
   - block_lot: string

2. Complaint:
   - legacy_complaint_id: string (e.g., "HHP-25-06" or numeric ID)
   - date_received: date (YYYY-MM-DD)
   - status: "New" | "Contact Pending" | "Inspection Scheduled" | "NOV Issued" | "Re-Inspection Due" | "Non-Compliant" | "Escalated" | "Monitoring" | "Closed — Compliant" | "Closed — No Violation" | "Closed — Unfounded" | "Open" | "Withdrawn" | "Referred to Outside Agency"
   - description: string
   - hearing_status: "none" | "scheduled" | "held" | "cancelled" | "referral_pending"
   - purpose_of_hearing: string

3. Inspections: (List of inspections found in the packet)
   - inspection_date: date (YYYY-MM-DD)
   - inspector: string
   - inspection_type: "Routine" | "Routine Re-inspection" | "Complaint" | "Complaint Re-inspection" | "Citation to Hearing Issued" | "Field Consultation / Survey" | "Imported"
   - notes: string

4. Violations: (Linked to specific inspections)
   - violation_code: string (SF Health Code Article 11, e.g., § 581(b)(2))
   - observation: string
   - corrective_action: string
   - status: "Violation" | "Abated" | "Corrected on Site"

5. Chronology: (List of all events in the case)
   - entry_date: date (YYYY-MM-DD)
   - entry_type: "Inspection" | "NOV" | "Re-inspection" | "Contact Attempt" | "Hearing Referral" | "Other"
   - summary: string

OUTPUT FORMAT:
Return a single JSON object with these keys: "location", "complaint", "inspections", "chronology".
Each inspection in "inspections" should have a "violations" array.
`;

async function main() {
  let data;
  if (fs.existsSync("scripts/reference_data.json")) {
    console.log("Loading data from scripts/reference_data.json...");
    data = JSON.parse(fs.readFileSync("scripts/reference_data.json", "utf8"));
  } else {
    console.log("Extracting text from PDF...");
    const text = await extractTextFromPdf(PDF_PATH);
    console.log(`Extracted ${text.length} characters.`);

    console.log("Sending to OpenAI GPT-4o...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract the data from this hearing packet text:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    data = JSON.parse(content);
    console.log("Data extracted successfully.");
    
    // Save to file for debugging
    fs.writeFileSync("scripts/reference_data.json", JSON.stringify(data, null, 2));
    console.log("Data saved to scripts/reference_data.json");
  }

  console.log("Seeding database...");
  await sql.begin(async (sql) => {
    // Cleanup existing 50 Rizal Street data
    console.log("Cleaning up existing data for 50 Rizal Street...");
    
    // Find complaint IDs first
    const existingComplaints = await sql`SELECT id FROM complaints WHERE address = '50 Rizal Street'`;
    const compIds = existingComplaints.map(c => c.id);

    if (compIds.length > 0) {
      console.log(`Found ${compIds.length} existing complaints. Cleaning up...`);
      await sql`DELETE FROM violations WHERE complaint_uuid = ANY(${compIds})`;
      await sql`DELETE FROM chronology WHERE complaint_id = ANY(${compIds})`;
      await sql`DELETE FROM inspections WHERE complaint_id = ANY(${compIds})`;
      await sql`DELETE FROM complaints WHERE id = ANY(${compIds})`;
    }
    await sql`DELETE FROM locations WHERE address = '50 Rizal Street'`;

    // 1. Location
    const [location] = await sql`
      INSERT INTO locations ${sql(data.location)}
      RETURNING id
    `;
    const locationId = location.id;

    // 2. Complaint
    const complaintData = {
      legacy_complaint_id: data.complaint.legacy_complaint_id,
      date_entered: data.complaint.date_received,
      status: data.complaint.status,
      description: data.complaint.description,
      hearing_status: data.complaint.hearing_status === "held" ? "Heard" : 
                      data.complaint.hearing_status === "scheduled" ? "Hearing Scheduled" :
                      data.complaint.hearing_status === "none" ? "None" : "None",
      purpose_of_hearing: data.complaint.purpose_of_hearing,
      address: data.location.address,
      facility_name: data.location.dba || data.location.owner_name
    };

    const [complaint] = await sql`
      INSERT INTO complaints ${sql(complaintData)}
      RETURNING id
    `;
    const complaintId = complaint.id;

    // 3. Inspections & Violations
    for (const insp of data.inspections) {
      const { violations, ...inspData } = insp;
      
      // Map inspection type to enum
      let mappedType = inspData.inspection_type;
      if (mappedType === "Re-inspection") mappedType = "Complaint Re-inspection";
      if (mappedType === "Complaint") mappedType = "Complaint";
      // Ensure it matches one of the enum values
      const validTypes = ["Routine", "Routine Re-inspection", "Complaint", "Complaint Re-inspection", "Citation to Hearing Issued", "Field Consultation / Survey", "Imported"];
      if (!validTypes.includes(mappedType)) mappedType = "Imported";

      const [inspection] = await sql`
        INSERT INTO inspections ${sql({
          inspection_date: inspData.inspection_date,
          inspector: inspData.inspector,
          inspection_type: mappedType,
          notes: inspData.notes,
          complaint_id: complaintId,
          location_id: locationId,
          facility_address: data.location.address
        })}
        RETURNING inspection_id
      `;
      const inspectionId = inspection.inspection_id;

      if (violations && violations.length > 0) {
        await sql`
          INSERT INTO violations ${sql(
            violations.map((v) => ({
              ...v,
              inspection_id: inspectionId,
              complaint_uuid: complaintId
            }))
          )}
        `;
      }
    }

    // 4. Chronology
    if (data.chronology && data.chronology.length > 0) {
      await sql`
        INSERT INTO chronology ${sql(
          data.chronology.map((c) => ({
            ...c,
            complaint_id: complaintId
          }))
        )}
      `;
    }
  });

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
