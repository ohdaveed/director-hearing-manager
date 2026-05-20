import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inspectionService } from "@/services/inspectionService";
import { complaintService } from "@/services/complaintService";
import { Violation } from "@/components/ViolationRow";
import { PhotoEntry } from "@/components/PhotoCard";
import { VIOLATION_TYPES, calcDueDate } from "@/components/violationTypes";
import { getFieldValidationError } from "@/utils/validationRules";

// ── Types ───────────────────────────────────────────────────────────────────
export type FormState = {
  complaintid: string;
  inspection_date: string;
  timeIn: string;
  timeOut: string;
  inspection_type: string;
  rating: string;
  access_granted_by: string;
  contact_phone: string;
  contact_email: string;
  dba: string;
  areasInspected: string[];
  violations: Violation[];
  summary: string;
  globalObservations: string[];
  hearingReferral: boolean;
  hearingNotes: string;
  isDraft: boolean;
};

// ── Constants ────────────────────────────────────────────────────────────────
export const INSPECTION_TYPES = [
  "Routine",
  "Routine Re-inspection",
  "Complaint",
  "Complaint Re-inspection",
  "Field Consultation / Survey",
  "Citation to Hearing Issued",
];

export const AREAS = [
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
] as const;

export const AREA_GROUPS: Record<string, readonly string[]> = {
  Exterior: AREAS.filter((a) =>
    ["Alleyway/Easement", "Front/Backyard", "Garage/Driveway", "Roof"].includes(a),
  ),
  Interior: AREAS.filter((a) =>
    [
      "Basement",
      "Bathroom",
      "Hallways",
      "Laundry Room",
      "Lightwells",
      "Lobby",
      "Staircase",
    ].includes(a),
  ),
  "Common Areas": AREAS.filter((a) => a === "Garbage Area"),
  Other: AREAS.filter((a) => a === "Other"),
};

export const COMMON_VIOLATION_KEYS = [
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents",
  "Sanitation (Sec. 581(b)(1)–(2))||Overgrown Vegetation",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Cockroaches",
  "Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Pigeons",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Bed Bugs",
  "Structural / Conditions (Sec. 581(b)(4) unless noted)||Mold Growth",
];

export const COMMON_VIOLATION_LABELS: Record<string, string> = {
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents": "Rodents",
  "Sanitation (Sec. 581(b)(1)–(2))||Overgrown Vegetation": "Overgrown Vegetation",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Cockroaches": "Cockroaches",
  "Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris": "Garbage / Debris",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Pigeons": "Pigeons",
  "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Bed Bugs": "Bed Bugs",
  "Structural / Conditions (Sec. 581(b)(4) unless noted)||Mold Growth": "Mold Growth",
};

const DRAFT_STORAGE_VERSION = 1;
const DRAFT_KEY = (complaintId: string) =>
  `hhvc_draft_inspection_v${DRAFT_STORAGE_VERSION}_${complaintId}`;
const LEGACY_DRAFT_PREFIX = "hhvc_draft_inspection_";

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildAutoViolations(categories: string[], inspectionDate: string): Violation[] {
  return categories
    .map((cat) => VIOLATION_TYPES.find((v) => v.label.toLowerCase() === cat.toLowerCase()))
    .filter((v): v is any => v !== undefined)
    .filter((v, idx, arr) => arr.findIndex((x) => x.label === v.label) === idx)
    .map((vType) => ({
      id: crypto.randomUUID(),
      violationKey: `${vType.category}||${vType.label}`,
      location: "",
      correctiveAction: !vType.correctiveActions ? vType.defaultCorrectiveAction : "",
      dueDate: calcDueDate(inspectionDate, vType),
      responsibleParty: "Owner" as const,
      status: "Violation" as const,
      ownerActions: !vType.correctiveActions ? [vType.defaultCorrectiveAction] : [],
      tenantActions: [],
      selectedObservations: [],
      isAuto: true,
    }));
}

function makeDefaultState(complaintId: string): FormState {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const timeIn = now.toTimeString().slice(0, 5);
  const timeOut = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
  return {
    complaintid: complaintId,
    inspection_date: date,
    timeIn,
    timeOut,
    inspection_type: "",
    rating: "Satisfactory",
    access_granted_by: "",
    contact_phone: "",
    contact_email: "",
    dba: "",
    areasInspected: [],
    violations: [],
    summary: "",
    globalObservations: [],
    hearingReferral: false,
    hearingNotes: "",
    isDraft: true,
  };
}

function makeFormWithAutoViolations(complaint: any): FormState {
  const base = makeDefaultState(complaint.id);
  const autoViolations = buildAutoViolations(complaint.category ?? [], base.inspection_date);
  return { ...base, violations: autoViolations };
}

export function newViolation(): Violation {
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

// ── Hook ─────────────────────────────────────────────────────────────────────
interface UseInspectionFormProps {
  complaintId?: string;
  inspectorName: string;
}

export function useInspectionForm({ complaintId, inspectorName }: UseInspectionFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ inspection_type?: string }>({});
  const [textErrors, setTextErrors] = useState<{ summary?: string; hearingNotes?: string }>({});
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [globalObsInput, setGlobalObsInput] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);

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
        if (form) localStorage.removeItem(DRAFT_KEY(form.complaintid));
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

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      markDirty();
      setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [markDirty],
  );

  const handleTimeInChange = useCallback(
    (newTimeIn: string) => {
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
    },
    [form, setField],
  );

  const toggleArea = useCallback(
    (area: string) => {
      markDirty();
      setForm((prev) => {
        if (!prev) return prev;
        const areas = prev.areasInspected.includes(area)
          ? prev.areasInspected.filter((a) => a !== area)
          : [...prev.areasInspected, area];
        return { ...prev, areasInspected: areas };
      });
    },
    [markDirty],
  );

  const handleViolationChange = useCallback(
    (id: string, field: keyof Violation, value: string | string[]) => {
      markDirty();
      setForm((prev) =>
        prev
          ? {
              ...prev,
              violations: prev.violations.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
            }
          : prev,
      );
    },
    [markDirty],
  );

  const handleViolationRemove = useCallback(
    (id: string) => {
      markDirty();
      setForm((prev) =>
        prev ? { ...prev, violations: prev.violations.filter((v) => v.id !== id) } : prev,
      );
    },
    [markDirty],
  );

  const handleAddViolation = useCallback(() => {
    markDirty();
    setForm((prev) =>
      prev ? { ...prev, violations: [...prev.violations, newViolation()] } : prev,
    );
  }, [markDirty]);

  const addGlobalObs = useCallback(() => {
    const text = globalObsInput.trim();
    if (!text || !form) return;
    setField("globalObservations", [...(form.globalObservations ?? []), text]);
    setGlobalObsInput("");
  }, [form, globalObsInput, setField]);

  const handleSave = useCallback(
    async (isDraft: boolean) => {
      if (!form || !selectedComplaint) return;

      const summaryErr = form.summary ? getFieldValidationError(form.summary) : undefined;
      const hearingErr = form.hearingNotes ? getFieldValidationError(form.hearingNotes) : undefined;

      if (summaryErr || hearingErr) {
        setTextErrors({ summary: summaryErr, hearingNotes: hearingErr });
        toast.error("Remove California state code references before saving.");
        return { error: "validation", summaryErr, hearingErr };
      }

      const derivedRating =
        form.violations.filter((v) => v.violationKey).length > 0
          ? "Unsatisfactory"
          : "Satisfactory";

      if (!isDraft) {
        const errors: { inspection_type?: string } = {};
        if (!form.inspection_type) errors.inspection_type = "Inspection type is required";
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          toast.error("Please fill in all required fields before submitting.");
          return { error: "required", fields: errors };
        }
      }

      setSaving(true);
      saveMutation.mutate({
        isDraft,
        inspector: inspectorName,
        complaint_id: selectedComplaint.id,
        location_id: selectedComplaint.locationid,
        inspection_date: form.inspection_date,
        time_in: form.timeIn,
        time_out: form.timeOut,
        inspection_type: form.inspection_type,
        inspection_rating: derivedRating,
        access_granted_by: form.access_granted_by || undefined,
        contact_phone: form.contact_phone || undefined,
        contact_email: form.contact_email || undefined,
        dba: form.dba || undefined,
        facility_address: selectedComplaint.address || undefined,
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
      return { success: true };
    },
    [form, inspectorName, saveMutation, selectedComplaint],
  );

  const fillInspectionDemoData = useCallback(() => {
    if (!form) return;

    const buildDemoViolation = (violationKey: string, location: string): Violation => {
      const vType = VIOLATION_TYPES.find((v) => `${v.category}||${v.label}` === violationKey);
      const base = newViolation();
      if (!vType) return base;
      return {
        ...base,
        violationKey,
        location,
        correctiveAction: vType.defaultCorrectiveAction ?? "",
        dueDate: calcDueDate(form.inspection_date, vType),
        responsibleParty: "Owner",
        ownerActions: vType.defaultCorrectiveAction ? [vType.defaultCorrectiveAction] : [],
      };
    };

    const demo = {
      inspection_type: "Routine",
      areasInspected: [
        "Hallways",
        "Bathroom",
        "Garbage Area",
        "Front/Backyard",
        "Lobby",
        "Staircase",
      ],
      summary:
        "Routine inspection conducted on property. Several violations were identified including sanitation issues in common areas and pest evidence in hallways. Property owner was present during inspection and acknowledged the findings.",
      globalObservations: [
        "Property access granted by owner",
        "Owner present throughout inspection",
      ],
      violations: [
        buildDemoViolation(
          "Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris",
          "Garbage Area",
        ),
        buildDemoViolation(
          "Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents",
          "Hallways / Common Areas",
        ),
      ],
    };
    setForm((prev) => (prev ? { ...prev, ...demo } : prev));
    toast.success("Demo inspection data filled in.");
  }, [form]);

  return {
    form,
    setForm,
    selectedComplaint,
    complaintLoading,
    saving,
    submitted,
    fieldErrors,
    setFieldErrors,
    textErrors,
    draftSavedAt,
    isDirty,
    globalObsInput,
    setGlobalObsInput,
    sortedChipKeys,
    setField,
    handleTimeInChange,
    toggleArea,
    handleViolationChange,
    handleViolationRemove,
    handleAddViolation,
    addGlobalObs,
    handleSave,
    fillInspectionDemoData,
  };
}
