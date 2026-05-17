import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packetService } from "@/services/packetService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  AlertTriangle,
  Printer,
  Gavel,
  Paperclip,
  ListChecks,
  DollarSign,
  BookOpen,
  Send,
  RotateCcw,
  History,
  AlertCircle,
  ChevronDown,
  ChevronUp as ChevronUpIcon,
  Download,
  FileDown,
} from "lucide-react";
import { PacketDownloadLink } from "@/components/packet/PacketPdfDocument";
import { PdfViewerModal } from "@/components/packet/PdfViewerModal";
import {
  differenceInDays,
  parseISO,
  subDays,
  format,
  startOfMonth,
  getDay,
  addDays,
} from "date-fns";
import { toast } from "sonner";

import AttachmentsEvidenceTab from "@/components/AttachmentsEvidenceTab";
import ChronologyEditorTab from "@/components/ChronologyEditorTab";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToExcel } from "@/utils/exportExcel";
import { elementToPdf } from "@/utils/pdfExport";

const HearingPacketPreview = lazy(
  () => import("@/components/HearingPacketPreview"),
);
const HearingOrderEditor = lazy(
  () => import("@/components/HearingOrderEditor"),
);
const PacketNoticeOfHearing = lazy(() =>
  import("@/components/packet/PacketNoticeOfHearing").then((m) => ({
    default: m.PacketNoticeOfHearing,
  })),
);

type Packet = any; // Properly type later

interface StatusHistoryEntry {
  timestamp: string;
  userName: string;
  fromStatus: string;
  toStatus: string;
  action: string;
  notes?: string;
}

function parseStatusHistory(raw: string | undefined): StatusHistoryEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StatusHistoryEntry[];
  } catch {
    return [];
  }
}

function fmtAuditTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const ACTION_LABEL: Record<string, string> = {
  sent_to_review: "sent to review",
  returned_for_revision: "returned for revision",
  marked_complete: "marked complete",
  submitted: "submitted",
  in_progress: "set in progress",
  status_change: "status changed",
};

const MANAGER_ROLES = ["Program Manager", "Admin", "Super Admin"];

const PACKET_STATUSES = [
  "Not Started",
  "In Progress",
  "Under Review",
  "Complete",
  "Submitted",
];
const PROGRAM_CODES = ["HHV", "HHP", "VEC", "ENV"];
const PROPOSED_ACTION_OPTIONS = [
  { label: "Declare Nuisance", value: "declare_nuisance" },
  { label: "Assess Fines", value: "assess_fines" },
  { label: "Permit Suspension", value: "permit_suspension" },
  { label: "Permit Revocation", value: "permit_revocation" },
  { label: "Other", value: "other" },
];

const STATUS_BADGE: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  "Under Review": "bg-warning/10 text-warning",
  Complete: "bg-success/10 text-success",
  Submitted: "bg-primary/10 text-primary",
};

interface EnforcementFlags {
  nuisanceAbatement: boolean;
  costRecovery: boolean;
  appealHealthPermit: boolean;
  appealNonPermitted: boolean;
}

type ChecklistCompletion = Record<number, boolean>;

// Find the first Wednesday of the current month (based on today)
function getFirstWednesdayOfCurrentMonth(): Date {
  const today = new Date();
  const first = startOfMonth(today);
  // Wednesday = 3
  const dayOfWeek = getDay(first);
  const daysUntilWed = (3 - dayOfWeek + 7) % 7;
  return addDays(first, daysUntilWed);
}

function PreparationChecklist({
  hearingDate,
  completion,
  onToggle,
}: {
  hearingDate?: string;
  completion: ChecklistCompletion;
  onToggle: (id: number) => void;
}) {
  const today = new Date();
  const hDate = hearingDate ? parseISO(hearingDate + "T00:00:00") : null;
  const firstWed = getFirstWednesdayOfCurrentMonth();

  const milestones = hDate
    ? [
        {
          id: 0,
          label: "Post Notice of Hearing",
          detail: "14 calendar days before hearing",
          deadline: subDays(hDate, 14),
        },
        {
          id: 1,
          label: "Mail & email Notice + NOV to all parties",
          detail: "14 days — regular + certified mail required",
          deadline: subDays(hDate, 14),
        },
        {
          id: 2,
          label: "Senior staff review (1st Wednesday of month)",
          detail: format(firstWed, "MMM d"),
          deadline: firstWed,
        },
        {
          id: 3,
          label: "Mail signed packet to all parties",
          detail: "5 days before hearing",
          deadline: subDays(hDate, 5),
        },
        {
          id: 4,
          label: "Email packet to hearing coordinator",
          detail: "5 days before hearing",
          deadline: subDays(hDate, 5),
        },
        {
          id: 5,
          label: "Submit final re-inspection report",
          detail: "24 hours before hearing",
          deadline: subDays(hDate, 1),
        },
      ]
    : [];

  const completed = milestones.filter((m) => completion[m.id]).length;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Preparation Checklist
          </h3>
        </div>
        {hDate && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {completed} of {milestones.length} complete
          </span>
        )}
      </div>

      {!hDate ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          Set a hearing date to see SOP deadline milestones.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {milestones.map((m) => {
            const isDone = !!completion[m.id];
            const daysUntil = differenceInDays(m.deadline, today);
            const isOverdue = daysUntil < 0 && !isDone;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(m.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${isOverdue ? "bg-destructive/5" : ""}`}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {m.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Due {format(m.deadline, "MMM d")} — {m.detail}
                    {isOverdue
                      ? ` — ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue`
                      : ""}
                  </p>
                </div>
                {isDone && (
                  <span className="text-xs text-primary font-medium flex-shrink-0">
                    ✓ Done
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NoticeOfHearingPrint({
  data,
  onClose,
}: {
  data: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #noh-print, #noh-print * { visibility: visible; }
          #noh-print { position: fixed; top: 0; left: 0; width: 100%; }
          .print-toolbar { display: none !important; }
          .print-page-break { page-break-after: always; break-after: page; }
          .packet-page { padding: 0.75in; min-height: 10.5in; box-sizing: border-box; }
        }
        @media screen {
          .packet-page { width: 8.5in; min-height: 11in; padding: 0.75in; background: white; margin: 0 auto 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); box-sizing: border-box; }
        }
      `}</style>
      <div className="print-toolbar sticky top-0 z-10 bg-card border-b border-border shadow-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Back
          </button>
          <h2 className="text-sm font-bold text-foreground">
            Notice of Hearing — Standalone Print
          </h2>
        </div>
        <Button size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() =>
            elementToPdf("noh-print", `notice-of-hearing-${Date.now()}`)
          }
        >
          <FileDown className="w-4 h-4" /> Download PDF
        </Button>
      </div>
      <div className="py-8 px-4" id="noh-print">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading Notice of Hearing…</span>
            </div>
          }
        >
          <PacketNoticeOfHearing
            packet={data.packet}
            complaint={data.complaint}
            location={data.location}
            inspector={data.inspector}
            inspections={data.inspections}
          />
        </Suspense>
      </div>
    </div>
  );
}

function PacketDetail({
  packetId,
  onClose,
  userRole,
}: {
  packetId: string;
  onClose: () => void;
  userRole?: string;
}) {
  const queryClient = useQueryClient();
  const {
    data: detail,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["packet", packetId],
    queryFn: () => packetService.getById(packetId),
  });

  const packet = detail?.packet;
  const ensureLoaded = async () => {
    await refetch();
  };

  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [hearingTime, setHearingTime] = useState("");
  const [hearingLocation, setHearingLocation] = useState("");
  const [proposedActions, setProposedActions] = useState<string[]>([]);
  const [adminFee, setAdminFee] = useState("");
  const [enforcementFlags, setEnforcementFlags] = useState<EnforcementFlags>({
    nuisanceAbatement: false,
    costRecovery: false,
    appealHealthPermit: false,
    appealNonPermitted: false,
  });
  const [checklistCompletion, setChecklistCompletion] =
    useState<ChecklistCompletion>({});

  useEffect(() => {
    if (packet) {
      setStatus(packet.packet_status ?? "Not Started");
      setNotes(packet.notes ?? "");
      setCaseNumber(packet.case_number ?? "");
      setProgramCode(packet.program_code ?? "");
      setHearingTime(packet.hearing_time ?? "");
      setHearingLocation(packet.hearing_location ?? "");
      setProposedActions((packet as any).proposed_actions ?? []);
      setAdminFee(packet.admin_fee ?? "");
      if (packet.enforcement_flags) {
        try {
          setEnforcementFlags(JSON.parse(packet.enforcement_flags));
        } catch {
          /* ignore */
        }
      }
      if (packet.checklist_data) {
        try {
          setChecklistCompletion(JSON.parse(packet.checklist_data));
        } catch {
          /* ignore */
        }
      }
    }
  }, [packet]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => packetService.update(packetId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packet", packetId] });
      queryClient.invalidateQueries({ queryKey: ["packets"] });
      toast.success("Packet updated");
    },
    onError: () => {
      toast.error("Failed to update packet");
    },
  });

  const [saving, _setSaving] = useState(false);
  const [sendingToReview, _setSendingToReview] = useState(false);
  const [compilationStage, _setCompilationStage] = useState<string | null>(
    null,
  );
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");
  const [returningForRevision, _setReturningForRevision] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isManagerRole = userRole ? MANAGER_ROLES.includes(userRole) : false;
  const hasRevisionNotes = !!(
    packet?.revision_notes && packet.revision_notes.trim()
  );
  const [showFullPacket, setShowFullPacket] = useState(false);
  const [showNOH, setShowNOH] = useState(false);
  const [activeTab, setActiveTab] = useState("packet");

  const toggleAction = (val: string) => {
    setProposedActions((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val],
    );
  };

  const toggleEnforcementFlag = (key: keyof EnforcementFlags) => {
    setEnforcementFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleChecklistToggle = useCallback(
    async (milestoneId: number) => {
      const newCompletion = {
        ...checklistCompletion,
        [milestoneId]: !checklistCompletion[milestoneId],
      };
      setChecklistCompletion(newCompletion);
      updateMutation.mutate({ checklist_data: JSON.stringify(newCompletion) });
    },
    [checklistCompletion, updateMutation],
  );

  const handleSave = async () => {
    updateMutation.mutate({
      packet_status: status,
      notes,
      case_number: caseNumber,
      program_code: programCode || null,
      proposed_actions: proposedActions,
      hearing_time: hearingTime,
      hearing_location: hearingLocation,
      admin_fee: adminFee,
      enforcement_flags: JSON.stringify(enforcementFlags),
    });
  };

  const handleSendToReview = async () => {
    updateMutation.mutate({ packet_status: "Under Review" });
  };

  const handleReturnForRevision = async () => {
    if (!returnNotes.trim()) return;
    updateMutation.mutate({
      packet_status: "In Progress",
      revision_notes: returnNotes.trim(),
    });
    setShowReturnForm(false);
    setReturnNotes("");
  };

  // Compilation stage handler for Full Packet
  const handleShowFullPacketWithStages = async () => {
    if (detail) {
      setShowFullPacket(true);
    }
  };

  const handleShowNOH = () => {
    if (detail) setShowNOH(true);
  };

  const cachedData = detail;
  const verificationDate = cachedData?.location?.verification_date;
  const verificationDaysAgo = verificationDate
    ? differenceInDays(new Date(), parseISO(verificationDate))
    : null;
  const showVerificationWarning =
    (status === "Complete" || status === "Submitted") &&
    cachedData &&
    (verificationDaysAgo === null || verificationDaysAgo > 90);
  const isComplete = status === "Complete" || status === "Submitted";
  const badgeCls = STATUS_BADGE[status] ?? "bg-muted text-muted-foreground";

  if (showFullPacket && cachedData) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading packet preview…</span>
          </div>
        }
      >
        <HearingPacketPreview
          data={cachedData}
          onClose={() => setShowFullPacket(false)}
        />
      </Suspense>
    );
  }
  if (showNOH && cachedData) {
    return (
      <NoticeOfHearingPrint
        data={cachedData}
        onClose={() => setShowNOH(false)}
      />
    );
  }

  if (loading || !detail) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!packet) return null;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold text-foreground truncate">
            Hearing Packet
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeCls}`}
          >
            {status}
          </span>
          {cachedData && (
            <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline">
              ● Loaded
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0 p-1 hover:bg-muted rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Case summary */}
      <div className="px-5 pt-4 pb-2">
        <div className="bg-muted/40 rounded-lg p-3 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              {(packet as any).complaint?.complaintid && (
                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-2">
                  #{(packet as any).complaint?.complaintid}
                </span>
              )}
              <p className="text-sm font-semibold text-foreground mt-1">
                {(packet as any).complaint?.address ?? "—"}
              </p>
              {packet.hearing_date && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Hearing:{" "}
                  {new Date(
                    packet.hearing_date + "T00:00:00",
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
            {(packet as any).complaint?.hearing_status &&
              (packet as any).complaint?.hearing_status !== "None" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground font-medium whitespace-nowrap">
                  ⚖ {(packet as any).complaint?.hearing_status}
                </span>
              )}
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleShowFullPacketWithStages}
            variant="outline"
            className="flex-1 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5 h-8 min-w-0"
            disabled={loading || !!compilationStage}
          >
            {loading || compilationStage ? (
              <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
            ) : (
              <FileText className="w-3 h-3 flex-shrink-0" />
            )}
            <span className="truncate">
              {compilationStage ?? "Full Packet"}
            </span>
          </Button>
          <Button
            onClick={handleShowNOH}
            variant="outline"
            className="flex-1 gap-1.5 text-xs h-8"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Printer className="w-3 h-3" />
            )}
            Notice of Hearing
          </Button>
          {isComplete && (
            <Button
              onClick={() => handleTabChange("order")}
              variant="outline"
              className="flex-1 gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/5 h-8"
            >
              <Gavel className="w-3 h-3" /> Hearing Order
            </Button>
          )}
        </div>

        {/* Send to Review — prominent one-click action (Inspector / any non-manager role) */}
        {status !== "Under Review" &&
          status !== "Complete" &&
          status !== "Submitted" &&
          !isManagerRole && (
            <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 mb-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-none">
                  Ready for supervisor review?
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                  Sets status to "Under Review"
                </p>
              </div>
              <Button
                onClick={handleSendToReview}
                disabled={sendingToReview}
                size="sm"
                className="shrink-0 gap-1.5 text-xs h-8 px-3"
              >
                {sendingToReview ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Send to Review
              </Button>
            </div>
          )}

        {/* Return for Revision — PM / Super Admin only, when packet is Under Review */}
        {isManagerRole && status === "Under Review" && (
          <div className="rounded-lg border border-border bg-card mb-1 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowReturnForm((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  Return for Revision
                </span>
              </div>
              {showReturnForm ? (
                <ChevronUpIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </button>
            {showReturnForm && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-border pt-2.5">
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Describe what needs to be corrected — reference specific chronology entries or exhibits…"
                  rows={3}
                  className="text-xs resize-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowReturnForm(false);
                      setReturnNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={handleReturnForRevision}
                    disabled={returningForRevision || !returnNotes.trim()}
                  >
                    {returningForRevision ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    Return to Inspector
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-10 px-4 justify-start gap-0.5 overflow-x-auto scrollbar-none">
          <TabsTrigger
            value="packet"
            className="text-xs h-7 rounded-md px-3 shrink-0"
          >
            Packet Details
          </TabsTrigger>
          <TabsTrigger
            value="notice"
            className="text-xs h-7 rounded-md px-3 shrink-0"
          >
            Notice
          </TabsTrigger>
          <TabsTrigger
            value="chrono"
            className="text-xs h-7 rounded-md px-3 shrink-0 flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" /> Chronology
          </TabsTrigger>
          <TabsTrigger
            value="evidence"
            className="text-xs h-7 rounded-md px-3 shrink-0 flex items-center gap-1"
          >
            <Paperclip className="w-3 h-3" /> Attachments
          </TabsTrigger>
          {isComplete && (
            <TabsTrigger
              value="order"
              className="text-xs h-7 rounded-md px-3 shrink-0 flex items-center gap-1"
            >
              <Gavel className="w-3 h-3" /> Hearing Order
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent
          value="packet"
          className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] mt-0"
        >
          {/* Revision notes banner — shown when packet was returned for revision */}
          {status === "In Progress" && hasRevisionNotes && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 flex gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground leading-none mb-1">
                  Revision requested
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {packet.revision_notes}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Case Number
              </Label>
              <Input
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g. HHP-26-08"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Program Code
              </Label>
              <Select
                value={programCode || "none"}
                onValueChange={(v) => setProgramCode(v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {PROGRAM_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Hearing Date
              </Label>
              <p className="text-sm font-medium text-foreground py-1">
                {packet.hearing_date
                  ? new Date(
                      packet.hearing_date + "T00:00:00",
                    ).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Hearing Time
              </Label>
              <Input
                value={hearingTime}
                onChange={(e) => setHearingTime(e.target.value)}
                placeholder="e.g. 1:00 PM"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
              Hearing Location
            </Label>
            <Input
              value={hearingLocation}
              onChange={(e) => setHearingLocation(e.target.value)}
              placeholder="49 So. Van Ness Ave., Rm. 192/194"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Proposed Enforcement Actions
            </Label>
            <div className="space-y-2">
              {PROPOSED_ACTION_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={opt.value}
                    checked={proposedActions.includes(opt.value)}
                    onCheckedChange={() => toggleAction(opt.value)}
                  />
                  <Label
                    htmlFor={opt.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Fee */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Admin Fee (Hearing Order
              Proposal)
            </Label>
            <Input
              value={adminFee}
              onChange={(e) => setAdminFee(e.target.value)}
              placeholder="e.g. $500 per week"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Appears in item 5 of the Hearing Order Proposal on the Chronology
              page
            </p>
          </div>

          {/* Legal Language Flags */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Legal Language Checkboxes (Enforcement Summary)
            </Label>
            <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
              {[
                {
                  key: "nuisanceAbatement" as const,
                  label: "Nuisance Abatement",
                },
                { key: "costRecovery" as const, label: "Cost Recovery" },
                {
                  key: "appealHealthPermit" as const,
                  label: "Appeal Process (Health Permit)",
                },
                {
                  key: "appealNonPermitted" as const,
                  label: "Appeal Process (Non-permitted / Penalty)",
                },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`flag-${key}`}
                    checked={enforcementFlags[key]}
                    onCheckedChange={() => toggleEnforcementFlag(key)}
                  />
                  <Label
                    htmlFor={`flag-${key}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Controls which legal language blocks appear checked in the
              Enforcement Summary
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Packet Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PACKET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Reviewer Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes, approval comments, or return instructions..."
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          {showVerificationWarning && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-xs text-warning">
                <p className="font-semibold">Owner info may be outdated</p>
                <p className="mt-0.5">
                  {verificationDaysAgo === null
                    ? "Owner info has never been verified for this location."
                    : `Owner info was last verified ${verificationDaysAgo} days ago.`}{" "}
                  Confirm contact details before finalizing.
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Save Changes
          </Button>

          {/* Preparation Checklist */}
          <div>
            <PreparationChecklist
              hearingDate={packet.hearing_date}
              completion={checklistCompletion}
              onToggle={handleChecklistToggle}
            />
          </div>

          {/* Status History — immutable audit trail, visible to all roles */}
          {(() => {
            const history = parseStatusHistory(packet.status_history).reverse();
            return (
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Status History
                    </span>
                    {history.length > 0 && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {history.length} event{history.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {historyOpen ? (
                    <ChevronUpIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                {historyOpen &&
                  (history.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-muted-foreground text-center italic">
                      No status changes recorded yet
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {history.map((entry, i) => (
                        <div
                          key={i}
                          className="px-4 py-3 flex items-start gap-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">
                              <span className="font-medium">
                                {entry.userName}
                              </span>{" "}
                              {ACTION_LABEL[entry.action] ?? entry.action}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {entry.fromStatus} → {entry.toStatus} ·{" "}
                              {fmtAuditTime(entry.timestamp)}
                            </p>
                            {entry.notes && (
                              <p className="text-[10px] text-muted-foreground mt-1 italic leading-relaxed">
                                "{entry.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="notice" className="p-5 mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading packet
              data...
            </div>
          ) : !cachedData ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground mb-3">
                Load the packet to preview the Notice of Hearing.
              </p>
              <Button size="sm" variant="outline" onClick={handleShowNOH}>
                Load &amp; Preview
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground border border-border">
                <p className="font-medium text-foreground mb-1">
                  Notice of Hearing
                </p>
                <p className="text-xs">
                  Generated from complaint and location data. Opens as a
                  standalone printable document.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">To:</span>{" "}
                    {cachedData.complaint?.hearingRpName ||
                      cachedData.location?.owner_name ||
                      "—"}
                  </div>
                  <div>
                    <span className="font-medium">Re:</span>{" "}
                    {cachedData.complaint?.address ||
                      cachedData.location?.address ||
                      "—"}
                  </div>
                  <div>
                    <span className="font-medium">Hearing:</span>{" "}
                    {packet.hearing_date
                      ? new Date(
                          packet.hearing_date + "T00:00:00",
                        ).toLocaleDateString()
                      : "—"}
                  </div>
                  <div>
                    <span className="font-medium">Inspector:</span>{" "}
                    {(cachedData as any).inspector?.name || "—"}
                  </div>
                </div>
              </div>
              <Button onClick={handleShowNOH} className="w-full gap-2">
                <Printer className="w-4 h-4" /> Open Standalone Notice of
                Hearing
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chrono" className="mt-0">
          <ChronologyEditorTab packetId={packet.id} />
        </TabsContent>

        <TabsContent value="evidence" className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading packet
              data...
            </div>
          ) : !cachedData ? (
            <div className="text-center py-12 px-5">
              <Paperclip className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground mb-3">
                Load the packet to manage attachments and evidence.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await ensureLoaded();
                }}
              >
                Load Packet Data
              </Button>
            </div>
          ) : (
            <AttachmentsEvidenceTab packetId={packet.id} data={cachedData} />
          )}
        </TabsContent>

        {/* ── Hearing Order tab (Complete/Submitted only) ── */}
        {isComplete && (
          <TabsContent
            value="order"
            className="p-5 mt-0 overflow-y-auto max-h-[calc(100vh-320px)]"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading packet
                data...
              </div>
            ) : !cachedData ? (
              <div className="text-center py-12">
                <Gavel className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground mb-3">
                  Load the packet to access the Hearing Order editor.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await ensureLoaded();
                  }}
                >
                  Load Packet Data
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <Gavel className="w-4 h-4 text-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Director's Hearing Order
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enter hearing officer determinations. Save to preserve,
                      then print.
                    </p>
                  </div>
                </div>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        Loading Hearing Order editor…
                      </span>
                    </div>
                  }
                >
                  <HearingOrderEditor
                    packet={cachedData.packet}
                    complaint={cachedData.complaint}
                    location={cachedData.location}
                    inspections={cachedData.inspections}
                  />
                </Suspense>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface HearingPacketsPageProps {
  userScopedFilter?: boolean;
  inspectorName?: string;
  baseRoute?: string;
}

export default function HearingPacketsPage({
  userScopedFilter = false,
  inspectorName,
  baseRoute = "/enforcement/hearings",
}: HearingPacketsPageProps = {}) {
  const { id: urlPacketId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserRole = user?.role;

  const [statusFilter, setStatusFilter] = useState("");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const {
    data: packets = [],
    isLoading: loading,
    refetch: fetchPackets,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["packets", statusFilter, userScopedFilter, inspectorName],
    queryFn: () =>
      packetService.getAll({
        statusFilter: statusFilter || undefined,
        assignedToFilter:
          userScopedFilter && inspectorName ? inspectorName : undefined,
      }),
    enabled: !!user,
  });

  const selected = useMemo(() => {
    if (!urlPacketId) return null;
    return packets.find((p: any) => p.id === urlPacketId) || null;
  }, [urlPacketId, packets]);

  const handleSelectPacket = (pkt: Packet | null) => {
    if (pkt) {
      navigate(`${baseRoute}/${pkt.id}`, { replace: true });
    } else {
      navigate(baseRoute, { replace: true });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Hearing Packets</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {packets.length} packet{packets.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PACKET_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPackets()}
            disabled={refreshing || loading}
            className="gap-1.5 h-8"
          >
            {refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () =>
              await exportToExcel(
                packets,
                [
                  { key: "id", header: "Packet ID" },
                  { key: "complaintid", header: "Complaint ID" },
                  { key: "address", header: "Address" },
                  { key: "status", header: "Status" },
                  { key: "hearing_date", header: "Hearing Date" },
                  { key: "assigned_to", header: "Assigned To" },
                ],
                { fileName: "hearing-packets" },
              )
            }
            disabled={loading}
            className="gap-1.5 h-8"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div className="col-span-2">Hearing Date</div>
            <div className="col-span-2">Case #</div>
            <div className="col-span-4">Address</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2"></div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3.5">
                <div className="md:hidden space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="hidden md:grid grid-cols-12 items-center gap-1">
                  <div className="col-span-2">
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <div className="col-span-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : packets.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hearing packets found</p>
          <p className="text-sm mt-1">
            Packets are created when complaints are escalated to hearing.
          </p>
        </div>
      ) : (
        <div className={`flex gap-6 ${selected ? "flex-col xl:flex-row" : ""}`}>
          <div className={`${selected ? "xl:w-1/2" : "w-full"} min-w-0`}>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="hidden md:grid grid-cols-12 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2">Hearing Date</div>
                <div className="col-span-2">Case #</div>
                <div className="col-span-4">Address</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2"></div>
              </div>
              <div className="divide-y divide-border">
                {packets.map((pkt: any) => {
                  const badgeCls =
                    STATUS_BADGE[pkt.packet_status ?? ""] ??
                    "bg-muted text-muted-foreground";
                  const isComplete =
                    pkt.packet_status === "Complete" ||
                    pkt.packet_status === "Submitted";
                  return (
                    <button
                      key={pkt.id}
                      type="button"
                      onClick={() =>
                        handleSelectPacket(selected?.id === pkt.id ? null : pkt)
                      }
                      className={`w-full text-left hover:bg-muted/40 transition-colors ${selected?.id === pkt.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                    >
                      <div className="md:hidden px-4 py-3.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {pkt.address ?? "—"}
                            </p>
                            {pkt.complaintid && (
                              <p className="text-xs text-muted-foreground font-mono">
                                #{pkt.complaintid}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${badgeCls}`}
                          >
                            {pkt.packet_status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pkt.hearing_date
                            ? new Date(
                                pkt.hearing_date + "T00:00:00",
                              ).toLocaleDateString()
                            : "No date"}
                        </p>
                      </div>
                      <div className="hidden md:grid grid-cols-12 px-4 py-3 items-center gap-1">
                        <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pkt.hearing_date
                            ? new Date(
                                pkt.hearing_date + "T00:00:00",
                              ).toLocaleDateString()
                            : "—"}
                        </div>
                        <div className="col-span-2 text-xs font-mono text-foreground truncate">
                          {pkt.case_number ?? "—"}
                        </div>
                        <div className="col-span-4">
                          <p className="text-sm font-medium truncate">
                            {pkt.address ?? "—"}
                          </p>
                          {pkt.complaintid && (
                            <p className="text-xs text-muted-foreground font-mono">
                              #{pkt.complaintid}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeCls}`}
                          >
                            {pkt.packet_status ?? "—"}
                          </span>
                          {pkt.revision_notes &&
                            pkt.packet_status === "In Progress" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium hidden lg:inline">
                                ↩ Revision
                              </span>
                            )}
                          {isComplete && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium hidden lg:inline">
                              Order Ready
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View PDF"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfViewerUrl(`/api/packets/${pkt.id}/pdf`);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <PacketDownloadLink packet={pkt}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Download PDF"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileDown className="w-4 h-4" />
                            </Button>
                          </PacketDownloadLink>
                          <ChevronRight
                            className={`w-4 h-4 text-muted-foreground transition-transform ${selected?.id === pkt.id ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selected && (
            <div className="xl:w-1/2 min-w-0">
              <PacketDetail
                packetId={selected.id}
                onClose={() => handleSelectPacket(null)}
                userRole={currentUserRole}
              />
            </div>
          )}
        </div>
      )}

      {pdfViewerUrl && (
        <PdfViewerModal
          url={pdfViewerUrl}
          onClose={() => setPdfViewerUrl(null)}
        />
      )}
    </div>
  );
}
