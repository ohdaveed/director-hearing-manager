import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintService, type EscalationQueueComplaint } from "@/services/complaintService";
import { packetService } from "@/services/packetService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  AlertTriangle,
  ChevronLeft,
  Calendar,
  Save,
  ClipboardList,
  Package,
  ExternalLink,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleTable } from "@/components/ui/SimpleTable";
import ComplaintDetailView from "@/components/ComplaintDetailView";
import { toast } from "sonner";
import { HEARING_STATUS_OPTIONS, type HearingStatus } from "@/utils/complaintStatuses";
import { format } from "date-fns";
import type { ComplaintSummary } from "@/types/complaint";

type Complaint = EscalationQueueComplaint;
type HearingPacketRelation = {
  id: string;
  deleted_at?: string | null;
};
type EscalationUpdate = Pick<Complaint, "hearing_status" | "hearing_date">;

function toHearingStatus(value: string | null | undefined): HearingStatus {
  const matched = HEARING_STATUS_OPTIONS.find((status) => status === value);
  return matched ?? "None";
}

function toComplaintSummary(complaint: Complaint): ComplaintSummary {
  return {
    id: complaint.id,
    legacy_complaint_id: complaint.legacy_complaint_id ?? undefined,
    address: complaint.address ?? undefined,
    description: complaint.description ?? undefined,
    status: complaint.status ?? undefined,
    category: complaint.category ?? undefined,
    reinspection_due_on_after: complaint.reinspection_due_on_after ?? undefined,
    legacy_location_id: complaint.legacy_location_id ?? undefined,
    hearing_status: complaint.hearing_status ?? undefined,
    hearing_date: complaint.hearing_date ?? undefined,
    assigned_to: complaint.assigned_to ?? undefined,
    date_entered: complaint.date_entered ?? undefined,
  };
}

const HEARING_STATUSES = HEARING_STATUS_OPTIONS;

const HEARING_STATUS_COLORS: Record<string, string> = {
  "Referral Pending": "bg-warning/10 text-warning border-warning/20",
  Referred: "bg-warning/20 text-warning border-warning/30",
  "Hearing Scheduled": "bg-accent/50 text-accent-foreground border-accent/30",
  Heard: "bg-primary/10 text-primary border-primary/20",
  "Decision Issued": "bg-success/10 text-success border-success/20",
};

const PACKET_ELIGIBLE_STATUSES = [
  "Referral Pending",
  "Referred",
  "Hearing Scheduled",
  "Heard",
  "Decision Issued",
];

function EscalationEditor({
  complaint,
  onUpdated,
  onComplaintPacketCreated,
}: {
  complaint: Complaint;
  onUpdated: (c: Partial<Complaint>) => void;
  onComplaintPacketCreated: (complaintId: string, packetId: string) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [hearingStatus, setHearingStatus] = useState<HearingStatus>(
    toHearingStatus(complaint.hearing_status),
  );
  const [hearingDate, setHearingDate] = useState(complaint.hearing_date ?? "");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (updates: EscalationUpdate) => complaintService.update(complaint.id, updates),
    onSuccess: (data) => {
      onUpdated({
        hearing_status: data.hearing_status,
        hearing_date: data.hearing_date,
      });
      toast.success("Escalation record updated");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: () => {
      toast.error("Failed to save escalation record");
    },
  });

  const createPacketMutation = useMutation({
    mutationFn: () =>
      packetService.create(complaint.id, {
        hearingDate: hearingDate || complaint.hearing_date || null,
        assignedTo: complaint.assigned_to ?? null,
        caseNumber: complaint.legacy_complaint_id ?? null,
      }),
    onSuccess: (data) => {
      toast.success("Hearing packet is ready.");
      onComplaintPacketCreated(complaint.id, data.id);
      queryClient.invalidateQueries({ queryKey: ["complaints", "escalated"] });
      queryClient.invalidateQueries({ queryKey: ["packets"] });
      navigate(`/enforcement/hearings/${data.id}`);
    },
    onError: () => {
      toast.error("Failed to create hearing packet");
    },
  });

  const [prevComplaintId, setPrevComplaintId] = useState(complaint.id);
  if (complaint.id !== prevComplaintId) {
    setPrevComplaintId(complaint.id);
    setHearingStatus(toHearingStatus(complaint.hearing_status));
    setHearingDate(complaint.hearing_date ?? "");
  }

  const handleSave = async () => {
    updateMutation.mutate({
      hearing_status: hearingStatus,
      hearing_date: hearingDate || null,
    });
  };

  const handleCreatePacket = async () => {
    setShowCreateDialog(false);
    createPacketMutation.mutate();
  };

  const hsCls =
    HEARING_STATUS_COLORS[hearingStatus] ?? "bg-muted text-muted-foreground border-border";
  const isPacketEligible = PACKET_ELIGIBLE_STATUSES.includes(hearingStatus);
  const existingPacket = Array.isArray(complaint.hearing_packets)
    ? complaint.hearing_packets.find((packet: HearingPacketRelation) => !packet.deleted_at)
    : null;
  const hasPacket = !!existingPacket;
  const creatingPacket = createPacketMutation.isPending;
  const saving = updateMutation.isPending;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" /> Escalation Controls
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Hearing Status
          </label>
          <Select
            value={hearingStatus}
            onValueChange={(value) => setHearingStatus(toHearingStatus(value))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEARING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hearingStatus !== "None" && (
            <span
              className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border font-medium ${hsCls}`}
            >
              ⚖ {hearingStatus}
            </span>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Hearing Date
          </label>
          <Input
            type="date"
            value={hearingDate}
            onChange={(e) => setHearingDate(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Hearing Packet creation */}
      {isPacketEligible && (
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Director's Hearing Packet</p>
                <p className="text-xs text-muted-foreground">
                  {hasPacket ? "A packet exists for this case." : "No packet created yet."}
                </p>
              </div>
            </div>
            {hasPacket ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-success/30 text-success hover:bg-success/5"
                onClick={() => navigate(`/enforcement/hearings/${existingPacket.id}`)}
              >
                <ExternalLink className="w-3 h-3" /> Open Packet
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setShowCreateDialog(true)}
                disabled={creatingPacket}
                data-testid="create-hearing-packet"
              >
                {creatingPacket ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Package className="w-3 h-3" />
                )}
                Create Packet
              </Button>
            )}
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Escalation Record
      </Button>

      {/* Create Packet Confirmation Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Create Hearing Packet
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>This will create a new Director's Hearing Packet for this case.</p>
                <div className="bg-muted rounded-lg p-3 space-y-1 text-foreground">
                  {complaint.legacy_complaint_id && (
                    <p>
                      <span className="font-medium">Complaint:</span>{" "}
                      <span className="font-mono">#{complaint.legacy_complaint_id}</span>
                    </p>
                  )}
                  {complaint.address && (
                    <p>
                      <span className="font-medium">Address:</span> {complaint.address}
                    </p>
                  )}
                  {hearingDate && (
                    <p>
                      <span className="font-medium">Hearing Date:</span>{" "}
                      {new Date(hearingDate + "T00:00:00").toLocaleDateString()}
                    </p>
                  )}
                  {complaint.assigned_to && (
                    <p>
                      <span className="font-medium">Inspector:</span> {complaint.assigned_to}
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Navigate to the <strong>Hearing Packets</strong> section to manage and print the
                  packet.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={creatingPacket}
              onClick={handleCreatePacket}
              data-testid="confirm-create-packet"
            >
              Create Packet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EscalationQueuePage() {
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState("");

  const { data: complaints = [], isLoading: loading } = useQuery({
    queryKey: ["complaints", "escalated"],
    queryFn: async () => {
      const data = await complaintService.getEscalationQueue();
      return data
        .filter(
          (c) =>
            c.status === "Escalated" ||
            c.status === "Non-Compliant" ||
            (c.hearing_status && c.hearing_status !== "None"),
        )
        .sort((a, b) => (b.date_entered ?? "").localeCompare(a.date_entered ?? ""));
    },
  });

  const filtered = useMemo(() => {
    if (!search) return complaints;
    const q = search.toLowerCase();
    return complaints.filter(
      (c) => c.address?.toLowerCase().includes(q) || c.legacy_complaint_id?.includes(q),
    );
  }, [complaints, search]);

  const handleUpdated = (patch: Partial<Complaint>) => {
    if (!selected) return;
    setSelected({ ...selected, ...patch });
  };

  const handlePacketCreated = (complaintId: string, packetId: string) => {
    if (selected?.id === complaintId) {
      setSelected({
        ...selected,
        hearing_packets: [
          {
            id: packetId,
            hearing_date: selected.hearing_date ?? null,
            packet_status: "Not Started",
            assigned_to: selected.assigned_to ?? null,
            case_number: selected.legacy_complaint_id ?? null,
            program_code: null,
            packet_type: "Draft",
            deleted_at: null,
          },
        ],
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-14 z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-2.5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by address or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm pl-8"
                data-testid="escalation-search"
              />
            </div>
            <span className="text-sm text-muted-foreground tabular-nums ml-auto">
              {filtered.length} case{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-5 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className={`flex-1 min-w-0 ${showDetail ? "hidden lg:block" : ""}`}>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl px-4 py-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No escalated cases</p>
                <p className="text-xs mt-1">Cases marked Escalated or Non-Compliant appear here</p>
              </div>
            ) : (
              <SimpleTable
                data={filtered}
                columns={[
                  { key: "legacy_complaint_id", header: "ID" },
                  { key: "address", header: "Address" },
                  { key: "status", header: "Status" },
                  { key: "hearing_status", header: "Hearing Status" },
                  {
                    key: "hearing_date",
                    header: "Hearing Date",
                    render: (v) =>
                      v ? format(new Date((v as string) + "T00:00:00"), "MMM d, yyyy") : "-",
                  },
                ]}
                searchable={false}
                pageSize={10}
                onRowClick={(c) => {
                  setSelected(c as Complaint);
                  setShowDetail(true);
                }}
              />
            )}
          </div>

          <div className={`flex-1 min-w-0 space-y-4 ${showDetail ? "block" : "hidden md:block"}`}>
            {selected ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetail(false)}
                  className="md:hidden mb-1 gap-1.5 -ml-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <EscalationEditor
                  complaint={selected}
                  onUpdated={handleUpdated}
                  onComplaintPacketCreated={handlePacketCreated}
                />
                <ComplaintDetailView
                  key={selected.id}
                  complaint={toComplaintSummary(selected)}
                  onStatusUpdate={() => {}}
                  viewMode="readonly"
                />
              </>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                <ClipboardList className="w-14 h-14 mb-4 opacity-20" />
                <p className="font-semibold text-foreground">Select a case</p>
                <p className="text-sm mt-1">
                  Review complaint history and update hearing status or add a chronology note.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
