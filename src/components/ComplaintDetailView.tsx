import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { complaintService } from "@/services/complaintService";
import { locationService } from "@/services/locationService";
import type { ComplaintSummary } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  MapPin,
  PlusCircle,
  Trash2,
} from "lucide-react";
import ComplaintChronologyPanel from "./ComplaintChronologyPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ACTIVE_STATUSES, CLOSURE_STATUSES, STATUS_DESCRIPTIONS } from "@/utils/complaintStatuses";
import { COMPLAINT_STATUS_THEME, INSPECTION_STATUS_THEME } from "@/utils/badgeThemes";
import { sanitizeText } from "@/utils/sanitizeText";

const DESC_THRESHOLD = 200;

export function DescriptionText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > DESC_THRESHOLD;

  if (!isLong) {
    return <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</div>;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <div className="text-sm text-muted-foreground leading-relaxed">
        {!open && <p>{text.slice(0, DESC_THRESHOLD)}…</p>}
        <CollapsibleContent>
          <p>{text}</p>
        </CollapsibleContent>
      </div>
      <CollapsibleTrigger className="text-xs text-primary hover:underline mt-1 font-medium block">
        {open ? "Show less" : "Show more"}
      </CollapsibleTrigger>
    </Collapsible>
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

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
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
    <CardHeader className="border-b border-border/60 py-3 px-5">
      <div className="flex items-center gap-2">
        <span className="text-primary/70 shrink-0">{icon}</span>
        <CardTitle className="text-xs tracking-widest font-bold text-foreground uppercase">
          {title}
        </CardTitle>
        {count !== undefined && (
          <Badge
            variant="secondary"
            className="text-xs h-4 px-1.5 font-bold bg-muted/80 text-muted-foreground border-none"
          >
            {count}
          </Badge>
        )}
      </div>
      {right && <CardAction>{right}</CardAction>}
    </CardHeader>
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
  const [blockedViolations, setBlockedViolations] = useState<string[] | null>(null);

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
  const [linkingLocationId, setLinkingLocationId] = useState<string | null>(null);
  const [optimisticallyLinked, setOptimisticallyLinked] = useState(false);

  const { data: detail, isLoading: loading } = useQuery({
    queryKey: ["complaint", complaint.id],
    queryFn: async () => {
      const d = await complaintService.getById(complaint.id);
      setRpName(d.hearing_rp_name ?? "");
      setRpAddress(d.hearing_rp_address ?? "");
      setRpPhone(d.hearing_rp_phone ?? "");
      setRpEmail(d.hearing_rp_email ?? "");
      setCurrentStatus((d.status as any) ?? "");
      return d;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      complaintService.update(complaint.id, { status: newStatus as any }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaint.id] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onStatusUpdate(data.status as any);
      toast.success("Status updated");
    },
    onError: () => {
      setCurrentStatus((detail?.status as any) || (complaint.status as any) || "");
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
      complaintService.update(complaint.id, { locationid: locationId }),
    onMutate: () => {
      setOptimisticallyLinked(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaint.id] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setLocationSearch("");
      setLocationResults([]);
      toast.success("Location linked");
    },
    onError: () => {
      setOptimisticallyLinked(false);
      toast.error("Failed to link location — please retry");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => complaintService.softDelete(complaint.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint deleted");
      navigate("/complaints");
    },
    onError: () => {
      toast.error("Failed to delete complaint");
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
      toast.error("Location search failed — please retry");
      setLocationResults([]);
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

  const handleStartInspection = () =>
    navigate(`/inspections/${complaint.id}`, {
      state: {
        address: complaint.address,
        description: detail?.description,
        complaintId: complaint.id,
      },
    });

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

  const hasDraft = detail?.inspections?.some((i: any) => i.status === "Draft") ?? false;
  const statusBadgeCls =
    COMPLAINT_STATUS_THEME[currentStatus as keyof typeof COMPLAINT_STATUS_THEME] ??
    "bg-muted text-muted-foreground";
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
        <div className="px-2 pt-2 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
        <div className="px-2 pt-3 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-widest border-t border-border mt-1">
          Closure
        </div>
        {CLOSURE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <div className="flex items-center gap-1.5">
              {s === "Closed — Compliant" && <Lock className="w-3 h-3 text-muted-foreground" />}
              <span className="font-medium">{s}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // ── Location section (visual proximity: warning + search in same card) ──────

  const locationLinked = !!complaint.locationid || optimisticallyLinked;

  const locationSectionContent = (
    <Card className="overflow-hidden shadow-sm">
      <SectionHeader
        icon={<MapPin className="w-4 h-4" />}
        title="Location"
        right={
          complaint.locationid && (
            <div className="flex items-center gap-3">
              <a
                href="https://sfplanninggis.org/pim/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> SF PIM
              </a>
              <button
                type="button"
                onClick={async () => {
                  if (complaint.locationid) {
                    const loc = await locationService.findByLocationId(complaint.locationid);
                    if (loc) navigate(`/locations/${loc.id}`);
                  }
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" /> View Location
              </button>
            </div>
          )
        }
      />
      <CardContent className="p-5">
        {!locationLinked && (
          <div className="flex flex-col gap-3 print:hidden">
            <Alert variant="warning" className="px-3 py-2">
              <AlertCircle />
              <AlertDescription className="text-xs font-medium">
                No location linked — required before assigning an inspector
              </AlertDescription>
            </Alert>
            {canEditStatus && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="location-search"
                    className="text-xs uppercase tracking-wider font-semibold text-muted-foreground ml-1"
                  >
                    Search Location
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="location-search"
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
                </div>

                {/* Skeleton loading state during search */}
                {locationSearching && (
                  <div className="border border-border rounded-lg bg-card overflow-hidden">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="px-3 py-2.5 flex items-center justify-between border-b border-border last:border-b-0"
                      >
                        <div className="flex flex-col gap-1.5 flex-1">
                          <Skeleton className="h-3.5 w-3/5" />
                          <Skeleton className="h-3 w-2/5" />
                        </div>
                        <Skeleton className="h-7 w-14 ml-3" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Search results */}
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

                {/* Empty state with fallback actions */}
                {locationSearch.length >= 2 &&
                  !locationSearching &&
                  locationResults.length === 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground italic">
                        No locations found for &ldquo;{locationSearch}&rdquo;
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            navigate("/complaints/new", {
                              state: { prefilledAddress: locationSearch },
                            })
                          }
                        >
                          <PlusCircle className="w-3 h-3" /> Create New Location
                        </Button>
                        <a
                          href="https://sfplanninggis.org/pim/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Verify via SF PIM
                        </a>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Location linked confirmation */}
        {locationLinked && (
          <div className="flex items-center gap-2 text-xs font-medium text-success bg-success/10 border border-success/30 rounded-md px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            Location linked
            {optimisticallyLinked && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Responsible Party section ──────────────────────────────────────────────

  const responsiblePartyContent = (
    <Card className="overflow-hidden shadow-sm">
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
            {canEditStatus && !rpEditing && locationLinked && (
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
      <CardContent className="p-5">
        {/* Location not linked — prompt to link first */}
        {!locationLinked && (
          <p className="text-xs text-muted-foreground italic">
            Link a location above to view and edit responsible party info.
          </p>
        )}

        {/* Location linked, view mode */}
        {detail && !rpEditing && locationLinked && (
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
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={rpPhone} />
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={rpEmail} />
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
        {detail && rpEditing && locationLinked && (
          <div className="flex flex-col gap-3">
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
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Owner / Responsible Party
                </Label>
                <Input
                  value={rpName}
                  onChange={(e) => setRpName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Mailing Address
                </Label>
                <Input
                  value={rpAddress}
                  onChange={(e) => setRpAddress(e.target.value)}
                  placeholder="e.g. 123 Main Street, SF CA"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Phone
                </Label>
                <Input
                  value={rpPhone}
                  onChange={(e) => setRpPhone(e.target.value)}
                  placeholder="e.g. (415) 555-1234"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email
                </Label>
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
              <Button variant="ghost" size="sm" onClick={() => setRpEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Inspection history section ─────────────────────────────────────────────

  const inspectionHistory = loading ? (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60 py-3 px-5">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  ) : detail && detail.inspections.length > 0 ? (
    <Card className="overflow-hidden shadow-sm">
      <SectionHeader
        icon={<ClipboardList className="w-4 h-4" />}
        title="Inspection History"
        count={detail.inspections.length}
      />
      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {detail.inspections.map((ins: any) => (
            <div key={ins.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {ins.inspection_date
                      ? new Date(ins.inspection_date + "T00:00:00").toLocaleDateString()
                      : "No date"}
                  </span>
                  {ins.inspection_type && (
                    <span className="text-xs text-muted-foreground">{ins.inspection_type}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {ins.inspector && (
                    <span className="text-xs text-muted-foreground">{ins.inspector}</span>
                  )}
                  {(ins.violation_count ?? 0) > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-xs h-4.5 px-1.5 font-bold bg-destructive/10 text-destructive border-none shadow-none"
                    >
                      {ins.violation_count} violation
                      {ins.violation_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {ins.inspection_rating === "Satisfactory" && (
                  <Badge
                    variant="outline"
                    className="text-xs h-4.5 px-2 font-bold bg-success/10 text-success border-success/20"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Sat.
                  </Badge>
                )}
                {ins.inspection_rating === "Unsatisfactory" && (
                  <Badge
                    variant="outline"
                    className="text-xs h-4.5 px-2 font-bold bg-destructive/10 text-destructive border-destructive/20"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Unsat.
                  </Badge>
                )}
                {/* Draft: dashed border neutral; Submitted: primary tint */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs h-4.5 px-2 flex items-center gap-1 font-bold",
                    INSPECTION_STATUS_THEME[ins.status ?? ""] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {ins.status === "Submitted" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {ins.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : !loading ? (
    <Card className="p-8 text-center text-muted-foreground shadow-sm">
      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">No inspections yet</p>
      {canStartInspection && (
        <p className="text-xs mt-1">Click &ldquo;Start Inspection&rdquo; to begin.</p>
      )}
    </Card>
  ) : null;

  // ── Desktop actions card ───────────────────────────────────────────────────
  const canShowActions = viewMode === "admin" || canEditStatus;

  const actionsCard =
    canShowActions || actionsSlot ? (
      <Card className="overflow-hidden shadow-sm print:hidden">
        <CardHeader className="px-5 py-3 bg-muted/40 border-b border-border">
          <CardTitle className="text-xs tracking-widest">Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-5">
          {canEditStatus && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Change Status
              </p>
              {statusSelector}
              {blockedViolations && blockedViolations.length > 0 && (
                <Alert variant="destructive">
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Cannot mark as Closed — Compliant</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {blockedViolations.map((v, i) => (
                        <li key={i} className="text-xs">
                          {v}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          {actionsSlot && (
            <div className={canEditStatus ? "border-t border-border pt-5" : ""}>{actionsSlot}</div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 gap-2 h-9 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Complaint
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the complaint. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    ) : null;

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Two-column grid on desktop */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <Card className="border-primary/20 shadow-md">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {complaint.complaintid && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono font-bold bg-primary/10 text-primary border-none h-4 px-1"
                      >
                        #{complaint.complaintid}
                      </Badge>
                    )}
                    {complaint.category && complaint.category.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {complaint.category.map((cat: string) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="text-xs font-semibold h-4 px-2 bg-primary/5 text-primary border-primary/20"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground leading-snug">
                      {complaint.address}
                    </h2>
                  </div>
                  {detail?.description && (
                    <DescriptionText text={sanitizeText(detail.description)} />
                  )}
                  {viewMode !== "inspector" && complaint.assigned_to && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
                      Assigned: {complaint.assigned_to.replace(" (DPH)", "")}
                    </p>
                  )}
                </div>
                {canStartInspection && (
                  <Button
                    onClick={handleStartInspection}
                    title={
                      hasDraft
                        ? "Resume your draft inspection for this complaint"
                        : "Start a new inspection for this complaint"
                    }
                    className="gap-2 flex-shrink-0 h-10 px-5 text-sm font-bold shadow-sm"
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
              <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Status
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-xs h-5 px-2 font-bold", statusBadgeCls)}
                >
                  {currentStatus || "—"}
                </Badge>
                {updateStatusMutation.isPending && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complaint Info */}
          {loading ? (
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 py-3 px-5">
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/5" />
              </CardContent>
            </Card>
          ) : (
            detail && (
              <Card className="overflow-hidden shadow-sm">
                <SectionHeader
                  icon={<ClipboardList className="w-4 h-4" />}
                  title="Complaint Info"
                />
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={<Calendar className="w-3.5 h-3.5" />}
                      label="Date Entered"
                      value={
                        detail.date_entered
                          ? new Date(detail.date_entered + "T00:00:00").toLocaleDateString()
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
                </CardContent>
              </Card>
            )
          )}

          {/* Responsible Party */}
          {loading ? (
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 py-3 px-5">
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/5" />
              </CardContent>
            </Card>
          ) : (
            <ErrorBoundary title="Responsible Party Error">{responsiblePartyContent}</ErrorBoundary>
          )}

          {/* Location */}
          <ErrorBoundary title="Location Error">{locationSectionContent}</ErrorBoundary>

          {/* Inspection History */}
          <ErrorBoundary title="Inspection History Error">{inspectionHistory}</ErrorBoundary>

          {/* Case Chronology — mobile only (stacks below inspection history) */}
          <div className="lg:hidden">
            <ErrorBoundary title="Chronology Error">
              <ComplaintChronologyPanel chronology={detail?.chronology ?? []} loading={loading} />
            </ErrorBoundary>
          </div>
        </div>

        {/* ── RIGHT COLUMN (40%) — sticky on desktop ────────── */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="sticky top-20 flex flex-col gap-4">
            {actionsCard}
            <ErrorBoundary title="Chronology Error">
              <ComplaintChronologyPanel chronology={detail?.chronology ?? []} loading={loading} />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* ── Mobile floating Actions bar ────────────────────── */}
      {(canEditStatus || actionsSlot) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl print:hidden">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-muted-foreground shrink-0">Status</p>
              <div className="flex-1">{statusSelector}</div>
              {canStartInspection && (
                <Button onClick={handleStartInspection} size="sm" className="shrink-0 gap-1.5">
                  {hasDraft ? (
                    <FileEdit className="w-3.5 h-3.5" />
                  ) : (
                    <FilePlus className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden xs:inline">{hasDraft ? "Resume" : "Inspect"}</span>
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
