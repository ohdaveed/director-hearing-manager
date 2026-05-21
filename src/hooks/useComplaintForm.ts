import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { complaintService } from "@/services/complaintService";
import { locationService } from "@/services/locationService";
import { complaintFormSchema } from "@/schemas/complaintSchema";
import { INSPECTORS } from "@/utils/inspectors";
import { Database } from "@/types/database";
import { useDebouncedCallback } from "use-debounce";

// ── Types ───────────────────────────────────────────────────────────────────
export type FormState = {
  complaintId: string;
  caseNumber311: string;
  dateReceived: string;
  locAddress: string;
  locLocationId: string;
  locBlockLot: string;
  locOwnerName: string;
  locOwnerAddress: string;
  locOwnerPhone: string;
  locOwnerEmail: string;
  locFacilityType: string;
  locNumUnits: string;
  locHealthyHousing: boolean;
  locCensusTract: string;
  unitNumber: string;
  facilityName: string;
  facilityOwnership: string;
  complaintType: string;
  complaintSubtype: string;
  methodReceived: string;
  assignedProgram: string;
  dateAssigned: string;
  description: string;
  categories: string[];
  assignedTo: string;
  complainantAnonymous: boolean;
  complainantName: string;
  complainantPhone: string;
  complainantEmail: string;
  complainantAddress: string;
  complainantContactDates: string;
  status: string;
  dateClosed: string;
  hearing_rp_name: string;
  hearing_rp_phone: string;
  hearing_rp_email: string;
  hearing_rp_address: string;
  purpose_of_hearing: string;
  notice_of_hearing_date: string;
  hearing_order_date: string;
};

type Location = Database["public"]["Tables"]["locations"]["Row"];

export type RecentLocation = {
  id: string;
  address: string;
  facilityType?: string;
  ownerName?: string;
};

// ── Constants ────────────────────────────────────────────────────────────────
export const FACILITY_TYPES = [
  "Tourist Hotel",
  "Residential Hotel",
  "Apartments",
  "Residential Property",
  "Vacant Lot",
  "City Owned Property",
  "Other",
];

export const COMPLAINT_TYPES = [
  "Animals and Pests",
  "Housing Code Violations",
  "Vector Control",
  "Air Pollutants and Odors",
  "Sanitation / Waste",
  "Hazardous Conditions",
  "Rodents",
  "Noise",
  "Other",
];

export const METHODS = [
  "Email",
  "Phone",
  "In-Person",
  "311",
  "Walk-In",
  "Letter",
];

export const PROGRAMS = [
  "Healthy Housing and Vector Control",
  "Environmental Health",
  "Vector Control",
];

export const CATEGORY_GROUPS = [
  {
    group: "Pests, Vermin & Animals",
    items: [
      "Bed Bugs",
      "Cockroaches",
      "Flies",
      "Mosquitoes",
      "Pigeons",
      "Poison Oak",
      "Rodents",
    ],
  },
  {
    group: "Sanitation",
    items: [
      "Garbage / Refuse / Waste / Debris",
      "Human / Animal Waste (Sewage)",
      "Overgrown Vegetation",
    ],
  },
  {
    group: "Garbage Area",
    items: ["Inadequate Garbage Containers / Lids", "Uncontainerized Garbage"],
  },
  {
    group: "Structural / Conditions",
    items: [
      "Unsanitary Bathroom / Toilet",
      "Unsanitary Floor, Walls & Ceiling",
      "Unsanitary Hallways",
      "Unsanitary Common Kitchen",
      "Mold Growth",
      "Accumulation of Paper Materials",
      "Excessive Materials",
    ],
  },
  {
    group: "Unpaid Fees & Other",
    items: ["Unpaid Fees", "Other"],
  },
];

export const CLOSED_STATUSES = [
  "Closed — Compliant",
  "Closed — No Violation",
  "Closed — Unfounded",
];

const COMPLAINT_TYPE_TO_PROGRAM: Record<string, string> = {
  "Vector Control": "Healthy Housing and Vector Control",
  Rodents: "Healthy Housing and Vector Control",
  "Animals and Pests": "Healthy Housing and Vector Control",
  "Housing Code Violations": "Healthy Housing and Vector Control",
  "Sanitation / Waste": "Healthy Housing and Vector Control",
  "Hazardous Conditions": "Environmental Health",
  "Air Pollutants and Odors": "Environmental Health",
};

const HEALTHY_HOUSING_FACILITY_TYPES = new Set([
  "Apartments",
  "Residential Hotel",
  "Residential Property",
]);

const RECENT_LOCATIONS_KEY = "hhvc_recent_locations";

// ── Helpers ──────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randDigits(n: number) {
  return Array.from({ length: n }, () => randInt(0, 9)).join("");
}

function getRecentLocations(): RecentLocation[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function inferCategoriesFromSubtype(subtype: string): string[] {
  const s = subtype.toLowerCase();
  const result: string[] = [];
  if (/rodent|rat|mice|mouse/.test(s)) result.push("Rodents");
  if (/pigeon|bird/.test(s)) result.push("Pigeons");
  if (/bed.?bug/.test(s)) result.push("Bed Bugs");
  if (/cockroach|roach/.test(s)) result.push("Cockroaches");
  if (/mosquito/.test(s)) result.push("Mosquitoes");
  if (/\bfly\b|flies/.test(s)) result.push("Flies");
  if (/poison.?oak/.test(s)) result.push("Poison Oak");
  if (/vegetation|weed|overgrown|grass/.test(s))
    result.push("Overgrown Vegetation");
  if (/garbage|debris|trash|refuse/.test(s))
    result.push("Garbage / Refuse / Waste / Debris");
  if (/sewage|human.?waste|animal.?waste/.test(s))
    result.push("Human / Animal Waste (Sewage)");
  if (/garbage.?container|lid|bin/.test(s))
    result.push("Inadequate Garbage Containers / Lids");
  if (/uncontainerized/.test(s)) result.push("Uncontainerized Garbage");
  if (/mold|mildew/.test(s)) result.push("Mold Growth");
  if (/bathroom|toilet/.test(s)) result.push("Unsanitary Bathroom / Toilet");
  if (/floor|wall|ceiling/.test(s))
    result.push("Unsanitary Floor, Walls & Ceiling");
  if (/hallway/.test(s)) result.push("Unsanitary Hallways");
  if (/kitchen/.test(s)) result.push("Unsanitary Common Kitchen");
  if (/paper|newspaper|cardboard/.test(s))
    result.push("Accumulation of Paper Materials");
  if (/hoard|excess|accumul/.test(s)) result.push("Excessive Materials");
  if (/unpaid.?fee|fee/.test(s)) result.push("Unpaid Fees");
  return [...new Set(result)];
}

const SF_STREETS = [
  "Mission St",
  "Valencia St",
  "Folsom St",
  "Howard St",
  "Bryant St",
  "Haight St",
  "Divisadero St",
  "Fillmore St",
  "Turk St",
  "Eddy St",
  "Ellis St",
  "Post St",
  "Sutter St",
  "Bush St",
  "Geary Blvd",
  "Cesar Chavez St",
  "Potrero Ave",
  "Guerrero St",
  "Church St",
  "Noe St",
  "Castro St",
  "Clayton St",
  "Carl St",
  "Stanyan St",
  "Melrose Ave",
  "Chenery St",
  "Randall St",
  "Cortland Ave",
  "Precita Ave",
];
const FIRST_NAMES = [
  "Maria",
  "James",
  "Linda",
  "Robert",
  "Patricia",
  "Michael",
  "Barbara",
  "David",
  "Jennifer",
  "Richard",
  "Susan",
  "Charles",
  "Jessica",
  "Thomas",
  "Sarah",
  "Christopher",
  "Karen",
  "Daniel",
  "Lisa",
  "Matthew",
];
const LAST_NAMES = [
  "Garcia",
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Miller",
  "Davis",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Young",
  "Lee",
];
const CENSUS_TRACTS = [
  "015.00",
  "017.00",
  "019.00",
  "021.00",
  "023.00",
  "025.00",
  "027.00",
  "029.00",
  "031.00",
  "033.00",
];

type DemoScenario = {
  complaintType: string;
  categories: string[];
  facilityTypes: string[];
  programs: string[];
  subtypes: string[];
  descriptions: string[];
  isHealthyHousing: boolean;
};

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    complaintType: "Vector Control",
    categories: ["Rodents"],
    facilityTypes: ["Apartments", "Residential Property", "Residential Hotel"],
    programs: ["Healthy Housing and Vector Control", "Vector Control"],
    subtypes: ["Rodent infestation", "Rats", "Mice"],
    descriptions: [
      "Tenant reports a severe rodent infestation in the kitchen and bathrooms. Droppings observed along baseboards and inside lower cabinets. Gnaw marks visible on cabinet doors and food packaging. Property management has not responded after multiple written requests over two months.",
      "Neighbor reports rats entering their apartment through gaps around plumbing under the kitchen sink. Several rats spotted running along the back fence at night. Garbage area behind the building has not been cleaned in weeks, providing a food source.",
      "Resident in Unit 3 reports hearing rodents in the walls and ceiling at night. Mouse droppings found in the closet and near the stove. Building manager placed a few snap traps but no licensed pest control has been contracted. Problem has persisted for over six weeks.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Vector Control",
    categories: ["Overgrown Vegetation"],
    facilityTypes: ["Vacant Lot", "Residential Property"],
    programs: ["Healthy Housing and Vector Control", "Vector Control"],
    subtypes: ["Overgrown vegetation", "Weed growth", "Vegetation harborage"],
    descriptions: [
      "Caller reports a vacant lot with overgrown weeds and grass exceeding four feet in height along the perimeter fence. Neighbors have observed rats burrowing into the vegetation near the fence line. The lot has not been maintained in over three months.",
      "Adjacent property owner complaining about overgrown vegetation on the neighboring vacant lot spilling onto their property. Dense brush growth is creating harborage for rodents. Property owner appears to be out of state and unresponsive to neighbor notices.",
      "Overgrown vegetation observed covering the rear yard and side easement. Weeds, ivy, and tall grass have not been cut all season. Neighboring tenant has seen rodent activity in the vegetation and is concerned about infestation spreading.",
    ],
    isHealthyHousing: false,
  },
  {
    complaintType: "Vector Control",
    categories: ["Pigeons"],
    facilityTypes: ["Residential Hotel", "Tourist Hotel", "Apartments"],
    programs: ["Healthy Housing and Vector Control", "Vector Control"],
    subtypes: ["Pigeon roosting", "Bird infestation", "Pigeon droppings"],
    descriptions: [
      "Tenants complaining about a large pigeon colony roosting on the rooftop and fire escapes. Significant accumulation of bird droppings on common area balconies and stairwell landings. Residents report health concerns and the smell is described as overwhelming.",
      "Caller reports pigeons nesting under the eaves and in an open attic vent at the front of the building. Droppings are accumulating on the entrance walkway and steps, creating a slip hazard and unsanitary conditions for residents entering the building.",
      "Property manager reports ongoing pigeon problem on the rooftop HVAC units. Large flock roosting and nesting, with droppings contaminating the roof surface and washing down the building exterior. Previous deterrent spikes have been dislodged.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Healthy Housing",
    categories: ["Garbage/Refuse/Waste"],
    facilityTypes: ["Apartments", "Residential Hotel", "Residential Property"],
    programs: ["Healthy Housing and Vector Control"],
    subtypes: ["Garbage accumulation", "Debris", "Waste buildup"],
    descriptions: [
      "Complaint regarding excessive accumulation of garbage, old furniture, and household debris in the rear yard and common areas. Multiple bulk items left out for weeks. Strong odor attracting flies and rodents. Neighboring residents have made repeated complaints to the property owner with no response.",
      "Tenant reports the garbage area is overflowing with uncollected waste bags piled outside the bins. The lids cannot close. Garbage juice is pooling on the ground and the smell is strong. Raccoons and rodents have been seen in the garbage area at night.",
      "Complainant reports a unit in the building has been dumping garbage bags outside their front door in the hallway for over a month. Hallway smells strongly of rotting waste. Building manager has not taken action. Bags are creating a health hazard and fire egress concern.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Vector Control",
    categories: ["Cockroaches"],
    facilityTypes: ["Residential Hotel", "Apartments", "Tourist Hotel"],
    programs: ["Healthy Housing and Vector Control", "Vector Control"],
    subtypes: ["Cockroach infestation", "Roaches"],
    descriptions: [
      "Tenant reports a heavy cockroach infestation throughout the unit — kitchen, bathroom, and bedrooms. Cockroaches are visible during daylight hours on counters and walls. Owner has sprayed over-the-counter products but not hired a licensed pest control operator. Problem has been ongoing for three months.",
      "Resident in a single-room occupancy hotel reports cockroaches coming from the shared kitchen and bathroom into multiple rooms on the second floor. Multiple tenants have complained. Hotel management has ignored all requests for professional pest treatment.",
      "Parent calling to report cockroach infestation in their apartment, which has a young child. Cockroaches observed in the child's bedroom and throughout the kitchen. Unit has no obvious sanitation issues — the infestation appears to be coming from behind the walls from other units.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Healthy Housing",
    categories: ["Bed Bugs"],
    facilityTypes: ["Residential Hotel", "Apartments", "Tourist Hotel"],
    programs: ["Healthy Housing and Vector Control"],
    subtypes: ["Bed bug infestation", "Bed bugs"],
    descriptions: [
      "Tenant reports a severe bed bug infestation in their unit. Bites have been confirmed by a doctor. Bugs observed on the mattress seams and behind the headboard. Owner hired an unlicensed contractor who applied the wrong treatment. Resident has not been able to sleep in the bedroom for three weeks.",
      "Multiple tenants in a residential hotel reporting bed bugs spreading through the building. At least four rooms on the third floor are known to be affected. Management has done nothing to address the infestation, and residents fear further spread.",
      "Caller is a tenant who discovered bed bugs during their first week in a new apartment. Believes the unit was infested prior to move-in. Landlord is refusing to acknowledge the problem and is blaming the tenant. Resident has photos of bugs and bites.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Healthy Housing",
    categories: ["Mold/Mildew"],
    facilityTypes: ["Apartments", "Residential Property", "Residential Hotel"],
    programs: ["Healthy Housing and Vector Control"],
    subtypes: ["Mold growth", "Mildew", "Water intrusion"],
    descriptions: [
      "Tenant reports visible black mold growing on the bedroom wall and ceiling after a roof leak that was reported four months ago and never repaired. The affected area has grown to cover approximately three square feet. Resident has developed respiratory symptoms. Owner acknowledges the leak but has not arranged repairs.",
      "Resident reports extensive mold growth in the bathroom — covering the ceiling, grout lines, and drywall around the bathtub. No functioning exhaust fan is present. Previous mold was painted over by the landlord without proper remediation. Recurrence began within weeks.",
      "Caller complains of mold growth behind the kitchen sink and inside the lower cabinets following a slow plumbing leak. The leak has been repaired but the mold has not been remediated. Strong musty odor throughout the unit. Resident has young children and is concerned about health impacts.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Healthy Housing",
    categories: ["Hoarding"],
    facilityTypes: ["Apartments", "Residential Property", "Residential Hotel"],
    programs: ["Healthy Housing and Vector Control"],
    subtypes: ["Hoarding", "Excessive accumulation", "Unsanitary conditions"],
    descriptions: [
      "Building manager reports a tenant with a severe hoarding condition. Stacked newspapers, boxes, and household items fill the unit floor to ceiling in multiple rooms. The hallway outside the unit also has items blocking the fire egress path. Strong odor coming from the unit into the common hallway.",
      "Neighbor complaining about foul odor coming from adjacent unit. Building manager gained access and reports floor-to-ceiling accumulation of materials including clothing, food containers, and garbage throughout the unit. Evidence of pest activity including rodent droppings observed during the limited inspection.",
      "Residential hotel manager reports a long-term resident whose room has become uninhabitable due to accumulation of belongings covering all floor space. Rotting food containers observed mixed with personal belongings. The manager is unable to inspect for pests or perform any maintenance in the room.",
    ],
    isHealthyHousing: true,
  },
  {
    complaintType: "Vector Control",
    categories: ["Mosquitoes"],
    facilityTypes: ["Residential Property", "Apartments", "Vacant Lot"],
    programs: ["Healthy Housing and Vector Control", "Vector Control"],
    subtypes: ["Mosquito breeding", "Standing water", "Mosquito infestation"],
    descriptions: [
      "Resident reports being bitten by mosquitoes inside their home, which they believe are breeding in a neighbor's neglected backyard pond. The pond has not been maintained or treated and is covered in algae. Multiple neighbors on the block have complained about the mosquito problem.",
      "Caller reports standing water pooling in a low-lying area of a vacant lot adjacent to their property following recent rains. Water has been standing for over a week and they have observed mosquito larvae. Concerned about West Nile virus risk in the neighborhood.",
      "Property manager reports that a fountain/water feature in the building's common courtyard has not been functioning for two months, turning it into a standing water breeding site. Several tenants have complained about mosquitoes. Maintenance has not addressed the issue.",
    ],
    isHealthyHousing: false,
  },
];

function generateDemoData(
  inspectorName?: string,
): Partial<FormState> & { _locationAddress: string } {
  const scenario = pick(DEMO_SCENARIOS);
  const streetNum = randInt(100, 4999);
  const street = pick(SF_STREETS);
  const facilityType = pick(scenario.facilityTypes);
  const isVacantLot = facilityType === "Vacant Lot";
  const zip = `941${String(randInt(0, 9)).padStart(2, "0")}`;
  const address = `${streetNum} ${street}, San Francisco, CA ${zip}`;
  const blockLot = `${randInt(1000, 9999)} / ${String(randInt(1, 999)).padStart(3, "0")}`;
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const ownerFirst = pick(FIRST_NAMES);
  const ownerLast = pick(LAST_NAMES);

  const receivedDaysAgo = randInt(1, 21);
  const receivedDate = new Date();
  receivedDate.setDate(receivedDate.getDate() - receivedDaysAgo);
  const dateReceived = receivedDate.toISOString().split("T")[0];

  const assignedDate = new Date(receivedDate);
  assignedDate.setDate(assignedDate.getDate() + randInt(1, 3));
  const dateAssigned = assignedDate.toISOString().split("T")[0];

  const isAnonymous = Math.random() > 0.65;

  return {
    _locationAddress: address,
    complaintId: "",
    caseNumber311: Math.random() > 0.5 ? `101${randDigits(9)}` : "",
    dateReceived,
    locAddress: address,
    locLocationId: randDigits(6),
    locBlockLot: blockLot,
    locOwnerName: `${ownerFirst} ${ownerLast}`,
    locOwnerAddress: `${randInt(100, 999)} ${pick(SF_STREETS)}, San Francisco, CA 94102`,
    locOwnerPhone: `(415) ${randInt(200, 999)}-${randDigits(4)}`,
    locOwnerEmail: `${ownerFirst.toLowerCase()}.${ownerLast.toLowerCase()}@email.com`,
    locFacilityType: facilityType,
    locNumUnits: isVacantLot ? "" : String(pick([2, 4, 6, 8, 12, 16, 24])),
    locHealthyHousing: scenario.isHealthyHousing && !isVacantLot,
    locCensusTract: pick(CENSUS_TRACTS),
    unitNumber:
      !isVacantLot && Math.random() > 0.45
        ? pick(["1", "2", "3", "4", "5", "1A", "2B", "3C", "101", "202", "305"])
        : "",
    facilityName:
      !isVacantLot && Math.random() > 0.55
        ? `${ownerLast} ${pick(["Apartments", "Hotel", "Residence"])}`
        : "",
    facilityOwnership: `${ownerFirst} ${ownerLast}`,
    complaintType: scenario.complaintType,
    complaintSubtype: pick(scenario.subtypes),
    methodReceived: pick(["311", "Phone", "Email", "Walk-In"]),
    assignedProgram: pick(scenario.programs),
    dateAssigned,
    description: pick(scenario.descriptions),
    categories: scenario.categories,
    assignedTo: inspectorName || pick([...INSPECTORS]).email,
    complainantAnonymous: isAnonymous,
    complainantName: isAnonymous ? "" : `${firstName} ${lastName}`,
    complainantPhone: isAnonymous
      ? ""
      : `(415) ${randInt(200, 999)}-${randDigits(4)}`,
    complainantEmail: isAnonymous
      ? ""
      : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
    complainantAddress: isAnonymous
      ? ""
      : `${randInt(100, 999)} ${pick(SF_STREETS)}, San Francisco, CA 94103`,
    complainantContactDates: "",
    status: "New",
    dateClosed: "",
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
interface UseComplaintFormProps {
  inspectorName?: string;
  onSuccess?: (summary: {
    id?: string;
    address: string;
    complaintId: string;
    assignedTo: string;
  }) => void;
}

const today = new Date().toISOString().split("T")[0];

function makeInitialState(inspectorName?: string): FormState {
  return {
    complaintId: "",
    caseNumber311: "",
    dateReceived: today,
    locAddress: "",
    locLocationId: "",
    locBlockLot: "",
    locOwnerName: "",
    locOwnerAddress: "",
    locOwnerPhone: "",
    locOwnerEmail: "",
    locFacilityType: "",
    locNumUnits: "",
    locHealthyHousing: false,
    locCensusTract: "",
    unitNumber: "",
    facilityName: "",
    facilityOwnership: "",
    complaintType: "",
    complaintSubtype: "",
    methodReceived: "311",
    assignedProgram: "",
    dateAssigned: today,
    description: "",
    categories: [],
    assignedTo: inspectorName || "",
    complainantAnonymous: false,
    complainantName: "",
    complainantPhone: "",
    complainantEmail: "",
    complainantAddress: "",
    complainantContactDates: "",
    status: "New",
    dateClosed: "",
    hearing_rp_name: "",
    hearing_rp_phone: "",
    hearing_rp_email: "",
    hearing_rp_address: "",
    purpose_of_hearing: "",
    notice_of_hearing_date: "",
    hearing_order_date: "",
  };
}

export function useComplaintForm({
  inspectorName,
  onSuccess,
}: UseComplaintFormProps = {}) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: makeInitialState(inspectorName),
  });

  const {
    handleSubmit: formHandleSubmit,
    formState,
    setValue,
    watch,
    reset: formReset,
  } = form;

  const state = watch() as FormState;

  // Location UI state
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [creatingNewLocation, setCreatingNewLocation] = useState(false);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [recentLocations] = useState<RecentLocation[]>(getRecentLocations);

  // Form meta
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const hasLocation = !!selectedLocation || !!state.locAddress;
  const hasComplainant = !!state.complainantName || state.complainantAnonymous;
  const hasDetails = !!state.description;

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    setLocationQuery(loc?.address || "");
    setValue("locAddress", loc?.address || "");
  };

  const handleCreateNew = () => {
    setSelectedLocation(null);
    setCreatingNewLocation(true);
  };

  const blurField = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const createMutation = useMutation({
    mutationFn: (data: Database["public"]["Tables"]["complaints"]["Insert"]) =>
      complaintService.create(data),
    onSuccess: (data) => {
      toast.success("Complaint created successfully!");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      if (onSuccess) {
        onSuccess({
          id: data.id,
          address:
            selectedLocation?.address || state.locAddress || "Unknown address",
          complaintId: data.legacy_complaint_id || "Unknown",
          assignedTo: state.assignedTo || "Unassigned",
        });
      }
    },
    onError: () => toast.error("Failed to create complaint"),
  });

  const doLocationSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setLocationResults([]);
      return;
    }
    setIsSearchingLocations(true);
    try {
      const res = await locationService.search(q);
      setLocationResults(res);
    } catch {
      /* no-op */
    } finally {
      setIsSearchingLocations(false);
    }
  }, 500);

  const onSubmit = formHandleSubmit(async () => {
    setSubmitAttempted(true);

    if (!hasLocation || !state.description.trim()) {
      toast.error(
        "Please provide a property location and description before saving.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let locationId: string | undefined;
      if (selectedLocation) {
        locationId = selectedLocation.id;
      } else if (state.locAddress) {
        const newLocation = await locationService.create({
          address: state.locAddress,
          location_id: state.locLocationId || undefined,
          owner_name: state.locOwnerName || undefined,
          owner_address: state.locOwnerAddress || undefined,
          owner_phone: state.locOwnerPhone || undefined,
          owner_email: state.locOwnerEmail || undefined,
          facility_type: (state.locFacilityType as any) || undefined,
          number_of_units: state.locNumUnits
            ? Number(state.locNumUnits)
            : undefined,
          healthy_housing: state.locHealthyHousing || undefined,
          census_tract: state.locCensusTract || undefined,
          block_lot: state.locBlockLot || undefined,
        });
        locationId = newLocation.id;
      }

      await createMutation.mutateAsync({
        legacy_complaint_id: state.complaintId || undefined,
        address: selectedLocation?.address || state.locAddress,
        legacy_location_id: locationId || undefined,
        description: state.description,
        status: state.status as any,
        assigned_to: state.assignedTo,
        date_entered: state.dateReceived || undefined,
        date_assigned: state.dateAssigned || undefined,
        date_closed: state.dateClosed || undefined,
        category: state.categories?.length ? state.categories : undefined,
        complaint_type: state.complaintType || undefined,
        complaint_subtype: state.complaintSubtype || undefined,
        method_received: state.methodReceived as any,
        assigned_program: state.assignedProgram as any,
        "311_case_number": state.caseNumber311 || undefined,
        unit_number: state.unitNumber || undefined,
        facility_name: state.facilityName || undefined,
        facility_ownership: state.facilityOwnership || undefined,
        complainant_anonymous: state.complainantAnonymous || undefined,
        complainant_name: state.complainantName || undefined,
        complainant_phone: state.complainantPhone || undefined,
        complainant_email: state.complainantEmail || undefined,
        complainant_address: state.complainantAddress || undefined,
        complainant_contact_dates: state.complainantContactDates || undefined,
        hearing_rp_name: state.hearing_rp_name || undefined,
        hearing_rp_phone: state.hearing_rp_phone || undefined,
        hearing_rp_email: state.hearing_rp_email || undefined,
        hearing_rp_address: state.hearing_rp_address || undefined,
        purpose_of_hearing: state.purpose_of_hearing || undefined,
        notice_of_hearing_date: state.notice_of_hearing_date || undefined,
        hearing_order_date: state.hearing_order_date || undefined,
      });
    } catch (err: any) {
      console.error(err);
      if (err?.code === "42501") {
        toast.error(
          "Permission denied. Please sign out and sign back in to refresh your session.",
        );
      } else {
        toast.error("Failed to save complaint. Please check your inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  const fillDemoData = () => {
    const demo = generateDemoData(inspectorName);
    formReset(makeInitialState(inspectorName));
    setTimeout(() => {
      Object.entries(demo).forEach(([k, v]) => {
        if (k !== "_locationAddress") {
          setValue(k as any, v);
        }
      });
      setLocationQuery(demo._locationAddress);
      setSelectedLocation(null);
      setCreatingNewLocation(true);
      setLocationResults([]);
      setSubmitAttempted(false);
      setTouched({});
    }, 0);
  };

  const handleReset = () => {
    formReset(makeInitialState(inspectorName));
    setLocationQuery("");
    setSelectedLocation(null);
    setCreatingNewLocation(false);
    setLocationResults([]);
    setSubmitAttempted(false);
    setTouched({});
  };

  const setField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setValue(field as any, value);

    // Side effects for smart defaults
    if (field === "locFacilityType") {
      const v = value as string;
      if (HEALTHY_HOUSING_FACILITY_TYPES.has(v)) {
        const units = Number(state.locNumUnits);
        if (!units || units >= 3) setValue("locHealthyHousing", true);
      } else {
        setValue("locHealthyHousing", false);
      }
    }

    if (field === "locNumUnits") {
      const val = value as string;
      if (HEALTHY_HOUSING_FACILITY_TYPES.has(state.locFacilityType)) {
        setValue("locHealthyHousing", !val || Number(val) >= 3);
      }
    }

    if (field === "complaintType") {
      const prog = COMPLAINT_TYPE_TO_PROGRAM[value as string];
      if (prog) setValue("assignedProgram", prog as any);
    }

    if (field === "complaintSubtype") {
      const inferred = inferCategoriesFromSubtype(value as string);
      if (inferred.length > 0) {
        const merged = [...new Set([...state.categories, ...inferred])];
        setValue("categories", merged);
      }
    }
  };

  return {
    form,
    state,
    locationQuery,
    setLocationQuery,
    locationResults,
    selectedLocation,
    setSelectedLocation,
    creatingNewLocation,
    setCreatingNewLocation,
    isSearchingLocations,
    recentLocations,
    submitAttempted,
    isSubmitting,
    touched,
    hasLocation,
    hasComplainant,
    hasDetails,
    handleSelectLocation,
    handleCreateNew,
    blurField,
    doLocationSearch,
    onSubmit,
    fillDemoData,
    handleReset,
    setField,
    formState,
  };
}
