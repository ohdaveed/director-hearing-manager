import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspectionService';
import { complaintService } from '@/services/complaintService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Save, CheckCircle2, ChevronLeft, Plus, Camera, Printer, Wand2, XCircle, AlertTriangle, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ViolationRow, { Violation } from '@/components/ViolationRow';
import AssignedComplaintsPanel from '@/components/AssignedComplaintsPanel';
import PhotoUploadSection from '@/components/PhotoUploadSection';
import CollapsibleSection from '@/components/CollapsibleSection';
import PrintForm, { PrintFormProps } from '@/components/PrintForm';
import { PhotoEntry } from '@/components/PhotoCard';
import { VIOLATION_TYPES, ViolationType, calcDueDate } from '@/components/violationTypes';
import { getFieldValidationError } from '@/utils/validationRules';

type ComplaintDetail = any; // Properly type later

// ── Inspection demo data ──────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

type InspectionDemoScenario = {
  inspectionType: string;
  areas: string[];
  violationLabels: string[];
  summaries: string[];
};

const INSPECTION_DEMO_SCENARIOS: InspectionDemoScenario[] = [
  {
    inspectionType: 'Complaint',
    areas: ['Front/Backyard', 'Garbage Area', 'Alleyway/Easement'],
    violationLabels: ['Rodents', 'Overgrown Vegetation'],
    summaries: [
      'Complaint inspection conducted. Significant rodent burrow activity observed along the perimeter fence and in the overgrown rear yard. Fresh droppings found near the garbage area. Vegetation exceeds three feet in height along the south fence line, providing harborage. Owner has not contracted a licensed pest control operator. Corrective action required.',
      'Complaint inspection. Evidence of active rodent infestation found in the rear yard — burrow entrances near the foundation and along the fence. Overgrown weeds throughout the back lot are providing harborage. Garbage area has uncovered bins with food waste accessible to pests. No pest control service on record.',
    ],
  },
  {
    inspectionType: 'Complaint Re-inspection',
    areas: ['Front/Backyard', 'Garbage Area'],
    violationLabels: ['Overgrown Vegetation'],
    summaries: [
      'Complaint re-inspection conducted to follow up on open violation for overgrown vegetation. All vegetation has been trimmed and removed. Garbage area is clean and bins have lids. No signs of active rodent activity observed. Owner provided pest control invoice dated two weeks prior. All violations abated. Case closed.',
      'Re-inspection conducted. Vegetation has been cut back and the rear lot cleared of debris. No new rodent activity observed. Garbage containers are covered and in good condition. Owner confirmed ongoing monthly pest control contract. All health code violations have been abated.',
    ],
  },
  {
    inspectionType: 'Complaint',
    areas: ['Hallways', 'Lobby', 'Staircase', 'Garbage Area'],
    violationLabels: ['Cockroaches', 'Garbage / Refuse / Waste / Debris'],
    summaries: [
      'Complaint inspection of residential hotel. Cockroach activity observed in second-floor hallway and common bathroom. Live cockroaches visible on walls in daylight. Garbage area has multiple unsecured bags outside the bins. No pest control contract in place. Management notified of required corrective actions.',
      'Inspection conducted following tenant complaint of cockroach infestation. Cockroach droppings and shed skins found behind kitchen cabinets in a ground-floor unit. Common hallway has accumulated debris and garbage bags left outside doors. Owner has not responded to prior notices. Citations issued.',
    ],
  },
  {
    inspectionType: 'Complaint',
    areas: ['Roof', 'Hallways', 'Staircase'],
    violationLabels: ['Pigeons', 'Unsanitary Hallways'],
    summaries: [
      'Complaint inspection regarding pigeon infestation on rooftop and fire escape. Large congregation of pigeons observed roosting along the roof parapet and fire escape landings. Heavy accumulation of droppings on landing surfaces creates a slip and health hazard. No bird exclusion devices installed. Hallways have debris and droppings tracked in from the roof access. Owner notified.',
      'Inspection conducted for pigeon harborage complaint. Active roosting observed under eaves and on rooftop mechanical equipment. Significant fecal matter accumulation on third-floor exterior walkway and stairwell landing. Building management has not taken any deterrent action. Corrective actions and timeline issued.',
    ],
  },
  {
    inspectionType: 'Complaint',
    areas: ['Bathroom', 'Hallways'],
    violationLabels: ['Mold Growth', 'Unsanitary Bathroom / Toilet'],
    summaries: [
      'Complaint inspection for reported mold growth. Visible black mold observed on bathroom ceiling and two bedroom walls near the window. Affected area exceeds 10 square feet. Roof leak source identified but not repaired. No exhaust fan functioning in bathroom. Owner has not retained a remediation contractor. Written notice issued with 30-day correction timeline.',
      'Inspection conducted for mold complaint. Mold growth confirmed on bathroom ceiling and tile grout — approximately 12 square feet. Underlying moisture source is a slow plumbing leak in the wall that has not been repaired. Bathroom exhaust fan is non-functional. Tenant reports issue was present at move-in six months ago.',
    ],
  },
  {
    inspectionType: 'Routine',
    areas: ['Garbage Area', 'Alleyway/Easement', 'Front/Backyard'],
    violationLabels: ['Garbage / Refuse / Waste / Debris', 'Uncontainerized Garbage'],
    summaries: [
      'Routine inspection conducted. Garbage area found with multiple overflowing bins and loose bags of waste on the ground. Alleyway has accumulated debris and bulk items. Odor present and fly activity noted. Owner notified of violations. Re-inspection scheduled for 30 days.',
      'Routine annual inspection. Rear yard has accumulated bulk items, old appliances, and bagged garbage that has not been collected. Garbage bins in the side alley are inadequate for the number of units — bins overflowing every collection day. Owner must address garbage capacity and remove accumulated debris.',
    ],
  },
  {
    inspectionType: 'Complaint',
    areas: ['Hallways', 'Lobby', 'Basement'],
    violationLabels: ['Rodents', 'Garbage / Refuse / Waste / Debris'],
    summaries: [
      'Complaint inspection. Fresh rodent droppings found in basement utility room and ground-floor hallway near garbage chute. Entry points identified — gaps around plumbing penetrations in the basement wall. Garbage staging area in the basement has loose waste on the floor. Licensed pest control has not been contracted. Owner notified of violations.',
      'Inspection for rodent complaint in multi-unit building. Rodent droppings found in the lobby, basement storage area, and common hallway. Multiple potential entry points identified including gaps under the building entrance door and open pipe chases. Garbage area has unsecured bags. Management must hire a licensed PCO within 14 days.',
    ],
  },
  {
    inspectionType: 'Complaint Re-inspection',
    areas: ['Front/Backyard', 'Garbage Area'],
    violationLabels: ['Overgrown Vegetation', 'Rodents'],
    summaries: [
      'Re-inspection conducted. Vegetation along the rear fence has been partially cut but significant regrowth observed on the east side of the lot. Fresh rodent burrow entrances identified near the foundation — pest control invoice provided is more than 90 days old and does not reflect current treatment. Violations not fully abated. Second re-inspection scheduled.',
      'Complaint re-inspection. Overgrown vegetation not fully abated — weeds exceeding two feet in height remain along the north fence. Rodent activity still evident, with fresh droppings near the garbage area. Pest control company visited but treatment documentation is incomplete. Violations remain open. Second re-inspection required.',
    ],
  },
];

function generateInspectionDemoData(inspectionDate: string): Partial<FormState> {
  const scenario = pick(INSPECTION_DEMO_SCENARIOS);

  const violations: Violation[] = scenario.violationLabels.slice(0, 2).map(label => {
    const vType = VIOLATION_TYPES.find(v => v.label === label);
    const ownerDefault = vType && !vType.correctiveActions ? vType.defaultCorrectiveAction : '';
    return {
      id: crypto.randomUUID(),
      violationKey: vType ? `${vType.category}||${vType.label}` : label,
      location: pick(['Front yard', 'Rear yard', 'Common hallway', 'Basement', 'Roof', 'Garbage area', 'Unit interior', 'Alleyway']),
      correctiveAction: ownerDefault,
      dueDate: vType ? calcDueDate(inspectionDate, vType) : '',
      responsibleParty: 'Owner',
      status: 'Violation',
      ownerActions: ownerDefault ? [ownerDefault] : [],
      tenantActions: [],
      selectedObservations: [],
    };
  });

  const isReinspection = scenario.inspectionType.includes('Re-inspection');
  const addHearingReferral = isReinspection && violations.length > 0;

  return {
    inspectionType: scenario.inspectionType,
    areasInspected: scenario.areas,
    violations,
    summary: pick(scenario.summaries),
    hearingReferral: addHearingReferral,
    hearingNotes: addHearingReferral
      ? 'Owner has failed to abate violations after multiple re-inspections and notices. Case is recommended for referral to Director\'s Hearing for enforcement action.'
      : '',
  };
}

const INSPECTION_TYPES = [
  'Routine', 'Routine Re-inspection', 'Complaint',
  'Complaint Re-inspection', 'Field Consultation / Survey', 'Citation to Hearing Issued',
];
const AREAS = [
  'Alleyway/Easement', 'Basement', 'Front/Backyard', 'Garage/Driveway',
  'Garbage Area', 'Hallways', 'Laundry Room', 'Lightwells', 'Lobby',
  'Roof', 'Staircase', 'Bathroom', 'Other',
];

const DRAFT_KEY = (complaintId: string) => `hhvc_draft_inspection_${complaintId}`;

type FormState = {
  complaintId: string;
  inspectionDate: string;
  timeIn: string;
  timeOut: string;
  inspectionType: string;
  rating: string;
  areasInspected: string[];
  violations: Violation[];
  summary: string;
  globalObservations: string[];
  hearingReferral: boolean;
  hearingNotes: string;
  isDraft: boolean;
};

/** Build violation cards pre-populated from the complaint's category array */
function buildAutoViolations(categories: string[], inspectionDate: string): Violation[] {
  return categories
    .map(cat => VIOLATION_TYPES.find(v => v.label.toLowerCase() === cat.toLowerCase()))
    .filter((v): v is ViolationType => v !== undefined)
    .filter((v, idx, arr) => arr.findIndex(x => x.label === v.label) === idx)
    .map(vType => ({
      id: crypto.randomUUID(),
      violationKey: `${vType.category}||${vType.label}`,
      location: '',
      correctiveAction: !vType.correctiveActions ? vType.defaultCorrectiveAction : '',
      dueDate: calcDueDate(inspectionDate, vType),
      responsibleParty: 'Owner' as const,
      status: 'Violation' as const,
      ownerActions: !vType.correctiveActions ? [vType.defaultCorrectiveAction] : [],
      tenantActions: [],
      selectedObservations: [],
      isAuto: true,
    }));
}

function makeFormWithAutoViolations(complaint: ComplaintDetail): FormState {
  const base = makeDefaultState(complaint.id);
  const autoViolations = buildAutoViolations(complaint.category ?? [], base.inspectionDate);
  return { ...base, violations: autoViolations };
}

function makeDefaultState(complaintId: string): FormState {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const timeIn = now.toTimeString().slice(0, 5);
  const timeOut = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
  return {
    complaintId, inspectionDate: date, timeIn, timeOut,
    inspectionType: '', rating: 'Satisfactory', areasInspected: [], violations: [],
    summary: '', globalObservations: [], hearingReferral: false, hearingNotes: '', isDraft: true,
  };
}

function newViolation(): Violation {
  return {
    id: crypto.randomUUID(), violationKey: '', location: '',
    correctiveAction: '', dueDate: '', responsibleParty: 'Owner', status: 'Violation',
    ownerActions: [], tenantActions: [], selectedObservations: [],
  };
}

function buildPrintProps(
  form: FormState,
  detail: ComplaintDetail,
  inspectorName: string,
  photos: PhotoEntry[],
): PrintFormProps {
  return {
    facilityName: detail.address ?? '',
    contactPhone: '',
    contactEmail: '',
    locationId: detail.locationId ?? '',
    complaintId: detail.complaintId ?? '',
    reportTitle: '',
    ownerName: '',
    inspector: inspectorName,
    inspectionDate: form.inspectionDate,
    timeIn: form.timeIn,
    timeOut: form.timeOut,
    facilityType: '',
    numApts: '',
    numRooms: '',
    buildingDetails: [],
    isHealthyHousing: false,
    currentBalance: undefined,
    inspectionType: form.inspectionType,
    inspectionRating: form.violations.filter(v => v.violationKey).length > 0 ? 'Unsatisfactory' : 'Satisfactory',
    areasInspected: form.areasInspected,
    violations: form.violations,
    summary: form.summary,
    globalObservations: form.globalObservations ?? [],
    observations: form.summary ? [{ id: '1', text: form.summary, linkedViolationKey: '' }] : [],
    checkedStandardCAs: {},
    standardCADetails: {},
    customCAs: [],
    photos,
    accessGrantedBy: '',
  };
}

type Props = {
  inspectorName: string;
};

// Common violations for quick-pick chips
const COMMON_VIOLATION_KEYS = [
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents',
  'Sanitation (Sec. 581(b)(1)–(2))||Overgrown Vegetation',
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Cockroaches',
  'Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris',
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Pigeons',
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Bed Bugs',
  'Structural / Conditions (Sec. 581(b)(4) unless noted)||Mold Growth',
];

const COMMON_VIOLATION_LABELS: Record<string, string> = {
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Rodents': 'Rodents',
  'Sanitation (Sec. 581(b)(1)–(2))||Overgrown Vegetation': 'Overgrown Vegetation',
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Cockroaches': 'Cockroaches',
  'Sanitation (Sec. 581(b)(1)–(2))||Garbage / Refuse / Waste / Debris': 'Garbage / Debris',
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Pigeons': 'Pigeons',
  'Pests, Vermin & Animals (Sec. 581(b)(8) unless noted)||Bed Bugs': 'Bed Bugs',
  'Structural / Conditions (Sec. 581(b)(4) unless noted)||Mold Growth': 'Mold Growth',
};

export default function InspectionFormPage({ inspectorName }: Props) {
  // ── URL-driven context ────────────────────────────────────────────────────
  const { complaintId } = useParams<{ complaintId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ inspectionType?: string }>({});
  const [textErrors, setTextErrors] = useState<{ summary?: string; hearingNotes?: string }>({});
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [globalObsInput, setGlobalObsInput] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Unsaved-work tracking ─────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [showChangeComplaintDialog, setShowChangeComplaintDialog] = useState(false);

  const { data: selectedComplaint, isLoading: complaintLoading } = useQuery({
    queryKey: ['complaint', complaintId],
    queryFn: async () => {
      if (!complaintId) return null;
      const data = await complaintService.getById(complaintId);
      
      const key = DRAFT_KEY(complaintId);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setForm(JSON.parse(saved) as FormState);
          setDraftSavedAt(new Date());
          toast.info('Draft restored from last session.');
        } catch { /* ignore corrupt draft */ }
      } else {
        setForm(makeFormWithAutoViolations(data));
      }
      
      return data;
    },
    enabled: !!complaintId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => inspectionService.save(data),
    onSuccess: (data, variables) => {
      if (!variables.isDraft) {
        localStorage.removeItem(DRAFT_KEY(form!.complaintId));
        setSubmitted(true);
        setIsDirty(false);
        toast.success('Inspection saved successfully.');
      } else {
        setIsDirty(false);
        toast.success('Draft saved.');
      }
      queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: () => {
      toast.error('Failed to save. Please try again.');
    }
  });

  // ── Selecting a complaint from the picker navigates to its URL ────────────
  const handleSelectComplaint = useCallback((complaint: ComplaintDetail) => {
    navigate(`/inspections/${complaint.id}`);
  }, [navigate]);

  // Block browser close / tab refresh when form is dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !submitted) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, submitted]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!form?.complaintId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY(form.complaintId), JSON.stringify(form));
      setDraftSavedAt(new Date());
    }, 1000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form]);

  // ── Alt+1 / Alt+2 keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    if (!form || !selectedComplaint) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '1') {
        e.preventDefault();
        setPanelExpandTrigger(prev => ({ ...prev, owner: prev.owner + 1 }));
      } else if (e.key === '2') {
        e.preventDefault();
        setPanelExpandTrigger(prev => ({ ...prev, tenant: prev.tenant + 1 }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form, selectedComplaint]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    markDirty();
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleTimeInChange = (newTimeIn: string) => {
    setField('timeIn', newTimeIn);
    if (!newTimeIn || !form) return;
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const fromMins = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const inMins = toMins(newTimeIn);
    const outMins = toMins(form.timeOut || '00:00');
    if (outMins <= inMins) setField('timeOut', fromMins(inMins + 60));
  };

  const toggleArea = (area: string) => {
    markDirty();
    setForm(prev => {
      if (!prev) return prev;
      const areas = prev.areasInspected.includes(area)
        ? prev.areasInspected.filter(a => a !== area)
        : [...prev.areasInspected, area];
      return { ...prev, areasInspected: areas };
    });
  };

  const handleViolationChange = (id: string, field: keyof Violation, value: string | string[]) => {
    markDirty();
    setForm(prev => prev ? {
      ...prev, violations: prev.violations.map(v => v.id === id ? { ...v, [field]: value } : v),
    } : prev);
  };

  const handleViolationRemove = (id: string) => {
    markDirty();
    setForm(prev => prev ? { ...prev, violations: prev.violations.filter(v => v.id !== id) } : prev);
  };

  const handleAddViolation = () => {
    markDirty();
    setForm(prev => prev ? { ...prev, violations: [...prev.violations, newViolation()] } : prev);
  };

  const handleSave = async (isDraft: boolean) => {
    if (!form || !selectedComplaint) return;

    // Always block save if California state code references are present
    const summaryErr = form.summary ? getFieldValidationError(form.summary) : undefined;
    const hearingErr = form.hearingNotes ? getFieldValidationError(form.hearingNotes) : undefined;
    if (summaryErr || hearingErr) {
      setTextErrors({ summary: summaryErr, hearingNotes: hearingErr });
      if (summaryErr) setOpenSections(prev => ({ ...prev, observations: true }));
      if (hearingErr) setOpenSections(prev => ({ ...prev, hearing: true }));
      toast.error('Remove California state code references before saving.');
      return;
    }

    const derivedRating = form.violations.filter(v => v.violationKey).length > 0
      ? 'Unsatisfactory'
      : 'Satisfactory';

    if (!isDraft) {
      const errors: { inspectionType?: string } = {};
      if (!form.inspectionType) errors.inspectionType = 'Inspection type is required';
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setOpenSections(prev => ({ ...prev, details: true }));
        toast.error('Please fill in all required fields before submitting.');
        return;
      }
    setFieldErrors({});

    saveMutation.mutate({
      isDraft,
      inspector: inspectorName,
      complaint_id: selectedComplaint.id,
      location_id: selectedComplaint.location,
      inspection_date: form.inspectionDate,
      time_in: form.timeIn,
      time_out: form.timeOut,
      inspection_type: form.inspectionType,
      inspection_rating: derivedRating,
      summary: form.summary,
      global_observations: form.globalObservations ?? [],
      areas_inspected: form.areasInspected,
      status: isDraft ? 'Draft' : 'Submitted',
      violations: form.violations.filter(v => v.violationKey).map(v => ({
        violation_label: v.violationKey.split('||')[1] || v.violationKey,
        location_in_property: v.location,
        corrective_action: v.correctiveAction,
        responsible_party: v.responsibleParty as 'Owner' | 'Tenant',
        due_date: v.due_date,
        status: v.status as 'Violation' | 'Abated' | 'Corrected on Site',
      })),
    });
  };

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => window.print(), 300);
  };

  const fillInspectionDemoData = () => {
    if (!form) return;
    const demo = generateInspectionDemoData(form.inspectionDate);
    setForm(prev => prev ? { ...prev, ...demo } : prev);
    toast.success('Demo inspection data filled in.');
  };

  // ── Print view ────────────────────────────────────────────────────────────
  if (showPrint && form && selectedComplaint) {
    const printProps = buildPrintProps(form, selectedComplaint, inspectorName, photos);
    return (
      <div>
        <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <button onClick={() => setShowPrint(false)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
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

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted && selectedComplaint) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Inspection Saved</h2>
        <p className="text-muted-foreground mb-1">{selectedComplaint.address}</p>
        <p className="text-sm text-muted-foreground mb-8">
          {form?.violations.filter(v => v.violationKey).length ?? 0} violation(s) recorded
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button onClick={() => navigate('/inspections/new')}>
            Start New Inspection
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading skeleton (fetching complaint from URL param) ──────────────────
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

  // ── Complaint picker ──────────────────────────────────────────────────────
  if (!selectedComplaint || !form) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Inspection Form</h1>
        <p className="text-muted-foreground text-sm mb-6">Select a complaint to begin the inspection.</p>
        <AssignedComplaintsPanel inspector={inspectorName} onSelectComplaint={handleSelectComplaint} />
      </div>
    );
  }

  const violationCount = form.violations.filter(v => v.violationKey).length;
  const derivedRating = violationCount > 0 ? 'Unsatisfactory' : 'Satisfactory';

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => {
            if (isDirty) { setShowChangeComplaintDialog(true); }
            else { navigate('/inspections/new'); }
          }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Change complaint
          </button>
          <h1 className="text-xl font-bold text-foreground">{selectedComplaint.address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[selectedComplaint.complaintId && `#${selectedComplaint.complaintId}`].filter(Boolean).join(' · ')}
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
              {draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            onClick={fillInspectionDemoData}
            title="Fill inspection fields with realistic demo data"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fill Demo Data</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
            onClick={() => {
              const allOpen = Object.values(openSections).every(Boolean);
              setOpenSections({ details: !allOpen, areas: !allOpen, violations: !allOpen, observations: !allOpen, photos: !allOpen, hearing: !allOpen });
            }}
          >
            {Object.values(openSections).every(Boolean) ? 'Collapse All' : 'Expand All'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Desktop: Inspection Details + Areas Inspected side-by-side */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
      <CollapsibleSection title="Inspection Details" open={openSections.details} onToggle={() => toggleSection('details')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inspection Date</label>
            <Input type="date" value={form.inspectionDate} onChange={e => setField('inspectionDate', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inspection Type <span className="text-destructive">*</span>
            </label>
            <Select value={form.inspectionType} onValueChange={v => { setField('inspectionType', v); setFieldErrors(prev => ({ ...prev, inspectionType: undefined })); }}>
              <SelectTrigger className={`h-9 text-sm ${fieldErrors.inspectionType ? 'border-destructive' : ''}`}><SelectValue placeholder="Select type..." /></SelectTrigger>
              <SelectContent>{INSPECTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            {fieldErrors.inspectionType && <p className="text-xs text-destructive">{fieldErrors.inspectionType}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time In</label>
            <Input type="time" value={form.timeIn} onChange={e => handleTimeInChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time Out</label>
            <Input type="time" value={form.timeOut} onChange={e => setField('timeOut', e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inspection Rating</label>
            <div className="flex items-center gap-2 pt-0.5">
              {derivedRating === 'Satisfactory' ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success bg-success/10 border border-success/30 px-3 py-1.5 rounded-md">
                  <CheckCircle2 className="w-4 h-4" /> Satisfactory
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/30 px-3 py-1.5 rounded-md">
                  <XCircle className="w-4 h-4" /> Unsatisfactory
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                {derivedRating === 'Satisfactory'
                  ? 'No violations recorded'
                  : `${violationCount} violation${violationCount !== 1 ? 's' : ''} recorded`}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Areas Inspected" open={openSections.areas} onToggle={() => toggleSection('areas')}>
        <div className="flex flex-wrap gap-2">
          {AREAS.map(area => {
            const active = form.areasInspected.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all select-none ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
      </div>

      <CollapsibleSection title={`Violations${violationCount > 0 ? ` (${violationCount})` : ''}`} open={openSections.violations} onToggle={() => toggleSection('violations')}>
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            {sortedChipKeys.map(key => {
              const alreadyAdded = form.violations.some(v => v.violationKey === key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => {
                    const vType = VIOLATION_TYPES.find(v => `${v.category}||${v.label}` === key);
                    if (!vType) return;
                    setForm(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        violations: [...prev.violations, {
                          id: crypto.randomUUID(),
                          violationKey: key,
                          location: '',
                          correctiveAction: !vType.correctiveActions ? vType.defaultCorrectiveAction : '',
                          dueDate: calcDueDate(prev.inspectionDate, vType),
                          responsibleParty: 'Owner',
                          status: 'Violation',
                          ownerActions: !vType.correctiveActions ? [vType.defaultCorrectiveAction] : [],
                          tenantActions: [],
                          selectedObservations: [],
                        }],
                      };
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    alreadyAdded
                      ? 'bg-primary/10 text-primary border-primary/30 opacity-60 cursor-not-allowed'
                      : 'bg-card border-border text-foreground hover:bg-muted hover:border-border/80'
                  }`}
                >
                  + {COMMON_VIOLATION_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>

        {form.violations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No violations added yet. Use quick-add above or the button below.</p>
        ) : (
          <div className="space-y-3">
            {form.violations.map((v, i) => (
              <ViolationRow key={v.id} violation={v} index={i} inspectionDate={form.inspectionDate}
                onChange={handleViolationChange} onRemove={handleViolationRemove}
                expandOwnerTrigger={i === 0 ? panelExpandTrigger.owner : undefined}
                expandTenantTrigger={i === 0 ? panelExpandTrigger.tenant : undefined}
              />
            ))}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={handleAddViolation}>
          <Plus className="w-4 h-4" /> Add Violation
        </Button>
      </CollapsibleSection>

      <CollapsibleSection title="Observations & Summary" open={openSections.observations} onToggle={() => toggleSection('observations')}>
        <div className="space-y-5">

        {/* ── Global Observations ─────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Global Observations
          </label>
          <p className="text-xs text-muted-foreground -mt-1">
            Notes that apply to the whole inspection — not tied to a specific violation.
          </p>
          {(form.globalObservations ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(form.globalObservations ?? []).map((obs, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground border border-dashed border-border"
                >
                  {obs}
                  <button
                    type="button"
                    onClick={() => setField('globalObservations', (form.globalObservations ?? []).filter((_, idx) => idx !== i))}
                    className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors flex items-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a global observation…"
              value={globalObsInput}
              onChange={e => setGlobalObsInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGlobalObs(); } }}
              className="h-9 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGlobalObs}
              disabled={!globalObsInput.trim()}
              className="shrink-0 gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </div>

        {/* ── Summary / Narrative ──────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Summary / Observations
          </label>
          <Textarea
            placeholder="Describe the overall condition of the property and key findings from this inspection..."
            value={form.summary}
            onChange={e => {
              const val = e.target.value;
              setField('summary', val);
              setTextErrors(prev => ({ ...prev, summary: getFieldValidationError(val) }));
            }}
            className={`min-h-[120px] resize-none text-sm ${textErrors.summary ? 'border-destructive' : ''}`}
          />
          {textErrors.summary && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {textErrors.summary}
            </p>
          )}
        </div>

        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Photos" icon={<Camera className="w-4 h-4" />} open={openSections.photos} onToggle={() => toggleSection('photos')}>
        <PhotoUploadSection
          complaintId={form.complaintId}
          inspector={inspectorName}
          photos={photos}
          onPhotosChange={setPhotos}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Hearing Preparation" open={openSections.hearing} onToggle={() => toggleSection('hearing')}>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
            <Checkbox checked={form.hearingReferral} onCheckedChange={v => setField('hearingReferral', !!v)} />
            Refer to Director's Hearing
          </label>
          {form.hearingReferral && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hearing Notes</label>
              <Textarea
                placeholder="Notes for the hearing packet..."
                value={form.hearingNotes}
                onChange={e => {
                  const val = e.target.value;
                  setField('hearingNotes', val);
                  setTextErrors(prev => ({ ...prev, hearingNotes: getFieldValidationError(val) }));
                }}
                className={`min-h-[80px] resize-none text-sm ${textErrors.hearingNotes ? 'border-destructive' : ''}`}
              />
              {textErrors.hearingNotes && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {textErrors.hearingNotes}
                </p>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Change complaint confirmation */}
      <AlertDialog open={showChangeComplaintDialog} onOpenChange={setShowChangeComplaintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Switch complaint?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this inspection. Your draft is saved automatically, but switching complaints will clear the current form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowChangeComplaintDialog(false);
              setIsDirty(false);
              navigate('/inspections/new');
            }}>
              Switch anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-10">
        <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto"
          onClick={() => handleSave(true)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Draft
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="lg" className="gap-2 flex-1 sm:flex-none" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button size="lg" className="gap-2 flex-1 sm:flex-none" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
