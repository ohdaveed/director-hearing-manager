export type CorrectiveActionItem = {
  text: string;
  party: "Owner" | "Tenant";
};

export type ViolationType = {
  category: string;
  label: string;
  code: string;
  /** Default corrective action for the Owner (responsible party) */
  defaultCorrectiveAction: string;
  /** Corrective action when Tenant is the responsible party */
  tenantCorrectiveAction: string;
  /** Number of days from inspection date to set the due date. Use 'hours' for sub-day deadlines. */
  dueDays: number;
  dueHours?: number; // If set, overrides dueDays (e.g. 48 hours for sewage)
  /**
   * Optional list of individual selectable corrective actions (used instead of the
   * single defaultCorrectiveAction / tenantCorrectiveAction strings when present).
   * The inspector picks which ones apply; selected items are joined into the final text.
   */
  correctiveActions?: CorrectiveActionItem[];
  /**
   * Optional observation presets shown as chip selectors in the inspection form.
   * Selecting one can auto-check related corrective actions.
   */
  observations?: Array<{
    text: string;
    autoOwnerActions?: string[];
    autoTenantActions?: string[];
  }>;
};

export const VIOLATION_TYPES: ViolationType[] = [
  // ── Pests, Vermin & Animals (Sec. 581(b)(8) unless noted) ───────────────
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Bed Bugs",
    code: "Article 11 § 581(b)(8)",
    dueDays: 90,
    defaultCorrectiveAction:
      "Contract a licensed pest control operator (PCO) to inspect and treat all affected units and common areas for bed bugs. Provide tenants with adequate written notice prior to treatment. Submit invoices and documentation of treatment to the SF Department of Public Health by the correction date.",
    tenantCorrectiveAction:
      "Maintain good housekeeping throughout the unit. Wash and bag all bedding, clothing, and linens. Grant access to the licensed pest control operator contracted by the owner.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Hire a licensed pest control operator (PCO) within two days of this report.",
      },
      {
        party: "Owner",
        text: "Seal all cracks and crevices between adjacent dwelling units.",
      },
      {
        party: "Owner",
        text: "Ensure monitoring devices are used for at least four weeks after final treatment.",
      },
      {
        party: "Owner",
        text: "Ensure PCO inspects all units above, below, next to, and across from the infested area.",
      },
      {
        party: "Owner",
        text: "Assist tenant with plastic sealable bags for laundry and disposal items.",
      },
      {
        party: "Owner",
        text: "Arrange assistance for tenants who are unable to comply.",
      },
      {
        party: "Owner",
        text: "Provide DPH with copies of PCO reports and preparation checklists until eliminated.",
      },
      {
        party: "Owner",
        text: "Provide educational materials to the tenant regarding bed bug prevention and control.",
      },
      {
        party: "Owner",
        text: "Consult with PCO to determine if wall void treatment is feasible for this case.",
      },
      {
        party: "Tenant",
        text: "Cooperate with Owners, Managers, and PCOs for inspection and treatment.",
      },
      {
        party: "Tenant",
        text: "Launder all clothing and bedding on the highest safe temperature.",
      },
      {
        party: "Tenant",
        text: "Comply with SFDPH Director's Rules and Regulations for Prevention and Control of Bed Bugs.",
      },
    ],
    observations: [
      {
        text: "Live bed bugs on mattress seams / furniture",
        autoOwnerActions: [
          "Hire a licensed pest control operator (PCO) within two days of this report.",
        ],
        autoTenantActions: [
          "Launder all clothing and bedding on the highest safe temperature.",
        ],
      },
      {
        text: "Blood staining or fecal spots observed",
        autoOwnerActions: [
          "Ensure monitoring devices are used for at least four weeks after final treatment.",
        ],
      },
      {
        text: "Infestation confirmed in adjacent units",
        autoOwnerActions: [
          "Ensure PCO inspects all units above, below, next to, and across from the infested area.",
        ],
      },
      {
        text: "Tenant reports bites / skin reactions",
        autoOwnerActions: [
          "Arrange assistance for tenants who are unable to comply.",
        ],
        autoTenantActions: [
          "Cooperate with Owners, Managers, and PCOs for inspection and treatment.",
        ],
      },
    ],
  },
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Cockroaches",
    code: "Article 11 § 581(b)(8)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Contract a licensed pest control operator (PCO) to treat all affected areas for cockroach infestation. Eliminate harborage conditions including cracks, crevices, and food debris. Provide tenants with adequate written notice prior to each treatment. Submit invoices and documentation of treatment to the SF Department of Public Health.",
    tenantCorrectiveAction:
      "Maintain good housekeeping throughout the unit. Store all food in sealed, airtight containers. Do not leave dirty dishes in the sink. Dispose of garbage promptly in covered containers. Grant access to the licensed pest control operator contracted by the owner.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Immediately hire a licensed pest control service capable of treating severe cockroach infestation.",
      },
      {
        party: "Owner",
        text: "Pest control to treat entire unit until infestation has been eradicated.",
      },
      {
        party: "Owner",
        text: "Pest control to treat entire building until infestation has been eradicated.",
      },
      {
        party: "Owner",
        text: "Pest control to treat entire building twice monthly until infestation has been eradicated.",
      },
      {
        party: "Owner",
        text: "Pest control to inspect and treat as needed adjacent units until infestation has been eradicated.",
      },
      {
        party: "Owner",
        text: "Scrape away all cockroach frass from affected surfaces and refinish if necessary.",
      },
      {
        party: "Owner",
        text: "Thoroughly clean and sanitize all areas affected by cockroaches. Remove cockroach frass from all affected areas including but not limited to wall, cabinetry, appliances, etc.",
      },
      {
        party: "Owner",
        text: "Arrange assistance for tenant if tenant is unable to comply with corrective actions to abate violations.",
      },
      {
        party: "Owner",
        text: "Provide DPH investigator all pest control contracts and detailed reports each month until abated.",
      },
      {
        party: "Owner",
        text: "Where feasible, Pest Control Service to provide wall void treatments for cockroach activity.",
      },
      {
        party: "Owner",
        text: "Pest Control to inspect major appliances and treat as necessary; if appliances are unable to be treated and unable to be thoroughly cleaned, replace appliances after thorough cleaning and extermination.",
      },
      {
        party: "Owner",
        text: "Provide reasonable access to units and common areas for pest control treatments and repairs.",
      },
      {
        party: "Owner",
        text: "Pest Control to perform a heavy vacuuming where cockroaches are observed to significantly reduce population (a HEPA filter must be used during vacuuming).",
      },
      {
        party: "Owner",
        text: "Provide DPH with copies of PCO inspection and treatment reports and preparation checklist.",
      },
      {
        party: "Tenant",
        text: "Follow all pest control preparation requirements and properly prepare unit prior to all pest control treatments.",
      },
      {
        party: "Tenant",
        text: "Cooperate with assistance provided from Property Owner, Property Management, Case Management, and any other applicable assistance offered to abate violations.",
      },
      {
        party: "Tenant",
        text: "Keep all drain traps filled with water to help prevent American cockroaches.",
      },
      {
        party: "Tenant",
        text: "Provide DPH Investigator with copy of most recent pest control report.",
      },
      {
        party: "Tenant",
        text: "Store all food items in sealed plastic containers and remove any food debris in kitchen area and common areas.",
      },
      {
        party: "Tenant",
        text: "Ensure all garbage cans have lids and remain closed and sealed when not in use.",
      },
      {
        party: "Tenant",
        text: "Vacuum interior of kitchen cabinetry, behind all major kitchen appliances, and all other kitchen appliances.",
      },
    ],
    observations: [
      {
        text: "Live cockroaches visible during inspection",
        autoOwnerActions: [
          "Immediately hire a licensed pest control service capable of treating severe cockroach infestation.",
        ],
        autoTenantActions: [
          "Follow all pest control preparation requirements and properly prepare unit prior to all pest control treatments.",
        ],
      },
      {
        text: "Cockroach droppings (frass) in kitchen / cabinets",
        autoOwnerActions: [
          "Thoroughly clean and sanitize all areas affected by cockroaches. Remove cockroach frass from all affected areas including but not limited to wall, cabinetry, appliances, etc.",
        ],
        autoTenantActions: [
          "Vacuum interior of kitchen cabinetry, behind all major kitchen appliances, and all other kitchen appliances.",
        ],
      },
      {
        text: "Infestation spanning multiple units / floors",
        autoOwnerActions: [
          "Pest control to treat entire building until infestation has been eradicated.",
        ],
      },
      {
        text: "Cockroaches observed inside appliances",
        autoOwnerActions: [
          "Pest Control to inspect major appliances and treat as necessary; if appliances are unable to be treated and unable to be thoroughly cleaned, replace appliances after thorough cleaning and extermination.",
        ],
      },
    ],
  },
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Flies",
    code: "Article 11 § 581(b)(8)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Remove all fly breeding sources including garbage and organic debris from the property. Install or repair screens on windows and doors. Contract a licensed pest control operator if the infestation persists. Provide tenants with adequate written notice prior to any treatment.",
    tenantCorrectiveAction:
      "Maintain good housekeeping throughout the unit. Keep food covered and stored in sealed containers. Do not leave dirty dishes in the sink. Dispose of garbage promptly in covered containers and clean up food spills immediately. Grant access to pest control when scheduled by the owner. Keep windows and doors screened or closed to prevent fly entry.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remove all fly breeding sources including garbage, organic debris, and standing waste from the property.",
      },
      {
        party: "Owner",
        text: "Install or repair window and door screens on all openings to prevent fly entry.",
      },
      {
        party: "Owner",
        text: "Contract a licensed pest control operator (PCO) to treat affected areas if infestation persists.",
      },
      {
        party: "Owner",
        text: "Ensure all garbage containers have tight-fitting lids and are emptied regularly.",
      },
      {
        party: "Owner",
        text: "Clean and sanitize all garbage storage areas and surrounding surfaces.",
      },
      {
        party: "Owner",
        text: "Provide tenants with adequate written notice prior to any pest control treatment.",
      },
      {
        party: "Owner",
        text: "Provide DPH with documentation of pest control treatment and remediation efforts.",
      },
      {
        party: "Tenant",
        text: "Keep all food covered and stored in sealed, airtight containers.",
      },
      {
        party: "Tenant",
        text: "Do not leave dirty dishes in the sink or food waste exposed.",
      },
      {
        party: "Tenant",
        text: "Dispose of garbage promptly in covered containers and clean up food spills immediately.",
      },
      {
        party: "Tenant",
        text: "Keep windows and doors screened or closed to prevent fly entry.",
      },
      {
        party: "Tenant",
        text: "Grant access to the pest control operator when scheduled by the owner.",
      },
    ],
  },
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Mosquitoes",
    code: "Article 11 § 581(b)(8)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Eliminate all standing water on the property. Remove containers, tires, and other items that collect water. Treat affected areas with an approved larvicide or pesticide as needed. Contract a licensed pest control operator and provide documentation to the SF Department of Public Health.",
    tenantCorrectiveAction:
      "Eliminate any standing water within the unit or on balconies and patios — including plant saucers, buckets, or any containers that collect water. Keep window and door screens in good repair. Report any pooling water, drainage problems, or plumbing leaks to the owner or property manager promptly.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Eliminate all standing water on the property including puddles, containers, and drainage areas.",
      },
      {
        party: "Owner",
        text: "Remove tires, containers, buckets, and any items that collect and hold water.",
      },
      {
        party: "Owner",
        text: "Repair any drainage issues, gutters, or low-lying areas that allow water to pool.",
      },
      {
        party: "Owner",
        text: "Treat affected areas with an approved larvicide or pesticide as needed.",
      },
      {
        party: "Owner",
        text: "Contract a licensed pest control operator (PCO) to assess and treat the property.",
      },
      {
        party: "Owner",
        text: "Install or repair window and door screens to prevent mosquito entry into units.",
      },
      {
        party: "Owner",
        text: "Provide DPH with documentation of pest control treatment and remediation efforts.",
      },
      {
        party: "Tenant",
        text: "Eliminate any standing water within the unit or on balconies and patios.",
      },
      {
        party: "Tenant",
        text: "Empty plant saucers, buckets, and any containers that collect water regularly.",
      },
      {
        party: "Tenant",
        text: "Keep window and door screens in good repair and report any damage to the owner promptly.",
      },
      {
        party: "Tenant",
        text: "Report pooling water, drainage problems, or plumbing leaks to the owner or property manager immediately.",
      },
    ],
  },
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Pigeons",
    code: "Article 11 § 581(b)(7)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Install bird exclusion devices (netting, spikes, or wire mesh) to prevent roosting and nesting on all affected areas. Remove all bird droppings and nesting materials using proper PPE and disinfection protocols. Contract a licensed pest control operator if needed and submit documentation to the SF Department of Public Health.",
    tenantCorrectiveAction:
      "Do not feed pigeons or other birds from the unit, balcony, or surrounding areas. Do not leave food, garbage, or other attractants in areas accessible to birds. Report any bird roosting, nesting activity, or accumulation of droppings to the owner or property manager promptly.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Install bird exclusion netting on all affected roosting and nesting areas.",
      },
      {
        party: "Owner",
        text: "Install anti-roosting spikes or wire mesh on ledges, rooflines, and other surfaces used by pigeons.",
      },
      {
        party: "Owner",
        text: "Remove all accumulated bird droppings and nesting materials using proper PPE and disinfection protocols.",
      },
      {
        party: "Owner",
        text: "Disinfect and sanitize all surfaces contaminated with bird droppings.",
      },
      {
        party: "Owner",
        text: "Contract a licensed pest control operator (PCO) for assessment and treatment if infestation persists.",
      },
      {
        party: "Owner",
        text: "Seal all gaps, vents, and openings that allow pigeons to access interior building spaces.",
      },
      {
        party: "Owner",
        text: "Provide DPH with documentation of exclusion work and pest control efforts.",
      },
      {
        party: "Tenant",
        text: "Do not feed pigeons or other birds from the unit, balcony, or surrounding areas.",
      },
      {
        party: "Tenant",
        text: "Do not leave food, garbage, or attractants in areas accessible to birds.",
      },
      {
        party: "Tenant",
        text: "Report any bird roosting, nesting activity, or accumulation of droppings to the owner or property manager promptly.",
      },
    ],
    observations: [
      {
        text: "Active roosting on roof / fire escape",
        autoOwnerActions: [
          "Install bird exclusion netting on all affected roosting and nesting areas.",
        ],
      },
      {
        text: "Heavy accumulation of droppings",
        autoOwnerActions: [
          "Remove all accumulated bird droppings and nesting materials using proper PPE and disinfection protocols.",
          "Disinfect and sanitize all surfaces contaminated with bird droppings.",
        ],
      },
      {
        text: "Nesting in vents / eaves / openings",
        autoOwnerActions: [
          "Seal all gaps, vents, and openings that allow pigeons to access interior building spaces.",
        ],
      },
      {
        text: "No exclusion devices installed",
        autoOwnerActions: [
          "Install anti-roosting spikes or wire mesh on ledges, rooflines, and other surfaces used by pigeons.",
        ],
      },
    ],
  },
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Poison Oak",
    code: "Article 11 § 581(b)(11)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Remove all poison oak (Toxicodendron diversilobum) growth from the property using appropriate protective equipment. Dispose of plant material properly and treat the area to prevent regrowth. This is an owner/property responsibility.",
    tenantCorrectiveAction:
      "Do not disturb or attempt to remove poison oak — contact with the plant causes severe skin reactions. Report the presence of poison oak to the owner or property manager immediately so it can be professionally removed.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remove all poison oak (Toxicodendron diversilobum) growth from the property using appropriate PPE.",
      },
      {
        party: "Owner",
        text: "Dispose of all removed plant material properly — do not burn or compost poison oak.",
      },
      {
        party: "Owner",
        text: "Apply approved herbicide to the affected area to prevent regrowth.",
      },
      {
        party: "Owner",
        text: "Post warning signage in affected areas until all poison oak has been fully removed.",
      },
      {
        party: "Owner",
        text: "Hire a licensed contractor or landscaper experienced in hazardous plant removal if needed.",
      },
      {
        party: "Owner",
        text: "Inspect the property regularly and remove any regrowth promptly.",
      },
      {
        party: "Tenant",
        text: "Do not disturb or attempt to remove poison oak — contact causes severe skin reactions.",
      },
      {
        party: "Tenant",
        text: "Report the presence or regrowth of poison oak to the owner or property manager immediately.",
      },
      {
        party: "Tenant",
        text: "Keep children and pets away from areas where poison oak is present.",
      },
    ],
  },
  {
    category: "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)",
    label: "Rodents",
    code: "Article 11 § 581(b)(13)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Contract a licensed pest control operator (PCO) to bait and trap for rodents throughout the property. Seal all entry points — gaps, holes, and cracks in the building exterior and interior — to prevent re-entry. Remove all harborage conditions including debris and food sources. Provide tenants with adequate written notice prior to each treatment. Submit invoices and documentation to the SF Department of Public Health.",
    tenantCorrectiveAction:
      "Maintain good housekeeping throughout the unit. Store all food (including pet food) in sealed, airtight containers. Do not leave dirty dishes in the sink overnight. Dispose of garbage promptly in covered containers. Grant access to the licensed pest control operator contracted by the owner. Prepare the unit for treatment: move all items at least 12 inches from walls, empty all cupboards, remove excessive items, boxes, and rubbish from floors and storage areas. Report when traps need replacement or when rodent activity is observed to the owner or property manager immediately.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Contract a licensed pest control operator (PCO) to bait and trap for rodents throughout the property.",
      },
      {
        party: "Owner",
        text: "Seal all entry points — gaps, holes, and cracks in the building exterior — with appropriate materials to prevent re-entry.",
      },
      {
        party: "Owner",
        text: "Seal all interior gaps around pipes, utility penetrations, and wall openings.",
      },
      {
        party: "Owner",
        text: "Remove all harborage conditions including debris, wood piles, and stored materials from the property.",
      },
      {
        party: "Owner",
        text: "Ensure all food waste and garbage is stored in sealed, rodent-proof containers.",
      },
      {
        party: "Owner",
        text: "Provide tenants with adequate written notice prior to each pest control treatment.",
      },
      {
        party: "Owner",
        text: "Provide DPH with invoices and documentation of all pest control treatments.",
      },
      {
        party: "Owner",
        text: "Schedule follow-up PCO inspections until rodent activity has been fully eliminated.",
      },
      {
        party: "Tenant",
        text: "Store all food (including pet food) in sealed, airtight containers.",
      },
      {
        party: "Tenant",
        text: "Do not leave dirty dishes in the sink overnight.",
      },
      {
        party: "Tenant",
        text: "Dispose of garbage promptly in covered containers.",
      },
      {
        party: "Tenant",
        text: "Grant access to the licensed pest control operator contracted by the owner.",
      },
      {
        party: "Tenant",
        text: "Move all items at least 12 inches from walls to prepare unit for treatment.",
      },
      {
        party: "Tenant",
        text: "Empty all cupboards and remove excessive items, boxes, and rubbish from floors and storage areas.",
      },
      {
        party: "Tenant",
        text: "Report when traps need replacement or when rodent activity is observed to the owner or property manager immediately.",
      },
    ],
    observations: [
      {
        text: "Fresh droppings found",
        autoOwnerActions: [
          "Contract a licensed pest control operator (PCO) to bait and trap for rodents throughout the property.",
        ],
        autoTenantActions: [
          "Store all food (including pet food) in sealed, airtight containers.",
        ],
      },
      {
        text: "Active burrow entrances observed",
        autoOwnerActions: [
          "Seal all entry points — gaps, holes, and cracks in the building exterior — with appropriate materials to prevent re-entry.",
        ],
      },
      {
        text: "Gnaw marks on structure / cabinets",
        autoOwnerActions: [
          "Seal all interior gaps around pipes, utility penetrations, and wall openings.",
        ],
      },
      {
        text: "Nesting material found",
        autoOwnerActions: [
          "Remove all harborage conditions including debris, wood piles, and stored materials from the property.",
        ],
        autoTenantActions: [
          "Move all items at least 12 inches from walls to prepare unit for treatment.",
        ],
      },
      {
        text: "Rodent activity in garbage area",
        autoOwnerActions: [
          "Ensure all food waste and garbage is stored in sealed, rodent-proof containers.",
        ],
      },
    ],
  },

  // ── Sanitation (Sec. 581(b)(1)–(2)) ────────────────────────────────────
  {
    category: "Sanitation (Sec. 581(b)(1)–(2))",
    label: "Garbage / Refuse / Waste / Debris",
    code: "Article 11 § 581(b)(1)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Remove all accumulated garbage, refuse, waste, and debris from the premises. Ensure all waste is properly containerized and set out for collection per Sec. 283. Establish a routine cleaning and maintenance schedule to prevent recurrence.",
    tenantCorrectiveAction:
      "Remove all accumulated garbage, refuse, and debris from the unit and any assigned storage or outdoor areas. Place all waste in approved, covered containers and set out for collection on scheduled days. Establish a regular disposal routine to prevent future accumulation.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remove all accumulated garbage, refuse, waste, and debris from the premises immediately.",
      },
      {
        party: "Owner",
        text: "Ensure all waste is properly containerized in approved, covered containers.",
      },
      {
        party: "Owner",
        text: "Schedule waste collection per Sec. 283 and ensure containers are set out on collection days.",
      },
      {
        party: "Owner",
        text: "Increase garbage container capacity if existing containers are insufficient for occupant needs.",
      },
      {
        party: "Owner",
        text: "Establish a routine cleaning and maintenance schedule for all common areas and garbage storage zones.",
      },
      {
        party: "Owner",
        text: "Post collection schedules and disposal guidelines in common areas for all tenants.",
      },
      {
        party: "Tenant",
        text: "Remove all accumulated garbage, refuse, and debris from the unit and any assigned areas immediately.",
      },
      {
        party: "Tenant",
        text: "Place all waste in approved, covered containers and set out for collection on scheduled days.",
      },
      {
        party: "Tenant",
        text: "Establish a regular disposal routine to prevent future accumulation.",
      },
      {
        party: "Tenant",
        text: "Do not leave bagged garbage in hallways, stairwells, or outside of designated containers.",
      },
    ],
    observations: [
      {
        text: "Overflowing bins / loose bags on ground",
        autoOwnerActions: [
          "Remove all accumulated garbage, refuse, waste, and debris from the premises immediately.",
          "Increase garbage container capacity if existing containers are insufficient for occupant needs.",
        ],
        autoTenantActions: [
          "Place all waste in approved, covered containers and set out for collection on scheduled days.",
        ],
      },
      {
        text: "Garbage juice / liquid waste pooling",
        autoOwnerActions: [
          "Establish a routine cleaning and maintenance schedule for all common areas and garbage storage zones.",
        ],
      },
      {
        text: "Fly or pest activity in garbage area",
        autoOwnerActions: [
          "Ensure all waste is properly containerized in approved, covered containers.",
        ],
      },
      {
        text: "Bulk items / furniture dumped on property",
        autoOwnerActions: [
          "Schedule waste collection per Sec. 283 and ensure containers are set out on collection days.",
        ],
      },
    ],
  },
  {
    category: "Sanitation (Sec. 581(b)(1)–(2))",
    label: "Human / Animal Waste (Sewage)",
    code: "Article 11 § 581(b)(1),(5)",
    dueDays: 0,
    dueHours: 48,
    defaultCorrectiveAction:
      "IMMEDIATE ACTION REQUIRED: Clean and disinfect all areas contaminated with human or animal waste/sewage within 48 hours using appropriate sanitizing agents. Identify and correct the source of the contamination. Dispose of waste materials in compliance with health code requirements. Contract a licensed remediation contractor if needed and submit documentation to the SF Department of Public Health.",
    tenantCorrectiveAction:
      "IMMEDIATE ACTION REQUIRED: Cease any activity contributing to sewage or waste contamination immediately. Do not use affected fixtures until repaired. Grant immediate access to the owner, property manager, and any remediation contractors. Report the issue to the owner and property manager immediately so corrective action can begin within 48 hours.",
    correctiveActions: [
      {
        party: "Owner",
        text: "IMMEDIATELY clean and disinfect all areas contaminated with sewage or waste within 48 hours.",
      },
      {
        party: "Owner",
        text: "Identify and repair the source of the sewage contamination (e.g., broken pipe, blocked drain, faulty fixture).",
      },
      {
        party: "Owner",
        text: "Contract a licensed remediation contractor for cleanup if contamination is extensive.",
      },
      {
        party: "Owner",
        text: "Dispose of all contaminated materials in compliance with health code requirements.",
      },
      {
        party: "Owner",
        text: "Test and verify that all affected plumbing fixtures are functioning properly after repair.",
      },
      {
        party: "Owner",
        text: "Submit documentation of remediation and repairs to the SF Department of Public Health.",
      },
      {
        party: "Owner",
        text: "Grant DPH access for a follow-up inspection within 48 hours.",
      },
      {
        party: "Tenant",
        text: "Cease any activity contributing to sewage or waste contamination immediately.",
      },
      {
        party: "Tenant",
        text: "Do not use affected plumbing fixtures until they have been repaired.",
      },
      {
        party: "Tenant",
        text: "Report the issue to the owner and property manager immediately.",
      },
      {
        party: "Tenant",
        text: "Grant immediate access to the owner, property manager, and any remediation contractors.",
      },
    ],
  },
  {
    category: "Sanitation (Sec. 581(b)(1)–(2))",
    label: "Overgrown Vegetation",
    code: "Article 11 § 581(b)(2)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Trim, cut, and remove all overgrown vegetation, weeds, grass, and hay from the property. Establish a regular maintenance schedule to prevent regrowth.",
    tenantCorrectiveAction:
      "Report overgrown vegetation in common areas or on the property to the owner or property manager immediately. If vegetation is within an assigned private outdoor area (yard, patio), remove it promptly and maintain it on a regular basis to prevent recurrence.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Trim, cut, and remove all overgrown vegetation, weeds, grass, and hay from the property.",
      },
      {
        party: "Owner",
        text: "Remove dead vegetation, branches, and plant debris that create harborage for pests.",
      },
      {
        party: "Owner",
        text: "Establish a regular landscaping and maintenance schedule to prevent regrowth.",
      },
      {
        party: "Owner",
        text: "Apply appropriate weed control measures to prevent recurrence in affected areas.",
      },
      {
        party: "Owner",
        text: "Ensure all walkways, exits, and access points remain clear of overgrown vegetation.",
      },
      {
        party: "Tenant",
        text: "Report overgrown vegetation in common areas or on the property to the owner or property manager immediately.",
      },
      {
        party: "Tenant",
        text: "Remove overgrown vegetation from any assigned private outdoor areas (yard, patio) promptly.",
      },
      {
        party: "Tenant",
        text: "Maintain assigned outdoor areas on a regular basis to prevent recurrence.",
      },
    ],
  },

  // ── Garbage Area (Sec. 581(b)(1)) ───────────────────────────────────────
  {
    category: "Garbage Area (Sec. 581(b)(1))",
    label: "Inadequate Garbage Containers / Lids",
    code: "Article 11 § 581(b)(1)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Replace or repair all garbage containers to ensure they are watertight with properly fitting lids. Maintain containers in good repair at all times to prevent pest access and odors.",
    tenantCorrectiveAction:
      "Report damaged, missing, or inadequate garbage containers or lids to the owner or property manager immediately. In the meantime, ensure all waste is bagged securely before placing it near the collection area to minimize pest attraction.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Replace all damaged or inadequate garbage containers with watertight, covered containers.",
      },
      {
        party: "Owner",
        text: "Repair or replace all missing or broken container lids to ensure a proper, tight fit.",
      },
      {
        party: "Owner",
        text: "Ensure sufficient container capacity is provided for all occupants of the building.",
      },
      {
        party: "Owner",
        text: "Inspect and maintain all garbage containers on a regular basis to prevent future deterioration.",
      },
      {
        party: "Owner",
        text: "Clean and sanitize the garbage storage area to eliminate odors and pest attractants.",
      },
      {
        party: "Tenant",
        text: "Report damaged, missing, or inadequate garbage containers or lids to the owner or property manager immediately.",
      },
      {
        party: "Tenant",
        text: "Ensure all waste is securely bagged before placing in or near containers.",
      },
      {
        party: "Tenant",
        text: "Keep container lids closed at all times to minimize pest attraction and odors.",
      },
    ],
  },
  {
    category: "Garbage Area (Sec. 581(b)(1))",
    label: "Uncontainerized Garbage",
    code: "Article 11 § 581(b)(1)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Place all garbage and refuse in approved, covered containers immediately. Ensure sufficient container capacity is available for all occupants. Schedule additional pick-ups if capacity is insufficient.",
    tenantCorrectiveAction:
      "Place all garbage and refuse in the designated approved, covered containers immediately. Never leave bagged garbage outside of containers or in hallways. If containers are full, notify the owner or property manager so additional capacity can be arranged.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remove all uncontainerized garbage and refuse from the property immediately.",
      },
      {
        party: "Owner",
        text: "Provide approved, covered containers with sufficient capacity for all occupants.",
      },
      {
        party: "Owner",
        text: "Schedule additional waste pick-ups if container capacity is insufficient.",
      },
      {
        party: "Owner",
        text: "Post signage instructing tenants to properly containerize all waste.",
      },
      {
        party: "Owner",
        text: "Clean and sanitize the garbage storage area following removal of uncontainerized waste.",
      },
      {
        party: "Tenant",
        text: "Place all garbage and refuse in the designated approved, covered containers immediately.",
      },
      {
        party: "Tenant",
        text: "Never leave bagged garbage outside of containers or in hallways, stairwells, or common areas.",
      },
      {
        party: "Tenant",
        text: "If containers are full, notify the owner or property manager to arrange additional capacity.",
      },
    ],
  },

  // ── Structural / Conditions (Sec. 581(b)(4) unless noted) ───────────────
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Unsanitary Bathroom / Toilet",
    code: "Article 11 § 581(b)(4)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Clean and sanitize all bathroom fixtures, floors, walls, and surfaces. Repair or replace any broken or damaged fixtures. Ensure proper ventilation is in place. Establish a regular cleaning and maintenance schedule.",
    tenantCorrectiveAction:
      "Clean and sanitize all bathroom fixtures, floors, walls, and surfaces regularly. Use the bathroom exhaust fan during and after showering to reduce moisture and prevent mold. Report any broken fixtures, plumbing leaks, or ventilation issues to the owner or property manager promptly.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Clean and sanitize all bathroom fixtures, floors, walls, and surfaces.",
      },
      {
        party: "Owner",
        text: "Repair or replace any broken, damaged, or non-functioning bathroom fixtures.",
      },
      {
        party: "Owner",
        text: "Repair or replace the bathroom exhaust fan to ensure proper ventilation.",
      },
      {
        party: "Owner",
        text: "Repair all plumbing leaks, drips, or water intrusion in the bathroom.",
      },
      {
        party: "Owner",
        text: "Regrout or reseal tile surfaces where grout is missing, cracked, or unsanitary.",
      },
      {
        party: "Owner",
        text: "Establish a regular maintenance and cleaning schedule for common bathrooms.",
      },
      {
        party: "Tenant",
        text: "Clean and sanitize all bathroom fixtures, floors, walls, and surfaces regularly.",
      },
      {
        party: "Tenant",
        text: "Use the bathroom exhaust fan during and after showering to reduce moisture and prevent mold.",
      },
      {
        party: "Tenant",
        text: "Report any broken fixtures, plumbing leaks, or ventilation issues to the owner or property manager promptly.",
      },
      {
        party: "Tenant",
        text: "Wipe down wet surfaces after bathing to reduce moisture accumulation.",
      },
    ],
  },
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Unsanitary Floor, Walls & Ceiling",
    code: "Article 11 § 581(b)(4)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Clean, repair, and sanitize all affected floor, wall, and ceiling surfaces. Remove all filth, grease, and unsanitary materials. Repair any structural damage that contributes to unsanitary conditions.",
    tenantCorrectiveAction:
      "Clean and sanitize all affected floor, wall, and ceiling surfaces within the unit. Remove all accumulated filth, grease, food residue, and unsanitary materials. Establish a regular cleaning routine. Report any structural damage, water intrusion, or conditions beyond routine cleaning to the owner or property manager.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Clean and sanitize all affected floor, wall, and ceiling surfaces.",
      },
      {
        party: "Owner",
        text: "Remove all filth, grease, food residue, and unsanitary materials from all surfaces.",
      },
      {
        party: "Owner",
        text: "Repair all structural damage to floors, walls, or ceilings that contributes to unsanitary conditions.",
      },
      {
        party: "Owner",
        text: "Repair or replace damaged flooring that cannot be adequately cleaned and sanitized.",
      },
      {
        party: "Owner",
        text: "Repaint or refinish surfaces as necessary following cleaning and repair.",
      },
      {
        party: "Owner",
        text: "Repair any water intrusion, leaks, or moisture issues contributing to surface deterioration.",
      },
      {
        party: "Tenant",
        text: "Clean and sanitize all affected floor, wall, and ceiling surfaces within the unit.",
      },
      {
        party: "Tenant",
        text: "Remove all accumulated filth, grease, food residue, and unsanitary materials.",
      },
      {
        party: "Tenant",
        text: "Establish a regular cleaning routine to maintain sanitary conditions.",
      },
      {
        party: "Tenant",
        text: "Report structural damage, water intrusion, or conditions beyond routine cleaning to the owner or property manager.",
      },
    ],
  },
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Unsanitary Hallways",
    code: "Article 11 § 581(b)(4)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Clean and sanitize all hallway surfaces and common areas. Remove all debris, garbage, and unsanitary materials. Establish a regular cleaning and maintenance schedule for all common areas.",
    tenantCorrectiveAction:
      "Do not store personal items, garbage, or debris in hallways or common areas. Clean up any spills or debris in common areas immediately. Do not block hallway access or egress. Report unsanitary conditions in common areas to the owner or property manager promptly.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Clean and sanitize all hallway floors, walls, and surfaces in common areas.",
      },
      {
        party: "Owner",
        text: "Remove all debris, garbage, and unsanitary materials from hallways and common areas.",
      },
      {
        party: "Owner",
        text: "Establish a regular cleaning and maintenance schedule for all common areas.",
      },
      {
        party: "Owner",
        text: "Repair any damaged flooring, walls, or surfaces in hallways that contribute to unsanitary conditions.",
      },
      {
        party: "Owner",
        text: "Ensure hallway lighting is adequate to support safe access and routine cleaning.",
      },
      {
        party: "Tenant",
        text: "Do not store personal items, garbage, or debris in hallways or common areas.",
      },
      {
        party: "Tenant",
        text: "Clean up any spills or debris in common areas immediately.",
      },
      {
        party: "Tenant",
        text: "Do not block hallway access, egress routes, or fire exits.",
      },
      {
        party: "Tenant",
        text: "Report unsanitary conditions in common areas to the owner or property manager promptly.",
      },
    ],
  },
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Unsanitary Common Kitchen",
    code: "Article 11 § 581(b)(4)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Clean and sanitize all common kitchen surfaces, appliances, and equipment. Remove all food debris, grease, and unsanitary materials. Post hygiene guidelines and establish a regular cleaning and maintenance schedule.",
    tenantCorrectiveAction:
      "Clean up after each use of shared kitchen areas — wipe down surfaces, wash dishes, and dispose of all food waste immediately. Store personal food items in sealed containers. Do not leave dirty dishes or food in shared kitchen areas. Report persistent unsanitary conditions or maintenance issues to the owner or property manager.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Clean and sanitize all common kitchen countertops, surfaces, and food preparation areas.",
      },
      {
        party: "Owner",
        text: "Clean and degrease all common kitchen appliances including stove, oven, refrigerator, and microwave.",
      },
      {
        party: "Owner",
        text: "Remove all food debris, grease buildup, and unsanitary materials from the kitchen area.",
      },
      {
        party: "Owner",
        text: "Clean and sanitize all sinks, drains, and plumbing fixtures in the common kitchen.",
      },
      {
        party: "Owner",
        text: "Post hygiene and kitchen use guidelines in a visible location.",
      },
      {
        party: "Owner",
        text: "Establish a regular cleaning and maintenance schedule for the common kitchen.",
      },
      {
        party: "Owner",
        text: "Repair or replace any damaged appliances, fixtures, or surfaces that cannot be adequately cleaned.",
      },
      {
        party: "Tenant",
        text: "Clean up after each use — wipe down surfaces, wash dishes, and dispose of all food waste immediately.",
      },
      {
        party: "Tenant",
        text: "Store personal food items in sealed containers in designated areas.",
      },
      {
        party: "Tenant",
        text: "Do not leave dirty dishes or food residue in shared kitchen areas.",
      },
      {
        party: "Tenant",
        text: "Report persistent unsanitary conditions or maintenance issues to the owner or property manager promptly.",
      },
    ],
  },
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Mold Growth",
    code: "Article 11 § 581(b)(6)",
    dueDays: 30,
    defaultCorrectiveAction:
      "NOTE: Mold growth is a violation when it affects an area greater than 10 square feet. Remediate all visible mold growth following EPA mold remediation guidelines. Clean all affected surfaces and repaint with mold-resistant paint. Identify and repair the underlying moisture source (e.g., roof leaks, plumbing leaks, inadequate ventilation). Ensure proper ventilation is in place to prevent recurrence. Provide documentation of remediation to the SF Department of Public Health.",
    tenantCorrectiveAction:
      "Reduce humidity levels in the unit to prevent mold growth: open windows for at least 15 minutes each day to allow fresh air circulation, use the exhaust fan whenever showering or cooking, and wipe down windows and window sills regularly to remove condensation. Store items away from exterior walls to allow air circulation. Report any visible mold growth, moisture intrusion, plumbing leaks, or areas larger than 10 square feet to the owner or property manager immediately.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remediate all visible mold growth (areas > 10 sq ft) following EPA mold remediation guidelines.",
      },
      {
        party: "Owner",
        text: "Identify and repair the underlying moisture source (roof leak, plumbing leak, condensation).",
      },
      {
        party: "Owner",
        text: "Clean all mold-affected surfaces using appropriate antimicrobial cleaning agents.",
      },
      {
        party: "Owner",
        text: "Repaint or refinish all affected surfaces with mold-resistant paint following remediation.",
      },
      {
        party: "Owner",
        text: "Repair or install bathroom and kitchen exhaust fans to ensure adequate ventilation.",
      },
      {
        party: "Owner",
        text: "Repair all roof, window, or wall leaks contributing to moisture intrusion.",
      },
      {
        party: "Owner",
        text: "Repair any plumbing leaks or condensation issues contributing to excess moisture.",
      },
      {
        party: "Owner",
        text: "Provide documentation of mold remediation and moisture repairs to the SF Department of Public Health.",
      },
      {
        party: "Tenant",
        text: "Open windows for at least 15 minutes each day to allow fresh air circulation.",
      },
      {
        party: "Tenant",
        text: "Use the exhaust fan whenever showering or cooking to reduce humidity.",
      },
      {
        party: "Tenant",
        text: "Wipe down windows and windowsills regularly to remove condensation.",
      },
      {
        party: "Tenant",
        text: "Store items away from exterior walls to allow air circulation and prevent moisture buildup.",
      },
      {
        party: "Tenant",
        text: "Report any visible mold growth, moisture intrusion, or plumbing leaks to the owner or property manager immediately.",
      },
    ],
    observations: [
      {
        text: "Visible mold growth exceeding 10 sq ft",
        autoOwnerActions: [
          "Remediate all visible mold growth (areas > 10 sq ft) following EPA mold remediation guidelines.",
          "Repaint or refinish all affected surfaces with mold-resistant paint following remediation.",
        ],
        autoTenantActions: [
          "Open windows for at least 15 minutes each day to allow fresh air circulation.",
        ],
      },
      {
        text: "Active roof / plumbing leak identified",
        autoOwnerActions: [
          "Identify and repair the underlying moisture source (roof leak, plumbing leak, condensation).",
          "Repair all roof, window, or wall leaks contributing to moisture intrusion.",
        ],
      },
      {
        text: "No functioning bathroom exhaust fan",
        autoOwnerActions: [
          "Repair or install bathroom and kitchen exhaust fans to ensure adequate ventilation.",
        ],
        autoTenantActions: [
          "Use the exhaust fan whenever showering or cooking to reduce humidity.",
        ],
      },
      {
        text: "Previous mold painted over without remediation",
        autoOwnerActions: [
          "Clean all mold-affected surfaces using appropriate antimicrobial cleaning agents.",
        ],
      },
    ],
  },
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Accumulation of Paper Materials",
    code: "Article 11 § 581(b)(3)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Remove all accumulated waste paper, litter, and combustible trash from the premises. Set materials out for collection in compliance with Sec. 283. Prevent future accumulation through regular disposal routines.",
    tenantCorrectiveAction:
      "Remove all accumulated waste paper, newspapers, cardboard, and combustible materials from the unit and any storage areas. Set materials out for recycling or trash collection regularly. Establish a disposal routine to prevent future accumulation, which poses a fire and pest harborage risk.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remove all accumulated waste paper, litter, and combustible materials from the premises.",
      },
      {
        party: "Owner",
        text: "Set all recyclable paper and cardboard materials out for collection per Sec. 283.",
      },
      {
        party: "Owner",
        text: "Ensure adequate recycling containers are available and accessible to all occupants.",
      },
      {
        party: "Owner",
        text: "Inspect common areas and storage spaces regularly and remove accumulated materials promptly.",
      },
      {
        party: "Owner",
        text: "Post fire safety and disposal guidelines in common areas.",
      },
      {
        party: "Tenant",
        text: "Remove all accumulated waste paper, newspapers, cardboard, and combustible materials from the unit immediately.",
      },
      {
        party: "Tenant",
        text: "Set materials out for recycling or trash collection regularly.",
      },
      {
        party: "Tenant",
        text: "Establish a regular disposal routine to prevent future accumulation.",
      },
      {
        party: "Tenant",
        text: "Do not store excessive paper or combustible materials in the unit, as this poses a fire and pest harborage risk.",
      },
    ],
  },
  {
    category: "Structural / Conditions (Sec. 581(b)(4) unless noted)",
    label: "Excessive Materials",
    code: "Article 11 § 581(b)(18)",
    dueDays: 30,
    defaultCorrectiveAction:
      "Remove all excessive accumulation of materials from the premises that pose a threat to public health and safety. Ensure storage areas are organized, do not create hazardous conditions, and do not impede egress or access.",
    tenantCorrectiveAction:
      "Remove all excessive accumulation of items, boxes, furniture, and materials from the unit and any assigned storage areas. Ensure the unit does not have conditions that create a fire hazard, pest harborage, or obstruct access for inspections, pest control, or emergency egress. Dispose of unwanted items through donation, recycling, or trash collection on a regular basis.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Remove all excessive accumulation of materials from common areas and the premises.",
      },
      {
        party: "Owner",
        text: "Ensure storage areas are organized and do not create fire hazards or pest harborage conditions.",
      },
      {
        party: "Owner",
        text: "Ensure all egress routes, exits, and access points remain clear of obstructions.",
      },
      {
        party: "Owner",
        text: "Arrange for bulk item pickup or dumpster service as needed to facilitate removal.",
      },
      {
        party: "Owner",
        text: "Inspect storage areas regularly to prevent re-accumulation of excessive materials.",
      },
      {
        party: "Tenant",
        text: "Remove all excessive accumulation of items, boxes, furniture, and materials from the unit and storage areas.",
      },
      {
        party: "Tenant",
        text: "Ensure the unit does not have conditions that create a fire hazard or obstruct emergency egress.",
      },
      {
        party: "Tenant",
        text: "Ensure access is maintained for inspections, pest control, and utility service.",
      },
      {
        party: "Tenant",
        text: "Dispose of unwanted items through donation, recycling, or scheduled trash collection on a regular basis.",
      },
    ],
  },

  // ── Unpaid Fees & Other (Sec. 609 unless noted) ──────────────────────────
  {
    category: "Unpaid Fees & Other (Sec. 609 unless noted)",
    label: "Unpaid Fees",
    code: "Article 11 § 609",
    dueDays: 30,
    defaultCorrectiveAction:
      "Pay all outstanding Vector Control and Healthy Housing Inspection Program fees to the San Francisco Department of Public Health Environmental Health Branch at 49 South Van Ness Avenue, Suite 600.",
    tenantCorrectiveAction:
      "N/A — payment of inspection program fees is an owner responsibility. Please notify the owner or property manager of this outstanding fee obligation.",
    correctiveActions: [
      {
        party: "Owner",
        text: "Pay all outstanding Vector Control and Healthy Housing Inspection Program fees to SFDPH Environmental Health Branch.",
      },
      {
        party: "Owner",
        text: "Submit payment in person at 49 South Van Ness Avenue, Suite 600, San Francisco.",
      },
      {
        party: "Owner",
        text: "Contact SFDPH Environmental Health Branch to confirm the outstanding balance and acceptable payment methods.",
      },
      {
        party: "Owner",
        text: "Retain proof of payment and provide a copy to the DPH investigator upon request.",
      },
      {
        party: "Tenant",
        text: "N/A — payment of inspection program fees is an owner/property manager responsibility.",
      },
      {
        party: "Tenant",
        text: "Notify the owner or property manager of this outstanding fee obligation if they are unaware.",
      },
    ],
  },
];

export const VIOLATION_CATEGORIES = Array.from(
  new Set(VIOLATION_TYPES.map((v) => v.category)),
);

/** Return the appropriate default corrective action based on responsible party */
export function getDefaultCorrectiveAction(
  vType: ViolationType,
  party: "Owner" | "Tenant",
): string {
  return party === "Tenant"
    ? vType.tenantCorrectiveAction
    : vType.defaultCorrectiveAction;
}

/** Calculate due date string (YYYY-MM-DD) from an inspection date and a violation type */
export function calcDueDate(
  inspectionDate: string,
  vType: ViolationType,
): string {
  const base = inspectionDate ? new Date(inspectionDate) : new Date();
  if (vType.dueHours) {
    base.setHours(base.getHours() + vType.dueHours);
  } else {
    base.setDate(base.getDate() + vType.dueDays);
  }
  return base.toISOString().split("T")[0];
}

/** Build corrective action text from a set of selected action texts */
export function buildCorrectiveActionText(selectedTexts: string[]): string {
  if (selectedTexts.length === 0) return "";
  return selectedTexts.map((t, i) => `${i + 1}. ${t}`).join("\n");
}
