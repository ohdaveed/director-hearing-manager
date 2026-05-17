import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inspectionService } from "@/services/inspectionService";
import { complaintService } from "@/services/complaintService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  CheckCircle2,
  ChevronLeft,
  Plus,
  Camera,
  Printer,
  Wand2,
} from "lucide-react";
import ViolationRow, { Violation } from "@/components/ViolationRow";
import AssignedComplaintsPanel from "@/components/AssignedComplaintsPanel";
import PhotoUploadSection from "@/components/PhotoUploadSection";
import CollapsibleSection from "@/components/CollapsibleSection";
import PrintForm, { PrintFormProps } from "@/components/PrintForm";
import { PhotoEntry } from "@/components/PhotoCard";
import {
  VIOLATION_TYPES,
  ViolationType,
  calcDueDate,
} from "@/components/violationTypes";
import { getFieldValidationError } from "@/utils/validationRules";

type ComplaintDetail = any;

const INSPECTION_TYPES = [
  "Routine",
  "Routine Re-inspection",
  "Complaint",
  "Complaint Re-inspection",
  "Field Consultation / Survey",
  "Citation to Hearing Issued",
];
const AREAS = [
  "Alleyway/Easement",
  "Basement",
  "Front/Backyard",
  "Garage/Driveway",
  "Garbage Area",
  "Hallways",
  "Laundry Room",
  "Lightwells",
  "Lobby",
  "Roof",
  "Staircase",
  "Bathroom",
  "Other",
];

const DRAFT_STORAGE_VERSION = 1;
const DRAFT_KEY = (complaintId: string) =>
  `hhvc_draft_inspection_v${DRAFT_STORAGE_VERSION}_${complaintId}`;
const LEGACY_DRAFT_PREFIX = "hhvc_draft_inspection_";

type FormState = {
  complaintid: string;
  inspection_date: string;
  timeIn: string;
  timeOut: string;
  inspection_type: string;
  rating: string;
  areasInspected: string[];
  violations: Violation[];
  summary: string;
  globalObservations: string[];
  hearingReferral: boolean;
  hearingNotes: string;
  isDraft: boolean;
};

// Common violations for quick-pick chips
const COMMON_VIOLATION_KEYS = [
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents",
  "Sanitation (Sec. 581(b)(1)–(2))||Overgrown Vegetation",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Cockroaches",
  "Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Pigeons",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Bed Bugs",
  "Structural / Conditions (Sec. 581(b)(4) unless noted)||Mold Growth",
];

const COMMON_VIOLATION_LABELS: Record<string, string> = {
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents": "Rodents",
  "Sanitation (Sec. 581(b)(1)–(2))||Overgrown Vegetation":
    "Overgrown Vegetation",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Cockroaches":
    "Cockroaches",
  "Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris":
    "Garbage / Debris",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Pigeons": "Pigeons",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Bed Bugs": "Bed Bugs",
  "Structural / Conditions (Sec. 581(b)(4) unless noted)||Mold Growth":
    "Mold Growth",
};

function buildAutoViolations(
  categories: string[],
  inspectionDate: string,
): Violation[] {
  return categories
    .map((cat) =>
      VIOLATION_TYPES.find((v) => v.label.toLowerCase() === cat.toLowerCase()),
    )
    .filter((v): v is ViolationType => v !== undefined)
    .filter((v, idx, arr) => arr.findIndex((x) => x.label === v.label) === idx)
    .map((vType) => ({
      id: crypto.randomUUID(),
      violationKey: `${vType.category}||${vType.label}`,
      location: "",
      correctiveAction: !vType.correctiveActions
        ? vType.defaultCorrectiveAction
        : "",
      dueDate: calcDueDate(inspectionDate, vType),
      responsibleParty: "Owner" as const,
      status: "Violation" as const,
      ownerActions: !vType.correctiveActions
        ? [vType.defaultCorrectiveAction]
        : [],
      tenantActions: [],
      selectedObservations: [],
      isAuto: true,
    }));
}

function makeDefaultState(complaintId: string): FormState {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const timeIn = now.toTimeString().slice(0, 5);
  const timeOut = new Date(now.getTime() + 60 * 60 * 1000)
    .toTimeString()
    .slice(0, 5);
  return {
    complaintid: complaintId,
    inspection_date: date,
    timeIn,
    timeOut,
    inspection_type: "",
    rating: "Satisfactory",
    areasInspected: [],
    violations: [],
    summary: "",
    globalObservations: [],
    hearingReferral: false,
    hearingNotes: "",
    isDraft: true,
  };
}

function makeFormWithAutoViolations(complaint: ComplaintDetail): FormState {
  const base = makeDefaultState(complaint.id);
  const autoViolations = buildAutoViolations(
    complaint.category ?? [],
    base.inspection_date,
  );
  return { ...base, violations: autoViolations };
}

function newViolation(): Violation {
  return {
    id: crypto.randomUUID(),
    violationKey: "",
    location: "",
    correctiveAction: "",
    dueDate: "",
    responsibleParty: "Owner",
    status: "Violation",
    ownerActions: [],
    tenantActions: [],
    selectedObservations: [],
  };
}

function buildPrintProps(
  form: FormState,
  detail: ComplaintDetail,
  inspectorName: string,
  photos: PhotoEntry[],
): PrintFormProps {
  return {
    facilityName: detail.address ?? "",
    contactPhone: "",
    contactEmail: "",
    locationId: detail.location_id ?? "",
    complaintId: detail.complaintid ?? "",
    reportTitle: "",
    ownerName: "",
    inspector: inspectorName,
    inspectionDate: form.inspection_date,
    timeIn: form.timeIn,
    timeOut: form.timeOut,
    facilityType: "",
    numApts: "",
    numRooms: "",
    buildingDetails: [],
    isHealthyHousing: false,
    currentBalance: undefined,
    inspectionType: form.inspection_type,
    inspectionRating:
      form.violations.filter((v) => v.violationKey).length > 0
        ? "Unsatisfactory"
        : "Satisfactory",
    areasInspected: form.areasInspected,
    violations: form.violations,
    summary: form.summary,
    globalObservations: form.globalObservations ?? [],
    observations: form.summary
      ? [{ id: "1", text: form.summary, linkedViolationKey: "" }]
      : [],
    checkedStandardCAs: {},
    standardCADetails: {},
    customCAs: [],
    photos,
    accessGrantedBy: "",
  };
}

type Props = {
  inspectorName: string;
};

export default function InspectionFormPage({ inspectorName }: Props) {
  const { complaintId } = useParams<{ complaintId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ inspection_type?: string }>(
    {},
  );
  const [, setTextErrors] = useState<{
    summary?: string;
    hearingNotes?: string;
  }>({});
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [globalObsInput, setGlobalObsInput] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [, setShowChangeComplaintDialog] = useState(false);
  const [_panelExpandTrigger, _setPanelExpandTrigger] = useState({
    owner: 0,
    tenant: 0,
  });

  const markDirty = () => setIsDirty(true);

  const [openSections, setOpenSections] = useState({
    details: true,
    areas: true,
    violations: true,
    observations: true,
    photos: false,
    hearing: false,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const { data: selectedComplaint, isLoading: complaintLoading } = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: async () => {
      if (!complaintId) return null;
      const data = await complaintService.getById(complaintId);

      const key = DRAFT_KEY(complaintId);

      // Migrate from legacy unversioned draft key
      const legacyKey = `${LEGACY_DRAFT_PREFIX}${complaintId}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        localStorage.setItem(key, legacyRaw);
        localStorage.removeItem(legacyKey);
      }

      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm(parsed);
          setDraftSavedAt(new Date());
        } catch {
          /* ignore */
        }
      } else {
        setForm(makeFormWithAutoViolations(data));
      }
      return data;
    },
    enabled: !!complaintId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => inspectionService.save(data),
    onSuccess: (_data, variables) => {
      if (!variables.isDraft) {
        localStorage.removeItem(DRAFT_KEY(form!.complaintid));
        setSubmitted(true);
        setIsDirty(false);
        toast.success("Inspection saved successfully.");
      } else {
        setIsDirty(false);
        toast.success("Draft saved.");
      }
      queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
    },
    onError: () => {
      toast.error("Failed to save. Please try again.");
    },
    onSettled: () => setSaving(false),
  });

  const sortedChipKeys = useMemo(() => {
    const matchedLabels = new Set(
      (selectedComplaint?.category ?? []).map((c: string) => c.toLowerCase()),
    );
    if (matchedLabels.size === 0) return COMMON_VIOLATION_KEYS;
    const matched: string[] = [];
    const unmatched: string[] = [];
    COMMON_VIOLATION_KEYS.forEach((key) => {
      const label = COMMON_VIOLATION_LABELS[key] ?? "";
      if (matchedLabels.has(label.toLowerCase())) matched.push(key);
      else unmatched.push(key);
    });
    return [...matched, ...unmatched];
  }, [selectedComplaint?.category]);

  const handleSelectComplaint = useCallback(
    (complaint: any) => {
      navigate(`/inspections/${complaint.id}`);
    },
    [navigate],
  );

  useEffect(() => {
    if (!form?.complaintid) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY(form.complaintid), JSON.stringify(form));
      setDraftSavedAt(new Date());
    }, 1000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form]);

  const setField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    markDirty();
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleTimeInChange = (newTimeIn: string) => {
    setField("timeIn", newTimeIn);
    if (!newTimeIn || !form) return;
    const toMins = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const fromMins = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    const inMins = toMins(newTimeIn);
    const outMins = toMins(form.timeOut || "00:00");
    if (outMins <= inMins) setField("timeOut", fromMins(inMins + 60));
  };

  const toggleArea = (area: string) => {
    markDirty();
    setForm((prev) => {
      if (!prev) return prev;
      const areas = prev.areasInspected.includes(area)
        ? prev.areasInspected.filter((a) => a !== area)
        : [...prev.areasInspected, area];
      return { ...prev, areasInspected: areas };
    });
  };

  const handleViolationChange = (
    id: string,
    field: keyof Violation,
    value: string | string[],
  ) => {
    markDirty();
    setForm((prev) =>
      prev
        ? {
            ...prev,
            violations: prev.violations.map((v) =>
              v.id === id ? { ...v, [field]: value } : v,
            ),
          }
        : prev,
    );
  };

  const handleViolationRemove = (id: string) => {
    markDirty();
    setForm((prev) =>
      prev
        ? { ...prev, violations: prev.violations.filter((v) => v.id !== id) }
        : prev,
    );
  };

  const handleAddViolation = () => {
    markDirty();
    setForm((prev) =>
      prev
        ? { ...prev, violations: [...prev.violations, newViolation()] }
        : prev,
    );
  };

  const addGlobalObs = () => {
    const text = globalObsInput.trim();
    if (!text || !form) return;
    setField("globalObservations", [...(form.globalObservations ?? []), text]);
    setGlobalObsInput("");
  };

  const handleSave = async (isDraft: boolean) => {
    if (!form || !selectedComplaint) return;

    const summaryErr = form.summary
      ? getFieldValidationError(form.summary)
      : undefined;
    const hearingErr = form.hearingNotes
      ? getFieldValidationError(form.hearingNotes)
      : undefined;
    if (summaryErr || hearingErr) {
      setTextErrors({ summary: summaryErr, hearingNotes: hearingErr });
      if (summaryErr)
        setOpenSections((prev) => ({ ...prev, observations: true }));
      if (hearingErr) setOpenSections((prev) => ({ ...prev, hearing: true }));
      toast.error("Remove California state code references before saving.");
      return;
    }

    const derivedRating =
      form.violations.filter((v) => v.violationKey).length > 0
        ? "Unsatisfactory"
        : "Satisfactory";

    if (!isDraft) {
      const errors: { inspection_type?: string } = {};
      if (!form.inspection_type)
        errors.inspection_type = "Inspection type is required";
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setOpenSections((prev) => ({ ...prev, details: true }));
        toast.error("Please fill in all required fields before submitting.");
        return;
      }
    }

    setSaving(true);
    saveMutation.mutate({
      isDraft,
      inspector: inspectorName,
      complaint_id: selectedComplaint.id,
      location_id: (selectedComplaint as any).location,
      inspection_date: form.inspection_date,
      time_in: form.timeIn,
      time_out: form.timeOut,
      inspection_type: form.inspection_type,
      inspection_rating: derivedRating,
      summary: form.summary,
      global_observations: form.globalObservations ?? [],
      areas_inspected: form.areasInspected,
      status: isDraft ? "Draft" : "Submitted",
      violations: form.violations
        .filter((v) => v.violationKey)
        .map((v) => ({
          violation_label: v.violationKey.split("||")[1] || v.violationKey,
          location_in_property: v.location,
          corrective_action: v.correctiveAction,
          responsible_party: v.responsibleParty as "Owner" | "Tenant",
          due_date: v.dueDate,
          status: v.status as "Violation" | "Abated" | "Corrected on Site",
        })),
    });
  };

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => window.print(), 300);
  };

  const fillInspectionDemoData = () => {
    if (!form) return;
    const demo = {};
    setForm((prev) => (prev ? { ...prev, ...demo } : prev));
    toast.success("Demo inspection data filled in.");
  };

  if (showPrint && form && selectedComplaint) {
    const printProps = buildPrintProps(
      form,
      selectedComplaint,
      inspectorName,
      photos,
    );
    return (
      <div>
        <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowPrint(false)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to form
          </button>
          <Button size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
        <div className="p-8 max-w-[8.5in] mx-auto">
          <PrintForm {...printProps} />
        </div>
      </div>
    );
  }

  if (submitted && selectedComplaint) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Inspection Saved
        </h2>
        <p className="text-muted-foreground mb-1">
          {selectedComplaint.address}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          {form?.violations.filter((v) => v.violationKey).length ?? 0}{" "}
          violation(s) recorded
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button onClick={() => navigate("/inspections/new")}>
            Start New Inspection
          </Button>
        </div>
      </div>
    );
  }

  if (complaintLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-6 py-6 max-w-5xl">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!selectedComplaint || !form) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Inspection Form
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Select a complaint to begin the inspection.
        </p>
        <AssignedComplaintsPanel
          inspector={inspectorName}
          onSelectComplaint={handleSelectComplaint}
        />
      </div>
    );
  }

  const violationCount = form.violations.filter((v) => v.violationKey).length;

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => {
              if (isDirty) {
                setShowChangeComplaintDialog(true);
              } else {
                navigate("/inspections/new");
              }
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Change complaint
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {selectedComplaint.address}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[
              selectedComplaint.complaintid &&
                `#${selectedComplaint.complaintid}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {saving ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          ) : draftSavedAt ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 border border-success/30 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="hidden sm:inline">Saved </span>
              {draftSavedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            onClick={fillInspectionDemoData}
          >
            <Wand2 className="w-3.5 h-3.5" />{" "}
            <span className="hidden sm:inline">Fill Demo Data</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
            onClick={() => {
              const allOpen = Object.values(openSections).every(Boolean);
              setOpenSections({
                details: !allOpen,
                areas: !allOpen,
                violations: !allOpen,
                observations: !allOpen,
                photos: !allOpen,
                hearing: !allOpen,
              });
            }}
          >
            {Object.values(openSections).every(Boolean)
              ? "Collapse All"
              : "Expand All"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
        <CollapsibleSection
          title="Inspection Details"
          open={openSections.details}
          onToggle={() => toggleSection("details")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inspection Date
              </label>
              <Input
                type="date"
                value={form.inspection_date}
                onChange={(e) => setField("inspection_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inspection Type *
              </label>
              <Select
                value={form.inspection_type}
                onValueChange={(v) => {
                  setField("inspection_type", v);
                  setFieldErrors((prev) => ({
                    ...prev,
                    inspection_type: undefined,
                  }));
                }}
              >
                <SelectTrigger
                  className={`h-9 text-sm ${fieldErrors.inspection_type ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time In
              </label>
              <Input
                type="time"
                value={form.timeIn}
                onChange={(e) => handleTimeInChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time Out
              </label>
              <Input
                type="time"
                value={form.timeOut}
                onChange={(e) => setField("timeOut", e.target.value)}
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Areas Inspected"
          open={openSections.areas}
          onToggle={() => toggleSection("areas")}
        >
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.areasInspected.includes(area) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-foreground border-border hover:bg-muted"}`}
              >
                {area}
              </button>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title={`Violations${violationCount > 0 ? ` (${violationCount})` : ""}`}
        open={openSections.violations}
        onToggle={() => toggleSection("violations")}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {sortedChipKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                const vType = VIOLATION_TYPES.find(
                  (v) => `${v.category}||${v.label}` === key,
                );
                if (!vType) return;
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        violations: [
                          ...prev.violations,
                          {
                            ...newViolation(),
                            violationKey: key,
                            correctiveAction: vType.defaultCorrectiveAction,
                            dueDate: calcDueDate(prev.inspection_date, vType),
                          },
                        ],
                      }
                    : null,
                );
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted"
            >
              + {COMMON_VIOLATION_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {form.violations.map((v, i) => (
            <ViolationRow
              key={v.id}
              violation={v}
              index={i}
              inspectionDate={form.inspection_date}
              onChange={handleViolationChange}
              onRemove={handleViolationRemove}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={handleAddViolation}
        >
          <Plus className="w-4 h-4" /> Add Violation
        </Button>
      </CollapsibleSection>

      <CollapsibleSection
        title="Observations & Summary"
        open={openSections.observations}
        onToggle={() => toggleSection("observations")}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Global Observations
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a global observation…"
                value={globalObsInput}
                onChange={(e) => setGlobalObsInput(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addGlobalObs}>
                Add
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Summary / Observations
            </label>
            <Textarea
              placeholder="Describe key findings..."
              value={form.summary}
              onChange={(e) => setField("summary", e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Photos"
        icon={<Camera className="w-4 h-4" />}
        open={openSections.photos}
        onToggle={() => toggleSection("photos")}
      >
        <PhotoUploadSection
          complaintId={form.complaintid}
          inspector={inspectorName}
          photos={photos}
          onPhotosChange={setPhotos}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Hearing Preparation"
        open={openSections.hearing}
        onToggle={() => toggleSection("hearing")}
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox
              checked={form.hearingReferral}
              onCheckedChange={(v) => setField("hearingReferral", !!v)}
            />
            Refer to Director's Hearing
          </label>
          {form.hearingReferral && (
            <Textarea
              placeholder="Hearing notes..."
              value={form.hearingNotes}
              onChange={(e) => setField("hearingNotes", e.target.value)}
            />
          )}
        </div>
      </CollapsibleSection>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-10">
        <Button
          variant="outline"
          size="lg"
          className="gap-2 w-full sm:w-auto"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}{" "}
          Save Draft
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 flex-1 sm:flex-none"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button
            size="lg"
            className="gap-2 flex-1 sm:flex-none"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}{" "}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
