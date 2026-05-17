import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { locationService } from "@/services/locationService";
import type { ComplaintSummary } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  FileEdit,
  FilePlus,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Lock,
  Home,
  Save,
  ExternalLink,
  Pencil,
  Search,
  Link2,
} from "lucide-react";
import ComplaintChronologyPanel from "./ComplaintChronologyPanel";
import {
  ACTIVE_STATUSES,
  CLOSURE_STATUSES,
  STATUS_DESCRIPTIONS,
} from "@/utils/complaintStatuses";
import {
  COMPLAINT_STATUS_THEME,
  INSPECTION_STATUS_THEME,
} from "@/utils/badgeThemes";
import { sanitizeText } from "@/utils/sanitizeText";

const DESC_THRESHOLD = 200;

function DescriptionText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESC_THRESHOLD;
  const display =
    isLong && !expanded ? text.slice(0, DESC_THRESHOLD) + "…" : text;
  return (
    <div className="mt-1">
      <p className="text-sm text-muted-foreground leading-relaxed">{display}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-primary hover:underline mt-0.5 font-medium"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

type LocationResult = any;

export type ViewMode = "inspector" | "admin" | "readonly";

type Props = {
  complaint: ComplaintSummary;
  onStatusUpdate: (newStatus: string) => void;
  viewMode?: ViewMode;
  actionsSlot?: React.ReactNode;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count !== undefined && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

export default function ComplaintDetailView({
  complaint,
  onStatusUpdate,
  viewMode = "inspector",
  actionsSlot,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState(complaint.status ?? "");
  const [blockedViolations, setBlockedViolations] = useState<string[] | null>(
    null,
  );

  // Responsible party edit state
  const [rpEditing, setRpEditing] = useState(false);
  const [rpName, setRpName] = useState("");
  const [rpAddress, setRpAddress] = useState("");
  const [rpPhone, setRpPhone] = useState("");
  const [rpEmail, setRpEmail] = useState("");

  // Location search/link state
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [linkingLocationId, setLinkingLocationId] = useState<string | null>(
    null,
  );

  const { data: detail, isLoading: loading } = useQuery({
    queryKey: ["complaint", complaint.id],
    queryFn: async () => {
      const d = await complaintService.getById(complaint.id);
      setRpName(d.hearing_rp_name ?? "");
      setRpAddress(d.hearing_rp_address ?? "");
      setRpPhone(d.hearing_rp_phone ?? "");
      setRpEmail(d.hearing_rp_email ?? "");
      setCurrentStatus(d.status ?? "");
      return d;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      complaintService.update(complaint.id, { status: newStatus }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaint.id] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onStatusUpdate(data.status);
      toast.success("Status updated");
    },
    onError: () => {
      setCurrentStatus(detail?.status || complaint.status || "");
      toast.error("Failed to update status");
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: (updates: any) =>
      complaintService.update(complaint.id, {
        hearing_rp_name: updates.owner_name,
        hearing_rp_address: updates.owner_address,
        hearing_rp_phone: updates.owner_phone,
        hearing_rp_email: updates.owner_email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaint.id] });
      setRpEditing(false);
      toast.success("Responsible party saved");
    },
  });

  const linkLocationMutation = useMutation({
    mutationFn: (locationId: string) =>
      complaintService.update(complaint.id, { location_id: locationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaint.id] });
      setLocationSearch("");
      setLocationResults([]);
      toast.success("Location linked");
    },
  });

  const debouncedLocationSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setLocationResults([]);
      return;
    }
    setLocationSearching(true);
    try {
      const r = await locationService.search(q);
      setLocationResults(r);
    } catch {
      /* no-op */
    } finally {
      setLocationSearching(false);
    }
  }, 300);

  const handleStatusChange = async (newStatus: string) => {
    setCurrentStatus(newStatus);
    setBlockedViolations(null);
    // In a real implementation, you'd check for unresolved violations here
    // For now, we just perform the mutation
    updateStatusMutation.mutate(newStatus);
  };

  const handleStartInspection = () => navigate(`/inspections/${complaint.id}`);

  const handleSaveResponsibleParty = () => {
    updateLocationMutation.mutate({
      owner_name: rpName || null,
      owner_address: rpAddress || null,
      owner_phone: rpPhone || null,
      owner_email: rpEmail || null,
    });
  };

  const handleLinkLocation = (locationId: string) => {
    setLinkingLocationId(locationId);
    linkLocationMutation.mutate(locationId, {
      onSettled: () => setLinkingLocationId(null),
    });
  };

  const hasDraft =
    detail?.inspections?.some((i: any) => i.draft_inspection_id) ?? false;
  const statusBadgeCls =
    COMPLAINT_STATUS_THEME[
      currentStatus as keyof typeof COMPLAINT_STATUS_THEME
    ] ?? "bg-muted text-muted-foreground";
  const canEditStatus = viewMode !== "readonly";
  const canStartInspection = viewMode === "inspector";

  // ── Shared JSX pieces ──────────────────────────────────────────────────────

  const statusSelector = (
    <Select
      value={currentStatus || "_"}
      onValueChange={handleStatusChange}
      disabled={updateStatusMutation.isPending}
    >
      <SelectTrigger className="w-full h-9 text-sm">
        {updateStatusMutation.isPending ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Updating...
          </span>
        ) : (
          <SelectValue placeholder="Change status..." />
        )}
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Active
        </div>
        {ACTIVE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className="font-medium">{s}</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
              {STATUS_DESCRIPTIONS[s]}
            </span>
          </SelectItem>
        ))}
        <div className="px-2 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-t border-border mt-1">
          Closure
        </div>
        {CLOSURE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <div className="flex items-center gap-1.5">
              {s === "Closed — Compliant" && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="font-medium">{s}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // ── Responsible Party section ──────────────────────────────────────────────

  const responsiblePartyContent = (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <SectionHeader
        icon={<Home className="w-4 h-4" />}
        title="Responsible Party"
        right={
          <div className="flex items-center gap-3">
            <a
              href="https://sfplanninggis.org/pim/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> SF PIM
            </a>
            {canEditStatus && !rpEditing && complaint.locationid && (
              <button
                onClick={() => setRpEditing(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
        }
      />
      <div className="p-5">
        {/* No location linked — show search field */}
        {!complaint.locationid && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-warning bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              No location linked — required before assigning an inspector
            </div>
            {canEditStatus && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Search and link a location
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      debouncedLocationSearch(e.target.value);
                    }}
                    placeholder="Type an address to search…"
                    className="pl-9 h-9 text-sm"
                  />
                  {locationSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                {locationResults.length > 0 && (
                  <div className="border border-border rounded-lg bg-card overflow-hidden">
                    {locationResults.slice(0, 6).map((loc: any) => (
                      <div
                        key={loc.id}
                        className="px-3 py-2.5 flex items-center justify-between border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {loc.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {loc.location_id && `ID: ${loc.location_id}`}
                            {loc.facility_type && ` · ${loc.facility_type}`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-3 shrink-0 h-7 text-xs gap-1"
                          onClick={() => handleLinkLocation(loc.id)}
                          disabled={linkLocationMutation.isPending}
                        >
                          {linkingLocationId === loc.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Link2 className="w-3 h-3" />
                          )}
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {locationSearch.length >= 2 &&
                  !locationSearching &&
                  locationResults.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No locations found for &ldquo;{locationSearch}&rdquo;
                    </p>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Location linked, view mode */}
        {detail && !rpEditing && !!complaint.locationid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rpName || rpAddress || rpPhone || rpEmail ? (
              <>
                <InfoRow
                  icon={<User className="w-3.5 h-3.5" />}
                  label="Owner / Responsible Party"
                  value={rpName}
                />
                <InfoRow
                  icon={<Home className="w-3.5 h-3.5" />}
                  label="Mailing Address"
                  value={rpAddress}
                />
                <InfoRow
                  icon={<Phone className="w-3.5 h-3.5" />}
                  label="Phone"
                  value={rpPhone}
                />
                <InfoRow
                  icon={<Mail className="w-3.5 h-3.5" />}
                  label="Email"
                  value={rpEmail}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic col-span-2">
                No responsible party info entered yet.{" "}
                {canEditStatus && (
                  <button
                    onClick={() => setRpEditing(true)}
                    className="text-primary hover:underline"
                  >
                    Add from SF PIM
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        {/* Edit form */}
        {detail && rpEditing && !!complaint.locationid && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Enter owner info from{" "}
              <a
                href="https://sfplanninggis.org/pim/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                sfplanninggis.org/pim
              </a>
              .
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Owner / Responsible Party
                </label>
                <Input
                  value={rpName}
                  onChange={(e) => setRpName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Mailing Address
                </label>
                <Input
                  value={rpAddress}
                  onChange={(e) => setRpAddress(e.target.value)}
                  placeholder="e.g. 123 Main Street, SF CA"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Phone
                </label>
                <Input
                  value={rpPhone}
                  onChange={(e) => setRpPhone(e.target.value)}
                  placeholder="e.g. (415) 555-1234"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email
                </label>
                <Input
                  value={rpEmail}
                  onChange={(e) => setRpEmail(e.target.value)}
                  placeholder="e.g. owner@email.com"
                  type="email"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={handleSaveResponsibleParty}
                disabled={updateLocationMutation.isPending}
                size="sm"
                className="gap-1.5"
              >
                {updateLocationMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRpEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Inspection history section ─────────────────────────────────────────────

  const inspectionHistory = loading ? (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-muted/40 border-b border-border">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="p-5 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  ) : detail && detail.inspections.length > 0 ? (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <SectionHeader
        icon={<ClipboardList className="w-4 h-4" />}
        title="Inspection History"
        count={detail.inspections.length}
      />
      <div className="divide-y divide-border">
        {detail.inspections.map((ins: any) => (
          <div
            key={ins.id}
            className="px-5 py-3.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {ins.inspection_date
                    ? new Date(
                        ins.inspection_date + "T00:00:00",
                      ).toLocaleDateString()
                    : "No date"}
                </span>
                {ins.inspection_type && (
                  <span className="text-xs text-muted-foreground">
                    {ins.inspection_type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {ins.inspector && (
                  <span className="text-xs text-muted-foreground">
                    {ins.inspector}
                  </span>
                )}
                {(ins.violation_count ?? 0) > 0 && (
                  <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">
                    {ins.violation_count} violation
                    {ins.violation_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {ins.inspection_rating === "Satisfactory" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Sat.
                </span>
              )}
              {ins.inspection_rating === "Unsatisfactory" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Unsat.
                </span>
              )}
              {/* Draft: dashed border neutral; Submitted: primary tint */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                  INSPECTION_STATUS_THEME[ins.status ?? ""] ??
                  "bg-muted text-muted-foreground"
                }`}
              >
                {ins.status === "Submitted" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {ins.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : !loading ? (
    <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-sm">
      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">No inspections yet</p>
      {canStartInspection && (
        <p className="text-xs mt-1">
          Click &ldquo;Start Inspection&rdquo; to begin.
        </p>
      )}
    </div>
  ) : null;

  // ── Desktop actions card ───────────────────────────────────────────────────

  const actionsCard =
    canEditStatus || actionsSlot ? (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-muted/40 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Actions
          </h3>
        </div>
        <div className="p-5 space-y-5">
          {canEditStatus && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Change Status
              </p>
              {statusSelector}
              {blockedViolations && blockedViolations.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">
                        Cannot mark as Closed — Compliant
                      </p>
                      <ul className="mt-2 space-y-1">
                        {blockedViolations.map((v, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs text-foreground"
                          >
                            <XCircle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                            {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {actionsSlot && (
            <div className={canEditStatus ? "border-t border-border pt-5" : ""}>
              {actionsSlot}
            </div>
          )}
        </div>
      </div>
    ) : null;

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Two-column grid on desktop */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* ── LEFT COLUMN (60%) ─────────────────────────────── */}
        <div className="space-y-4 lg:col-span-7">
          {/* Header card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {complaint.complaintid && (
                    <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      #{complaint.complaintid}
                    </span>
                  )}
                  {complaint.category &&
                    complaint.category.map((cat: string) => (
                      <span
                        key={cat}
                        className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground leading-snug">
                    {complaint.address}
                  </h2>
                  {complaint.locationid && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (complaint.locationid) {
                          const loc = await locationService.findByLocationId(
                            complaint.locationid,
                          );
                          if (loc) navigate(`/locations/${loc.id}`);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> View Location
                    </button>
                  )}
                </div>
                {detail?.description && (
                  <DescriptionText text={sanitizeText(detail.description)} />
                )}
                {viewMode !== "inspector" && complaint.assigned_to && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Assigned: {complaint.assigned_to.replace(" (DPH)", "")}
                  </p>
                )}
              </div>
              {canStartInspection && (
                <Button
                  onClick={handleStartInspection}
                  className="gap-2 flex-shrink-0"
                >
                  {hasDraft ? (
                    <>
                      <FileEdit className="w-4 h-4" /> Resume Draft
                    </>
                  ) : (
                    <>
                      <FilePlus className="w-4 h-4" /> Start Inspection
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeCls}`}
              >
                {currentStatus || "—"}
              </span>
              {updateStatusMutation.isPending && (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Complaint Info */}
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          ) : (
            detail && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 pb-3 border-b border-border/60">
                  Complaint Info
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Date Entered"
                    value={
                      detail.date_entered
                        ? new Date(
                            detail.date_entered + "T00:00:00",
                          ).toLocaleDateString()
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<AlertCircle className="w-3.5 h-3.5" />}
                    label="Reinspection Due"
                    value={
                      detail.reinspection_due_on_after
                        ? new Date(
                            detail.reinspection_due_on_after + "T00:00:00",
                          ).toLocaleDateString()
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Last Report Sent"
                    value={
                      detail.date_last_report_sent
                        ? new Date(
                            detail.date_last_report_sent + "T00:00:00",
                          ).toLocaleDateString()
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<User className="w-3.5 h-3.5" />}
                    label="Complainant"
                    value={detail.complainant_name}
                  />
                  <InfoRow
                    icon={<Phone className="w-3.5 h-3.5" />}
                    label="Phone"
                    value={detail.complainant_phone}
                  />
                  <InfoRow
                    icon={<Mail className="w-3.5 h-3.5" />}
                    label="Email"
                    value={detail.complainant_email}
                  />
                </div>
              </div>
            )
          )}

          {/* Responsible Party */}
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          ) : (
            responsiblePartyContent
          )}

          {/* Inspection History */}
          {inspectionHistory}

          {/* Case Chronology — mobile only (stacks below inspection history) */}
          <div className="lg:hidden">
            <ComplaintChronologyPanel
              chronology={detail?.chronology ?? []}
              loading={loading}
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN (40%) — sticky on desktop ────────── */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="sticky top-[110px] space-y-4">
            {actionsCard}
            <ComplaintChronologyPanel
              chronology={detail?.chronology ?? []}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile floating Actions bar ────────────────────── */}
      {(canEditStatus || actionsSlot) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl">
          <div className="container mx-auto px-4 py-3 max-w-[1300px]">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-muted-foreground shrink-0">
                Status
              </p>
              <div className="flex-1">{statusSelector}</div>
              {canStartInspection && (
                <Button
                  onClick={handleStartInspection}
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  {hasDraft ? (
                    <FileEdit className="w-3.5 h-3.5" />
                  ) : (
                    <FilePlus className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden xs:inline">
                    {hasDraft ? "Resume" : "Inspect"}
                  </span>
                </Button>
              )}
            </div>
            {blockedViolations && blockedViolations.length > 0 && (
              <p className="mt-1.5 text-xs text-destructive flex items-center gap-1.5">
                <Lock className="w-3 h-3 shrink-0" />
                Cannot close — {blockedViolations.length} unresolved violation
                {blockedViolations.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Spacer so content isn't hidden behind floating bar on mobile */}
      {(canEditStatus || actionsSlot) && <div className="lg:hidden h-20" />}
    </div>
  );
}
