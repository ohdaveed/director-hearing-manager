import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  PACKET_STATUSES,
  PacketStatus,
  PacketValidationResult,
  packetService,
} from "@/services/packetService";
import { usePacketForm } from "@/hooks/usePacketForm";
import { usePacketWorkflow } from "@/hooks/usePacketWorkflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import AttachmentsEvidenceTab from "@/components/AttachmentsEvidenceTab";
import ChronologyEditorTab from "@/components/ChronologyEditorTab";
import { NoticeOfHearingPrint } from "@/components/packet/NoticeOfHearingPrint";
import { PacketActivityPanel } from "@/components/packet/PacketActivityPanel";
import { PacketList } from "@/components/packet/PacketList";
import { PacketReadinessPanel } from "@/components/packet/PacketReadinessPanel";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  History,
  Loader2,
  Package,
  Paperclip,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

const HearingPacketPreview = lazy(
  () => import("@/components/HearingPacketPreview"),
);
const HearingOrderEditor = lazy(
  () => import("@/components/HearingOrderEditor"),
);

type Packet = import("@/types/packet").PacketSummary;

const MANAGER_ROLES = ["Program Manager", "Admin", "Super Admin"];
const PROGRAM_CODES = ["HHV", "HHP", "VEC", "ENV"];

const STATUS_BADGE: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  "Under Review": "bg-warning/10 text-warning",
  "Changes Requested": "bg-destructive/10 text-destructive",
  Approved: "bg-success/10 text-success",
  Complete: "bg-success/10 text-success",
  Submitted: "bg-primary/10 text-primary",
};

const PROPOSED_ACTION_OPTIONS = [
  { label: "Declare Nuisance", value: "declare_nuisance" },
  { label: "Assess Fines", value: "assess_fines" },
  { label: "Permit Suspension", value: "permit_suspension" },
  { label: "Permit Revocation", value: "permit_revocation" },
  { label: "Other", value: "other" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(
      value.includes("T") ? value : `${value}T00:00:00`,
    ).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function parseHistory(raw: unknown): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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
  const isManagerRole = userRole ? MANAGER_ROLES.includes(userRole) : false;

  const { data: detail, isLoading } = useQuery({
    queryKey: ["packet", packetId],
    queryFn: () => packetService.getById(packetId),
  });

  const { data: files = [] } = useQuery({
    queryKey: ["packet-files", packetId],
    queryFn: () => packetService.getPacketFiles(packetId),
    enabled: !!packetId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["packet-events", packetId],
    queryFn: () => packetService.getPacketEvents(packetId),
    enabled: !!packetId,
  });

  const packet = detail?.packet;
  const validationResults = (packet?.validation_results_json ??
    []) as PacketValidationResult[];
  const currentStatus = (packet?.packet_status ?? "Not Started") as PacketStatus;
  const {
    form,
    setField,
    toggleProposedAction,
    buildUpdatePayload,
    isDirty,
  } = usePacketForm(packet);
  const workflow = usePacketWorkflow({ packetId, currentStatus });

  const [returnNotes, setReturnNotes] = useState("");
  const [activeTab, setActiveTab] = useState("packet");
  const [showFullPacket, setShowFullPacket] = useState(false);
  const [showNOH, setShowNOH] = useState(false);

  const cachedData = detail;
  const isComplete = ["Approved", "Complete", "Submitted"].includes(form.status);
  const badgeCls = STATUS_BADGE[form.status] ?? "bg-muted text-muted-foreground";
  const history = parseHistory(
    packet?.status_history_json ?? packet?.status_history,
  ).reverse();
  const hasRevisionNotes = !!packet?.revision_notes?.trim();

  const handleSave = () => {
    workflow.savePacket(buildUpdatePayload());
  };

  const handleReturnForRevision = () => {
    if (!returnNotes.trim()) return;
    workflow.requestChanges(returnNotes);
    setReturnNotes("");
  };

  if (showFullPacket && cachedData) {
    return (
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground">
            Loading packet preview…
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
    return <NoticeOfHearingPrint data={cachedData} onClose={() => setShowNOH(false)} />;
  }

  if (isLoading || !detail || !packet) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold text-foreground truncate">
            Hearing Packet
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeCls}`}
          >
            {form.status}
          </span>
          {packet.generated_at && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full hidden sm:inline">
              Snapshot {formatDateTime(packet.generated_at)}
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

      <div className="px-5 pt-4 pb-2">
        <div className="bg-muted/40 rounded-lg p-3 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              {detail.complaint?.complaintid && (
                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-2">
                  #{detail.complaint.complaintid}
                </span>
              )}
              <p className="text-sm font-semibold text-foreground mt-1">
                {detail.complaint?.address ?? detail.location?.address ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Hearing: {formatDate(packet.hearing_date)}
              </p>
            </div>
            {detail.complaint?.hearing_status &&
              detail.complaint.hearing_status !== "None" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground font-medium whitespace-nowrap">
                  {detail.complaint.hearing_status}
                </span>
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Button
            onClick={() => setShowFullPacket(true)}
            variant="outline"
            className="gap-1.5 text-xs h-8"
          >
            <FileText className="w-3.5 h-3.5" /> Full Packet
          </Button>
          <Button
            onClick={() => setShowNOH(true)}
            variant="outline"
            className="gap-1.5 text-xs h-8"
          >
            <Printer className="w-3.5 h-3.5" /> Notice
          </Button>
          <Button
            onClick={workflow.refreshSnapshot}
            variant="outline"
            className="gap-1.5 text-xs h-8"
            disabled={workflow.isRefreshing}
          >
            {workflow.isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </Button>
          {isComplete && (
            <Button
              onClick={() => setActiveTab("order")}
              variant="outline"
              className="gap-1.5 text-xs h-8"
            >
              <Gavel className="w-3.5 h-3.5" /> Order
            </Button>
          )}
        </div>

        {workflow.canTransition("Under Review") && !isManagerRole && (
          <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-none">
                Ready for internal review?
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                Sets status to Under Review
              </p>
            </div>
            <Button
              onClick={workflow.sendToReview}
              disabled={workflow.isUpdating}
              size="sm"
              className="gap-1.5 text-xs h-8 px-3"
            >
              <Send className="w-3.5 h-3.5" /> Send to Review
            </Button>
          </div>
        )}

        {isManagerRole && form.status === "Under Review" && (
          <div className="rounded-lg border border-border bg-card mb-3 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Manager review actions
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Approve packet or request changes.
                </p>
              </div>
              <Button
                onClick={workflow.approvePacket}
                size="sm"
                className="gap-1.5 h-8 text-xs"
                disabled={workflow.isUpdating}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
            </div>
            <Textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Describe what needs to be corrected before approval…"
              rows={3}
              className="text-xs resize-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleReturnForRevision}
              disabled={workflow.isUpdating || !returnNotes.trim()}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request Changes
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-10 px-4 justify-start gap-0.5 overflow-x-auto scrollbar-none">
          <TabsTrigger value="packet" className="text-xs h-7 rounded-md px-3 shrink-0">
            Packet Details
          </TabsTrigger>
          <TabsTrigger value="readiness" className="text-xs h-7 rounded-md px-3 shrink-0">
            Readiness
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
          <TabsTrigger
            value="activity"
            className="text-xs h-7 rounded-md px-3 shrink-0 flex items-center gap-1"
          >
            <History className="w-3 h-3" /> Activity
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
          {form.status === "Changes Requested" && hasRevisionNotes && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex gap-3">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground leading-none mb-1">
                  Changes requested
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
                value={form.caseNumber}
                onChange={(e) => setField("caseNumber", e.target.value)}
                placeholder="e.g. HHP-26-08"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Program Code
              </Label>
              <Select
                value={form.programCode || "none"}
                onValueChange={(v) => setField("programCode", v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {PROGRAM_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
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
                {formatDate(packet.hearing_date)}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Hearing Time
              </Label>
              <Input
                value={form.hearingTime}
                onChange={(e) => setField("hearingTime", e.target.value)}
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
              value={form.hearingLocation}
              onChange={(e) => setField("hearingLocation", e.target.value)}
              placeholder="49 South Van Ness Ave."
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Proposed Enforcement Actions
            </Label>
            <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
              {PROPOSED_ACTION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.proposedActions.includes(option.value)}
                    onChange={() => toggleProposedAction(option.value)}
                    className="h-4 w-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
              Admin Fee
            </Label>
            <Input
              value={form.adminFee}
              onChange={(e) => setField("adminFee", e.target.value)}
              placeholder="e.g. $500 per week"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Packet Status
            </Label>
            <Select value={form.status} onValueChange={(value) => setField("status", value as PacketStatus)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PACKET_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
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
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Add review notes, approval comments, or return instructions..."
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleSave} disabled={workflow.isUpdating || !isDirty} className="gap-2">
              {workflow.isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Save Changes
            </Button>
            {workflow.canTransition("Complete") && (
              <Button
                onClick={workflow.markComplete}
                disabled={workflow.isUpdating}
                variant="outline"
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Complete
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="readiness"
          className="p-5 mt-0 overflow-y-auto max-h-[calc(100vh-320px)]"
        >
          <PacketReadinessPanel
            results={validationResults}
            files={files}
            onRefresh={workflow.refreshSnapshot}
            refreshing={workflow.isRefreshing}
          />
        </TabsContent>

        <TabsContent value="chrono" className="mt-0">
          <ChronologyEditorTab packetId={packet.id} />
        </TabsContent>

        <TabsContent value="evidence" className="mt-0">
          <AttachmentsEvidenceTab packetId={packet.id} data={detail} />
        </TabsContent>

        <TabsContent
          value="activity"
          className="p-5 mt-0 overflow-y-auto max-h-[calc(100vh-320px)]"
        >
          <PacketActivityPanel events={events} history={history} />
        </TabsContent>

        {isComplete && (
          <TabsContent
            value="order"
            className="p-5 mt-0 overflow-y-auto max-h-[calc(100vh-320px)]"
          >
            <Suspense
              fallback={
                <div className="text-center py-12 text-muted-foreground">
                  Loading Hearing Order editor…
                </div>
              }
            >
              <HearingOrderEditor
                packet={detail.packet}
                complaint={detail.complaint}
                location={detail.location}
                inspections={detail.inspections}
              />
            </Suspense>
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

  const {
    data: packets = [],
    isLoading,
    refetch,
    isRefetching,
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
    return packets.find((packet: Packet) => packet.id === urlPacketId) || null;
  }, [urlPacketId, packets]);

  const handleSelectPacket = (packet: Packet | null) => {
    if (packet) navigate(`${baseRoute}/${packet.id}`, { replace: true });
    else navigate(baseRoute, { replace: true });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Hearing Packets</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {packets.length} packet{packets.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PACKET_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="gap-1.5 h-8"
          >
            {isRefetching && <Loader2 className="w-3 h-3 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
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
            <PacketList
              packets={packets}
              selectedPacketId={selected?.id}
              onSelectPacket={handleSelectPacket}
            />
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
    </div>
  );
}
