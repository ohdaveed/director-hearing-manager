import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { locationService } from "@/services/locationService";
import { complaintFormSchema } from "@/schemas/complaintSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Building2,
  User,
  Calendar,
  Hash,
  Wand2,
  ExternalLink,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { ALL_COMPLAINT_STATUSES } from "@/utils/complaintStatuses";
import { INSPECTORS } from "@/utils/inspectors";

// ── Demo data generator ───────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randDigits(n: number) {
  return Array.from({ length: n }, () => randInt(0, 9)).join("");
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
  "Thomas",
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
    assignedTo: inspectorName || pick([...INSPECTORS]),
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

type Location = any["locations"][0];
// ── Constants ────────────────────────────────────────────────────────────────
const FACILITY_TYPES = [
  "Tourist Hotel",
  "Residential Hotel",
  "Apartments",
  "Residential Property",
  "Vacant Lot",
  "City Owned Property",
  "Other",
];
const COMPLAINT_TYPES = [
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
const METHODS = ["Email", "Phone", "In-Person", "311", "Walk-In", "Letter"];
const PROGRAMS = [
  "Healthy Housing and Vector Control",
  "Environmental Health",
  "Vector Control",
];
// Complaint categories derived from HHVC violation types, grouped for easy scanning
const CATEGORY_GROUPS: { group: string; items: string[] }[] = [
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
const CLOSED_STATUSES = [
  "Closed — Compliant",
  "Closed — No Violation",
  "Closed — Unfounded",
];

// Smart-default mappings
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

// Returns suggested categories based on free-text subtype — labels match HHVC violation types
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

// Recent locations stored in localStorage
const RECENT_LOCATIONS_KEY = "hhvc_recent_locations";
type RecentLocation = {
  id: string;
  address: string;
  facilityType?: string;
  ownerName?: string;
};

function getRecentLocations(): RecentLocation[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function validateEmail(email: string) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Form State ───────────────────────────────────────────────────────────────
type FormState = {
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
};

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
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  step,
  done,
  icon,
  title,
  optional,
}: {
  step: string | React.ReactNode;
  done: boolean;
  icon?: React.ReactNode;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
        {icon} {title}
      </h2>
      {optional && (
        <span className="text-xs text-muted-foreground ml-1">— optional</span>
      )}
    </div>
  );
}

function StepBar({ steps }: { steps: { label: string; done: boolean }[] }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${step.done ? "bg-primary" : "bg-muted"}`}
              />
              <span
                className={`text-[10px] font-medium ${step.done ? "text-primary" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-2 flex-shrink-0" />}
          </div>
        ))}
        <span className="ml-3 text-xs font-semibold tabular-nums text-primary">
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type Props = {
  inspectorName?: string;
  onSuccess?: () => void;
};

export default function ComplaintEntryPage({
  inspectorName,
  onSuccess,
}: Props) {
  const navigate = useNavigate();
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
  const queryClient = useQueryClient();
  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setValue(field as any, value);

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
  const [submitted, setSubmitted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<{
    id?: string;
    address: string;
    complaintId: string;
    assignedTo: string;
  } | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const hasLocation = !!selectedLocation || !!state.locAddress;
  const hasComplainant = !!state.complainantName || state.complainantAnonymous;
  const hasDetails = !!state.description;

  const handleSelectLocation = (loc: any) => {
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
    mutationFn: (data: any) => complaintService.create(data),
    onSuccess: (data) => {
      toast.success("Complaint created successfully!");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      if (onSuccess) {
        onSuccess();
      } else {
        setSubmittedSummary({
          id: data.id,
          address:
            selectedLocation?.address || state.locAddress || "Unknown address",
          complaintId: data.complaintid,
          assignedTo: state.assignedTo || "Unassigned",
        });
        setSubmitted(true);
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
        locationId = (selectedLocation as any).id;
      } else if (state.locAddress) {
        const newLocation = await locationService.create({
          address: state.locAddress,
          location_id: state.locLocationId || undefined,
          owner_name: state.locOwnerName || undefined,
          owner_address: state.locOwnerAddress || undefined,
          owner_phone: state.locOwnerPhone || undefined,
          owner_email: state.locOwnerEmail || undefined,
          facility_type: state.locFacilityType || undefined,
          number_of_units: state.locNumUnits
            ? Number(state.locNumUnits)
            : undefined,
          healthy_housing: state.locHealthyHousing || undefined,
          census_tract: state.locCensusTract || undefined,
          block_lot: state.locBlockLot || undefined,
        });
        locationId = (newLocation as any).id;
      }

      await createMutation.mutateAsync({
        complaintid: state.complaintId || undefined,
        address: selectedLocation?.address || state.locAddress,
        locationid: locationId || undefined,
        description: state.description,
        status: state.status,
        assigned_to: state.assignedTo,
        date_entered: state.dateReceived || undefined,
        date_assigned: state.dateAssigned || undefined,
        date_closed: state.dateClosed || undefined,
        category: state.categories?.length ? state.categories : undefined,
        complaint_type: state.complaintType || undefined,
        complaint_subtype: state.complaintSubtype || undefined,
        method_received: state.methodReceived || undefined,
        assigned_program: state.assignedProgram || undefined,
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
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save complaint. Please check your inputs.");
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
    setSubmitted(false);
    setSubmitAttempted(false);
    setTouched({});
  };

  // ── Success screen (admin flow only) ─────────────────────────────────────
  if (submitted && submittedSummary) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Complaint Created
        </h2>
        <p className="text-muted-foreground mb-1">{submittedSummary.address}</p>
        <p className="text-sm text-muted-foreground mb-1">
          Complaint ID:{" "}
          <span className="font-mono font-semibold">
            {submittedSummary.complaintId}
          </span>
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Assigned to: {submittedSummary.assignedTo}
        </p>
        <div className="flex items-center justify-center gap-3">
          {submittedSummary.id && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/complaints/${submittedSummary.id}`)}
            >
              <ExternalLink className="w-4 h-4" /> View Complaint
            </Button>
          )}
          <Button onClick={handleReset} className="gap-2">
            <Plus className="w-4 h-4" /> Create Another Complaint
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { label: "Location", done: hasLocation },
    { label: "Complainant", done: hasComplainant },
    { label: "Details", done: hasDetails },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            New Complaint Entry
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete all relevant sections from the Environmental Health Branch
            Complaint Form.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0 border-dashed text-muted-foreground hover:text-foreground"
          onClick={fillDemoData}
          title="Fill all fields with realistic demo data"
        >
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">Fill Demo Data</span>
          <span className="sm:hidden">Demo</span>
        </Button>
      </div>

      <StepBar steps={steps} />

      {/* ── Section 1: Complaint Information ─────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step={<FileText className="w-4 h-4" />}
          done={!!state.caseNumber311 || !!state.complaintId}
          icon={undefined}
          title="Complaint Information"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="complaintId"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
            >
              <Hash className="w-3 h-3" /> Complaint ID
            </label>
            <Input
              id="complaintId"
              placeholder="e.g. 419076 — leave blank to auto-generate"
              value={state.complaintId}
              onChange={(e) => set("complaintId", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Enter the ID from the paper form, or leave blank.
            </p>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="caseNumber311"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              311 Case #
            </label>
            <Input
              id="caseNumber311"
              placeholder="e.g. 101003863368"
              value={state.caseNumber311}
              onChange={(e) => set("caseNumber311", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="dateReceived"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Date Received
            </label>
            <Input
              id="dateReceived"
              type="date"
              value={state.dateReceived}
              onChange={(e) => set("dateReceived", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="methodReceived"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Method Received
            </label>
            <Select
              value={state.methodReceived}
              onValueChange={(v) => set("methodReceived", v)}
            >
              <SelectTrigger id="methodReceived" className="text-sm h-9">
                <SelectValue placeholder="How was this received?" />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="assignedProgram"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Assigned Program
            </label>
            <Select
              value={state.assignedProgram}
              onValueChange={(v) => set("assignedProgram", v)}
            >
              <SelectTrigger id="assignedProgram" className="text-sm h-9">
                <SelectValue placeholder="Select program..." />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="assignedTo"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Assigned Inspector
            </label>
            <Select
              value={state.assignedTo}
              onValueChange={(v) => set("assignedTo", v)}
            >
              <SelectTrigger id="assignedTo" className="text-sm h-9">
                <SelectValue placeholder="Assign inspector..." />
              </SelectTrigger>
              <SelectContent>
                {INSPECTORS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="dateAssigned"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" /> Date Assigned
            </label>
            <Input
              id="dateAssigned"
              type="date"
              value={state.dateAssigned}
              onChange={(e) => set("dateAssigned", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Property Location ─────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step="2"
          done={hasLocation}
          icon={<MapPin className="w-4 h-4 text-primary" />}
          title="Property Location"
        />
        {submitAttempted && !hasLocation && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mb-3 -mt-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />A property
            location is required to save this complaint.
          </div>
        )}

        {!selectedLocation && !creatingNewLocation && (
          <div className="space-y-3">
            {/* Item #4: Recent locations */}
            {recentLocations.length > 0 && !locationQuery && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Recent Locations
                </p>
                <div className="space-y-1">
                  {recentLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() =>
                        handleSelectLocation({
                          id: loc.id,
                          address: loc.address,
                          facilityType: (loc as any).facility_type,
                          ownerName: (loc as any).owner_name,
                          locationId: undefined,
                        })
                      }
                      className="w-full text-left px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {loc.address}
                      </p>
                      {((loc as any).facility_type ||
                        (loc as any).owner_name) && (
                        <p className="text-xs text-muted-foreground">
                          {[(loc as any).facility_type, (loc as any).owner_name]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="relative">
              <Input
                id="locationSearch"
                aria-label="Search by address"
                placeholder="Search by address..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  doLocationSearch(e.target.value);
                }}
                className="pr-9"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isSearchingLocations ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <AnimatePresence>
              {locationResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-border rounded-lg overflow-hidden shadow-sm"
                >
                  {locationResults.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {loc.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[(loc as any).facility_type, (loc as any).owner_name]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCreateNew}
            >
              <Plus className="w-4 h-4" /> Create New Location
            </Button>
          </div>
        )}

        {selectedLocation && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedLocation.address}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[
                  (selectedLocation as any).facility_type,
                  (selectedLocation as any).owner_name,
                  (selectedLocation as any).location_id
                    ? `ID: ${(selectedLocation as any).location_id}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSelectedLocation(null);
                setLocationQuery("");
              }}
            >
              Change
            </Button>
          </div>
        )}

        {creatingNewLocation && (
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                New Location Details
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setCreatingNewLocation(false)}
              >
                Cancel
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="locAddress"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Address <span className="text-destructive">*</span>
                </label>
                <Input
                  id="locAddress"
                  placeholder="Street address"
                  value={state.locAddress}
                  onChange={(e) => {
                    set("locAddress", e.target.value);
                  }}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, locAddress: true }))
                  }
                  className={
                    touched.locAddress && !state.locAddress
                      ? "border-destructive"
                      : ""
                  }
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locLocationId"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Location ID
                </label>
                <Input
                  id="locLocationId"
                  placeholder="e.g. 110881"
                  value={state.locLocationId}
                  onChange={(e) => set("locLocationId", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locBlockLot"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Block / Lot
                </label>
                <Input
                  id="locBlockLot"
                  placeholder="e.g. 1234 / 056"
                  value={state.locBlockLot}
                  onChange={(e) => set("locBlockLot", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locFacilityType"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Facility Type
                </label>
                <Select
                  value={state.locFacilityType}
                  onValueChange={(v) => {
                    set("locFacilityType", v);
                    // Smart default: auto-check Healthy Housing for multi-unit residential
                    if (HEALTHY_HOUSING_FACILITY_TYPES.has(v)) {
                      const units = Number(state.locNumUnits);
                      if (!units || units >= 3) set("locHealthyHousing", true);
                    } else {
                      set("locHealthyHousing", false);
                    }
                  }}
                >
                  <SelectTrigger id="locFacilityType" className="text-sm h-9">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locCensusTract"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Census Tract
                </label>
                <Input
                  id="locCensusTract"
                  placeholder="e.g. 027.00"
                  value={state.locCensusTract}
                  onChange={(e) => set("locCensusTract", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerName"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" /> Owner Name
                </label>
                <Input
                  id="locOwnerName"
                  placeholder="Full name"
                  value={state.locOwnerName}
                  onChange={(e) => set("locOwnerName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerAddress"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Owner Address
                </label>
                <Input
                  id="locOwnerAddress"
                  placeholder="Mailing address"
                  value={state.locOwnerAddress}
                  onChange={(e) => set("locOwnerAddress", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerPhone"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> Owner Phone
                </label>
                <Input
                  id="locOwnerPhone"
                  placeholder="(415) 555-1234"
                  value={state.locOwnerPhone}
                  onChange={(e) => set("locOwnerPhone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerEmail"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> Owner Email
                </label>
                <Input
                  id="locOwnerEmail"
                  type="email"
                  placeholder="owner@email.com"
                  value={state.locOwnerEmail}
                  onChange={(e) => set("locOwnerEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locNumUnits"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  # Units
                </label>
                <Input
                  id="locNumUnits"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={state.locNumUnits}
                  onChange={(e) => {
                    const val = e.target.value;
                    set("locNumUnits", val);
                    if (
                      HEALTHY_HOUSING_FACILITY_TYPES.has(state.locFacilityType)
                    ) {
                      set("locHealthyHousing", !val || Number(val) >= 3);
                    }
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                  <Checkbox
                    id="locHealthyHousing"
                    checked={state.locHealthyHousing}
                    onCheckedChange={(v) => set("locHealthyHousing", !!v)}
                  />
                  Healthy Housing Property (3+ units)
                </label>
              </div>
            </div>
          </div>
        )}

        {hasLocation && (
          <div className="pt-4 border-t border-border mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="unitNumber"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Unit #
              </label>
              <Input
                id="unitNumber"
                placeholder="e.g. 3B"
                value={state.unitNumber}
                onChange={(e) => set("unitNumber", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="facilityName"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Facility Name
              </label>
              <Input
                id="facilityName"
                placeholder="Optional"
                value={state.facilityName}
                onChange={(e) => set("facilityName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="facilityOwnership"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Facility Ownership
              </label>
              <Input
                id="facilityOwnership"
                placeholder="Owner / management"
                value={state.facilityOwnership}
                onChange={(e) => set("facilityOwnership", e.target.value)}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Section 3: Complainant Information ───────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step="3"
          done={hasComplainant}
          icon={<User className="w-4 h-4 text-primary" />}
          title="Complainant Information"
          optional
        />
        <label className="flex items-center gap-2.5 cursor-pointer select-none mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <Checkbox
            id="complainantAnonymous"
            checked={state.complainantAnonymous}
            onCheckedChange={(v) => {
              set("complainantAnonymous", !!v);
              if (v) {
                set("complainantName", "");
                set("complainantPhone", "");
                set("complainantEmail", "");
                set("complainantAddress", "");
                set("complainantContactDates", "");
              }
            }}
          />
          <span className="text-sm font-medium">Anonymous Complainant</span>
          {state.complainantAnonymous && (
            <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
              Anonymous ☑
            </span>
          )}
        </label>
        <AnimatePresence>
          {!state.complainantAnonymous && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="complainantName"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <User className="w-3 h-3" /> Name
                  </label>
                  <Input
                    id="complainantName"
                    placeholder="Full name"
                    value={state.complainantName}
                    onChange={(e) => set("complainantName", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="complainantPhone"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <Input
                    id="complainantPhone"
                    placeholder="(415) 555-5678"
                    value={state.complainantPhone}
                    onChange={(e) => set("complainantPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="complainantEmail"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input
                    id="complainantEmail"
                    type="email"
                    placeholder="complainant@email.com"
                    value={state.complainantEmail}
                    onChange={(e) => {
                      set("complainantEmail", e.target.value);
                      if (validateEmail(e.target.value))
                        form.clearErrors("complainantEmail");
                    }}
                    onBlur={() => blurField("complainantEmail")}
                    className={
                      touched.complainantEmail &&
                      formState.errors.complainantEmail
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {touched.complainantEmail &&
                    formState.errors.complainantEmail && (
                      <p className="text-xs text-destructive mt-1">
                        {formState.errors.complainantEmail.message as string}
                      </p>
                    )}
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="complainantAddress"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <Input
                    id="complainantAddress"
                    placeholder="Mailing address"
                    value={state.complainantAddress}
                    onChange={(e) => set("complainantAddress", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="complainantContactDates"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3" /> Contact Dates
                  </label>
                  <Input
                    id="complainantContactDates"
                    placeholder="e.g. 4/2/26, 4/15/26"
                    value={state.complainantContactDates}
                    onChange={(e) =>
                      set("complainantContactDates", e.target.value)
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Section 4: Complaint Details ──────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step="4"
          done={hasDetails}
          icon={undefined}
          title="Complaint Details"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="complaintType"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Complaint Type
              </label>
              <Select
                value={state.complaintType}
                onValueChange={(v) => {
                  set("complaintType", v);
                  // Smart default: auto-set program
                  const prog = COMPLAINT_TYPE_TO_PROGRAM[v];
                  if (prog && !state.assignedProgram)
                    set("assignedProgram", prog);
                  else if (prog) set("assignedProgram", prog);
                }}
              >
                <SelectTrigger id="complaintType" className="text-sm h-9">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="complaintSubtype"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Complaint Subtype
              </label>
              <Input
                id="complaintSubtype"
                placeholder="e.g. Rodent infestation"
                value={state.complaintSubtype}
                onChange={(e) => {
                  const val = e.target.value;
                  set("complaintSubtype", val);
                  // Smart default: auto-check categories from subtype keywords
                  const inferred = inferCategoriesFromSubtype(val);
                  if (inferred.length > 0) {
                    const merged = [
                      ...new Set([...state.categories, ...inferred]),
                    ];
                    set("categories", merged);
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="description"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Complaint Details / Description{" "}
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Describe the complaint in detail..."
              value={state.description}
              onChange={(e) => set("description", e.target.value)}
              onBlur={() => blurField("description")}
              className={`min-h-[120px] resize-none ${submitAttempted && !state.description.trim() ? "border-destructive" : ""}`}
            />
            {submitAttempted && !state.description.trim() && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="w-3 h-3" /> Description is required.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label
              htmlFor="inspectorNotes"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Inspector Notes
            </label>
            <Textarea
              id="inspectorNotes"
              placeholder="Internal notes (not part of the complaint description)..."
              className="min-h-[72px] resize-none"
              disabled
            />
            <p className="text-[10px] text-muted-foreground">
              Inspector notes can be added via the Chronology after saving.
            </p>
          </div>
          <fieldset>
            <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Category
            </legend>
            <div className="space-y-3">
              {CATEGORY_GROUPS.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 pl-1">
                    {items.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 cursor-pointer text-sm select-none"
                      >
                        <Checkbox
                          id={cat}
                          checked={state.categories.includes(cat)}
                          onCheckedChange={(checked) =>
                            set(
                              "categories",
                              checked
                                ? [...state.categories, cat]
                                : state.categories.filter((c) => c !== cat),
                            )
                          }
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </SectionCard>

      {/* ── Section 5: Complaint Status ───────────────────────────────────── */}
      <SectionCard>
        <h2 className="font-semibold text-foreground text-base mb-4">
          Complaint Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="status"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Status
            </label>
            <Select
              value={state.status}
              onValueChange={(v) => set("status", v)}
            >
              <SelectTrigger id="status" className="text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_COMPLAINT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AnimatePresence>
            {CLOSED_STATUSES.includes(state.status) && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-1"
              >
                <label
                  htmlFor="inspectorNotes"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Date Closed
                </label>
                <Input
                  id="dateClosed"
                  type="date"
                  value={state.dateClosed}
                  onChange={(e) => set("dateClosed", e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionCard>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> Required fields
        </p>
        <Button
          size="lg"
          className="gap-2 px-8"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {isSubmitting ? "Saving..." : "Save Complaint"}
        </Button>
      </div>
    </div>
  );
}
