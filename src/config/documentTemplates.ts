/**
 * documentTemplates.ts
 *
 * Single source of truth for all SFDPH Director's Hearing Packet document templates.
 *
 * Each template defines:
 *   - STATIC_BLOCKS  — locked boilerplate strings that render verbatim and are never editable
 *   - VARIABLE_SLOTS — typed data positions, each linked to its database source, input widget type,
 *                      editability flag, display format, and validation rules
 *   - LAYOUT_TOKENS  — typography scale and page-margin constants shared by both templates
 *
 * Renderers (PacketCoverPage, PacketNoticeOfViolation) import from this module.
 * The Hearing Prep form imports DOCUMENT_FIELD_REGISTRY to determine which input widget
 * to render for each editable variable slot — keeping the document and form in lockstep.
 *
 * ─── HOW TO UPDATE ────────────────────────────────────────────────────────────────────────
 *  Legal paragraph changed?  → Edit STATIC_BLOCKS.nov.*
 *  Reinspection fee changed? → Edit STATIC_BLOCKS.nov.reinspectionFees (one line)
 *  Mayor / Director changed? → Edit OFFICIALS (one place, all documents inherit it)
 *  New program code added?   → Add to PROGRAM_CODES array
 *  New variable field added? → Add to VARIABLE_SLOTS.* and DOCUMENT_FIELD_REGISTRY
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */

// ─── OFFICIALS ────────────────────────────────────────────────────────────────
// Update here; SFDPHReportHeader and all templates inherit these values.

export const OFFICIALS = {
  mayor: "Daniel Lurie",
  directorOfHealth: "Daniel Tsai",
  ehDirector: "Jennifer Callewaert, MS, REHS",
  ehDirectorTitle: "Acting Director of Environmental Health",
} as const;

// ─── LAYOUT TOKENS ────────────────────────────────────────────────────────────
// Typography scale and margins used across all packet print documents.
// Components import these constants instead of hard-coding values inline.

export const LAYOUT_TOKENS = {
  fontFamily: "Times New Roman, serif",
  pageMargin: "0.75in",
  // Font sizes (pt units — for inline styles)
  pt: {
    coverTitle: "30pt",
    coverSubtitle: "18pt",
    novTitle: "13pt",
    body: "10pt",
    table: "9pt",
    legalSmall: "9pt",
    footer: "8pt",
    contactBlock: "9.5pt",
  },
  // Print page dimensions
  page: {
    width: "8.5in",
    minHeight: "11in",
  },
} as const;

// ─── STATIC BLOCKS ────────────────────────────────────────────────────────────
// All locked boilerplate text. Nothing here is user-editable.
// Renderers import these strings and render them verbatim.

export const STATIC_BLOCKS = {
  // ── Department / office identity ──────────────────────────────────────────
  common: {
    orgName: "City and County of San Francisco",
    deptName: "Department of Public Health",
    sectionName: "Environmental Health Section",
    programName: "Healthy Housing and Vector Control Program",
    officeAddress: "49 South Van Ness Avenue, Suite 600, San Francisco, CA 94103",
    officeAddressShort: "49 South Van Ness Ave. #600",
    officeCity: "San Francisco, CA 94103",
    officePhone: "(415) 252-3800",
    officeFax: "(415) 252-3930",
    officeVoicemail: "(415) 252-3805",
    investigatorDefaultPhone: "415-252-3822",
    contactPrompt:
      "You may contact the investigator named below within 24 hours for more information.",
  },

  // ── Cover Page ─────────────────────────────────────────────────────────────
  cover: {
    documentTitle: "Environmental Health",
    caseLabel: "Director's Hearing Case #",
    addressLabel: "Address:",
    footerText: "SFDPH\u00a0│\u00a049 South Van Ness Avenue, Suite 600, San Francisco, CA 94103",
  },

  // ── Case Chronology ────────────────────────────────────────────────────────
  chronology: {
    documentTitle: "Director's Hearing Case Chronology",
    orgLine: "City and County of San Francisco — Department of Public Health",
    presentationClause:
      "On the Hearing Date, Environmental Health shall present this chronology of " +
      "inspections, notices, and other significant events related to the above-referenced case.",
    tableHeader: {
      date: "DATE",
      codeSection: "CODE SECTION",
      summary: "SUMMARY OF ACTIONS, OBSERVATIONS OR NOTES",
      exhibits: "EXHIBITS",
      page: "Pg.",
      by: "By",
    },
    continuationIntro:
      "Following is a continuation chronology of events presented at this hearing date:",
    continuationCheckboxLabel: "Continued on supplemental page(s)",
    proposedOrderHeading: "PROPOSED HEARING ORDER",
    proposedOrder:
      "Based on the history of non-compliance documented above, the Department recommends that the Hearing Officer issue an order requiring the abatement of all outstanding violations at {address} within 30 days of the hearing date. Failure to comply will result in further administrative action and assessment of applicable fees.",
    recommendationClause:
      "Based on the above chronology, the Environmental Health Inspector respectfully recommends the following order:",
    fieldLabels: {
      address: "Location Address",
      blockLot: "Block/Lot",
      facility: "Facility Name (DBA)",
      submittalDate: "Date of Submittal",
      hearingDate: "Hearing Date",
      programCode: "Program Code",
      caseNumber: "Case Number",
      violationsObserved: "Violations:",
      frozenNote: "⚖ Frozen chronology record — submitted for hearing",
    },
    signatureLabels: {
      inspector: "Inspector Signature",
      manager: "Program Manager Signature",
      inspectorName: "Environmental Health Inspector",
      managerName: "Program Manager / Supervisor",
    },
  },

  // ── Notice of Violation ────────────────────────────────────────────────────
  nov: {
    documentTitle: "NOTICE OF VIOLATION",

    ownerLabel: "Property Owner of Record:",
    dateLabel: "Date",
    blockLabel: "Block:",
    lotLabel: "Lot:",
    propertyAddressLabel: "Regarding Property Address:",
    responsiblePartyLabel: "Other Responsible Person(s):",

    tableHeader: {
      violation: "SFHC Violation",
      steps: "Steps You Must Take to Abate the Violation",
      deadline: "Deadline for Abatement",
    },

    preamble:
      "The premises owned, controlled, or occupied by you, located at the above address, are in " +
      "violation of the following provision(s) of the San Francisco Health Code (SFHC). The violations " +
      "are described in more detail in the attached Inspection Report.",

    directive:
      "YOU ARE DIRECTED TO MAKE THE FOLLOWING CORRECTIONS PRIOR TO THE DEADLINE FOR ABATEMENT THAT IS NOTED BELOW:",

    reinspectionFees:
      "Re-inspections will be made on/after the deadline(s) for abatement noted above. " +
      "Owners will be billed for each re-inspection made after the 1st re-inspection. " +
      "Minimum charge per re-inspection is $229.00",

    consequencesOfFailure:
      "If the Owner/Responsible Parties fail to comply with this Notice of Violation, the Director of Health " +
      "may (A) hold a Director\u2019s Hearing to consider whether it would be appropriate to issue a Director\u2019s " +
      "Order to abate the nuisance and other appropriate orders as provided for in Article 11 or " +
      "(B) cause the abatement and removal of the nuisance and the Owner shall be indebted to the City and County " +
      "of San Francisco for all costs, charges and fees incurred by the City and County of San Francisco by reason " +
      "of the abatement and removal of the nuisance. (SFHC Section 596(e)(3).)",

    chargesAndCosts:
      "Owner/Responsible Parties may be liable for other charges, costs, including administrative costs, " +
      "expenses incurred by the Department, fines, attorneys\u2019 fees, and penalties as provided for in Article 11. " +
      "(SFHC Section 596(e)(4).)",

    attorneysFees:
      "The Director shall seek the recovery of attorneys\u2019 fees. (SFHC Section 610.)",

    reinspectionFeesLabel: "REINSPECTION FEES:",
    consequencesLabel: "CONSEQUENCES OF FAILURE TO TIMELY ABATE:",
    chargesLabel: "CHARGES AND COSTS:",
    attorneysFeesLabel: "ATTORNEYS FEES:",
  },
} as const;

// ─── PROGRAM CODES ────────────────────────────────────────────────────────────
// Allowed program code values — used by the Hearing Prep dropdown.

export const PROGRAM_CODES = ["HHV", "HHP", "VEC", "ENV"] as const;
export type ProgramCode = (typeof PROGRAM_CODES)[number];

// ─── DOCUMENT FIELD TYPES ─────────────────────────────────────────────────────

export type InputType = "text" | "date" | "dropdown" | "longText" | "email" | "repeater";
export type EditMode = "locked" | "auto-filled" | "editable";
export type FormatRule =
  | "uppercase"
  | "date-mm/dd/yyyy"
  | "last12-upper"
  | "prefix-hhp"
  | "bulleted-list"
  | "none";

export interface DocumentFieldConfig {
  /** Unique field key matching the variable slot name used by renderers */
  key: string;
  /** Human-readable label shown in the Hearing Prep UI */
  label: string;
  /** Database table the value is sourced from */
  sourceTable:
    | "HearingPackets"
    | "Complaints"
    | "Locations"
    | "Violations"
    | "Inspections"
    | "Users"
    | "Chronology"
    | "static";
  /** Field name within the source table (use dotted path for nested: e.g. "blockLot.block") */
  sourceField: string;
  /** Widget type rendered in the Hearing Prep form */
  inputType: InputType;
  /** Whether an inspector can modify this value, or it is computed/locked */
  editable: EditMode;
  /** Optional display-format rule applied at render time */
  formatRule?: FormatRule;
  /** Dropdown options — only used when inputType === 'dropdown' */
  options?: readonly string[];
  /** Whether the packet cannot be finalized without this field */
  required: boolean;
  /** Human-readable hint shown below the field in the Hearing Prep form */
  hint?: string;
}

// ─── COVER PAGE VARIABLE SLOTS ────────────────────────────────────────────────

export const COVER_PAGE_VARIABLE_SLOTS: DocumentFieldConfig[] = [
  {
    key: "caseNumber",
    label: "Case Number",
    sourceTable: "HearingPackets",
    sourceField: "caseNumber",
    inputType: "text",
    editable: "editable",
    formatRule: "prefix-hhp",
    required: true,
    hint: "e.g. HHP-26-0042",
  },
  {
    key: "programCode",
    label: "Program Code",
    sourceTable: "HearingPackets",
    sourceField: "programCode",
    inputType: "dropdown",
    editable: "editable",
    options: PROGRAM_CODES,
    required: false,
    hint: "Program issuing the hearing",
  },
  {
    key: "propertyAddress",
    label: "Property Address",
    sourceTable: "Complaints",
    sourceField: "address",
    inputType: "text",
    editable: "auto-filled",
    required: true,
    hint: "Auto-filled from complaint address; edit on the Location record if incorrect",
  },
];

// ─── NOV VARIABLE SLOTS ───────────────────────────────────────────────────────

export const NOV_VARIABLE_SLOTS: DocumentFieldConfig[] = [
  {
    key: "ownerName",
    label: "Property Owner of Record",
    sourceTable: "Locations",
    sourceField: "ownerName",
    inputType: "text",
    editable: "auto-filled",
    formatRule: "uppercase",
    required: false,
    hint: "Auto-filled from Location record",
  },
  {
    key: "ownerAddress",
    label: "Owner Mailing Address",
    sourceTable: "Locations",
    sourceField: "ownerAddress",
    inputType: "text",
    editable: "auto-filled",
    formatRule: "uppercase",
    required: false,
    hint: "Auto-filled from Location record",
  },
  {
    key: "novDate",
    label: "NOV Date",
    sourceTable: "Inspections",
    sourceField: "inspectionDate",
    inputType: "date",
    editable: "auto-filled",
    formatRule: "date-mm/dd/yyyy",
    required: false,
    hint: "Auto-filled from earliest inspection date",
  },
  {
    key: "block",
    label: "Block Number",
    sourceTable: "Locations",
    sourceField: "blockLot",
    inputType: "text",
    editable: "auto-filled",
    required: false,
    hint: "Parsed from Block/Lot field on the Location record",
  },
  {
    key: "lot",
    label: "Lot Number",
    sourceTable: "Locations",
    sourceField: "blockLot",
    inputType: "text",
    editable: "auto-filled",
    required: false,
    hint: "Parsed from Block/Lot field on the Location record",
  },
  {
    key: "propertyAddress",
    label: "Regarding Property Address",
    sourceTable: "Complaints",
    sourceField: "address",
    inputType: "text",
    editable: "auto-filled",
    required: true,
    hint: "Auto-filled from complaint address",
  },
  {
    key: "responsibleParty",
    label: "Other Responsible Persons",
    sourceTable: "Locations",
    sourceField: "responsibleParty",
    inputType: "text",
    editable: "editable",
    required: false,
    hint: "Managers, agents, or other parties besides the owner of record",
  },
  {
    key: "violations",
    label: "Violations",
    sourceTable: "Violations",
    sourceField: "*",
    inputType: "repeater",
    editable: "auto-filled",
    required: false,
    hint: "Populated from violation records linked to this complaint",
  },
  {
    key: "violations[].code",
    label: "SFHC Violation Code",
    sourceTable: "Violations",
    sourceField: "violationCode",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "violations[].label",
    label: "Violation Description",
    sourceTable: "Violations",
    sourceField: "violationLabel",
    inputType: "longText",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "violations[].corrective_action",
    label: "Steps to Abate",
    sourceTable: "Violations",
    sourceField: "correctiveAction",
    inputType: "longText",
    editable: "editable",
    formatRule: "bulleted-list",
    required: false,
    hint: "Specific steps the owner must take — each line becomes a bullet in the NOV",
  },
  {
    key: "violations[].due_date",
    label: "Deadline for Abatement",
    sourceTable: "Violations",
    sourceField: "dueDate",
    inputType: "date",
    editable: "editable",
    formatRule: "date-mm/dd/yyyy",
    required: false,
    hint: "Abatement deadline for this specific violation",
  },
  {
    key: "investigatorName",
    label: "Investigator Name",
    sourceTable: "Users",
    sourceField: "firstName+lastName",
    inputType: "text",
    editable: "auto-filled",
    required: false,
    hint: 'Auto-matched from "Assigned To" on the complaint',
  },
  {
    key: "investigatorEmail",
    label: "Investigator Email",
    sourceTable: "Users",
    sourceField: "email",
    inputType: "email",
    editable: "auto-filled",
    required: false,
    hint: 'Auto-matched from "Assigned To" on the complaint',
  },
  {
    key: "investigatorPhone",
    label: "Investigator Phone",
    sourceTable: "static",
    sourceField: "common.investigatorDefaultPhone",
    inputType: "text",
    editable: "locked",
    required: false,
    hint: "Default SFDPH HHP inspector line — locked",
  },
  {
    key: "complaintId",
    label: "Complaint ID",
    sourceTable: "Complaints",
    sourceField: "complaintId",
    inputType: "text",
    editable: "locked",
    required: false,
    hint: "Read-only — assigned by the system",
  },
  {
    key: "locationId",
    label: "Location ID",
    sourceTable: "Locations",
    sourceField: "id",
    inputType: "text",
    editable: "locked",
    formatRule: "last12-upper",
    required: false,
    hint: "Read-only — last 12 characters of the Location record ID",
  },
];

// ─── CHRONOLOGY VARIABLE SLOTS ────────────────────────────────────────────────

export const CHRONOLOGY_VARIABLE_SLOTS: DocumentFieldConfig[] = [
  {
    key: "propertyAddress",
    label: "Property Address",
    sourceTable: "Complaints",
    sourceField: "address",
    inputType: "text",
    editable: "auto-filled",
    required: true,
  },
  {
    key: "blockLot",
    label: "Block/Lot",
    sourceTable: "Locations",
    sourceField: "blockLot",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "facilityName",
    label: "Facility Name (DBA)",
    sourceTable: "Locations",
    sourceField: "dba",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "dateOfSubmittal",
    label: "Date of Submittal",
    sourceTable: "static",
    sourceField: "today",
    inputType: "date",
    editable: "locked",
    required: false,
  },
  {
    key: "ownerName",
    label: "Property Owner",
    sourceTable: "Locations",
    sourceField: "ownerName",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "ownerPhone",
    label: "Owner Phone",
    sourceTable: "Locations",
    sourceField: "ownerPhone",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "ownerEmail",
    label: "Owner Email",
    sourceTable: "Locations",
    sourceField: "ownerEmail",
    inputType: "email",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "responsibleParty",
    label: "Responsible Party",
    sourceTable: "Locations",
    sourceField: "responsibleParty",
    inputType: "text",
    editable: "editable",
    required: false,
  },
  {
    key: "responsiblePhone",
    label: "Responsible Party Phone",
    sourceTable: "Locations",
    sourceField: "responsiblePartyPhone",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "responsibleEmail",
    label: "Responsible Party Email",
    sourceTable: "Locations",
    sourceField: "responsiblePartyEmail",
    inputType: "email",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "hearingDate",
    label: "Hearing Date",
    sourceTable: "HearingPackets",
    sourceField: "hearingDate",
    inputType: "date",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "programCode",
    label: "Program Code",
    sourceTable: "HearingPackets",
    sourceField: "programCode",
    inputType: "dropdown",
    editable: "editable",
    required: false,
    options: PROGRAM_CODES,
  },
  {
    key: "caseNumber",
    label: "Case Number",
    sourceTable: "HearingPackets",
    sourceField: "caseNumber",
    inputType: "text",
    editable: "editable",
    required: false,
  },
  {
    key: "entries",
    label: "Chronology Entries",
    sourceTable: "Chronology",
    sourceField: "*",
    inputType: "repeater",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "entries[].date",
    label: "Entry Date",
    sourceTable: "Chronology",
    sourceField: "entryDate",
    inputType: "date",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "entries[].code",
    label: "Code Section",
    sourceTable: "Chronology",
    sourceField: "citationCode",
    inputType: "text",
    editable: "editable",
    required: false,
  },
  {
    key: "entries[].summary",
    label: "Summary",
    sourceTable: "Chronology",
    sourceField: "summary",
    inputType: "longText",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "entries[].exhibits",
    label: "Exhibit Refs",
    sourceTable: "Chronology",
    sourceField: "exhibitRefs",
    inputType: "text",
    editable: "editable",
    required: false,
  },
  {
    key: "pageCount",
    label: "Supplemental Page Count",
    sourceTable: "static",
    sourceField: "computed",
    inputType: "text",
    editable: "locked",
    required: false,
    hint: "Auto-calculated from chronology entry pagination",
  },
  {
    key: "recommendedOrder",
    label: "Recommended Order Text",
    sourceTable: "HearingPackets",
    sourceField: "hearingOrderData",
    inputType: "longText",
    editable: "editable",
    required: false,
  },
  {
    key: "inspectorName",
    label: "Inspector Name",
    sourceTable: "Users",
    sourceField: "firstName+lastName",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "inspectorSignature",
    label: "Inspector Signature",
    sourceTable: "HearingPackets",
    sourceField: "inspectorSignature",
    inputType: "text",
    editable: "locked",
    required: false,
    hint: "Auto-filled from the inspector's saved signature",
  },
  {
    key: "inspectorEmail",
    label: "Inspector Email",
    sourceTable: "Users",
    sourceField: "email",
    inputType: "email",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "inspectorPhone",
    label: "Inspector Phone",
    sourceTable: "static",
    sourceField: "common.investigatorDefaultPhone",
    inputType: "text",
    editable: "locked",
    required: false,
  },
  {
    key: "managerName",
    label: "Manager / Supervisor",
    sourceTable: "Users",
    sourceField: "firstName+lastName",
    inputType: "text",
    editable: "auto-filled",
    required: false,
  },
  {
    key: "managerSignature",
    label: "Manager Signature",
    sourceTable: "HearingPackets",
    sourceField: "managerSignature",
    inputType: "text",
    editable: "locked",
    required: false,
    hint: "Applied by a Program Manager or Admin via the Countersign button",
  },
];

// ─── MASTER DOCUMENT FIELD REGISTRY ──────────────────────────────────────────
// Flat registry of all variable slots across all templates.
// Keyed by `templateId.fieldKey` for unambiguous lookup.

export const DOCUMENT_FIELD_REGISTRY: Record<string, DocumentFieldConfig> = {
  ...Object.fromEntries(COVER_PAGE_VARIABLE_SLOTS.map((f) => [`cover.${f.key}`, f])),
  ...Object.fromEntries(NOV_VARIABLE_SLOTS.map((f) => [`nov.${f.key}`, f])),
  ...Object.fromEntries(CHRONOLOGY_VARIABLE_SLOTS.map((f) => [`chronology.${f.key}`, f])),
};

// ─── TEMPLATE DESCRIPTORS ─────────────────────────────────────────────────────
// Top-level descriptors for each document template — used for UI metadata.

export const DOCUMENT_TEMPLATES = {
  cover: {
    id: "cover",
    name: "Director's Hearing Cover Page",
    description: "Official SFDPH cover sheet with case number and property address.",
    variableSlots: COVER_PAGE_VARIABLE_SLOTS,
    staticBlocks: STATIC_BLOCKS.cover,
    layoutTokens: LAYOUT_TOKENS,
  },
  nov: {
    id: "nov",
    name: "Notice of Violation",
    description:
      "SFDPH Healthy Housing and Vector Control Notice of Violation with violation table and legal paragraphs.",
    variableSlots: NOV_VARIABLE_SLOTS,
    staticBlocks: STATIC_BLOCKS.nov,
    layoutTokens: LAYOUT_TOKENS,
  },
  chronology: {
    id: "chronology",
    name: "Director's Hearing Case Chronology",
    description:
      "Case chronology table with all boilerplate locked and variable data sourced from the database.",
    variableSlots: CHRONOLOGY_VARIABLE_SLOTS,
    staticBlocks: STATIC_BLOCKS.chronology,
    layoutTokens: LAYOUT_TOKENS,
  },
} as const;
