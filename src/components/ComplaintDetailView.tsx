import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { complaintService } from "@/services/complaintService";
import { locationService } from "@/services/locationService";
import type { ComplaintSummary } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  Trash2,
  ChevronRight,
  Plus,
} from "lucide-react";
import ComplaintChronologyPanel from "./ComplaintChronologyPanel";
import { SectionHeader } from "@/components/ui/section-header";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

export function DescriptionText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > DESC_THRESHOLD;

  if (!isLong) {
    return (
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {text}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground leading-relaxed">
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
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
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
      void queryClient.invalidateQueries({
        queryKey: ["complaint", complaint.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onStatusUpdate(data.status as any);
      toast.success("Status updated");
    },
    onError: () => {
      setCurrentStatus(
        (detail?.status as any) || (complaint.status as any) || "",
      );
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
      void queryClient.invalidateQueries({
        queryKey: ["complaint", complaint.id],
      });
      setRpEditing(false);
      toast.success("Responsible party saved");
    },
  });

  const linkLocationMutation = useMutation({
    mutationFn: (locationId: string) =>
      complaintService.update(complaint.id, { legacy_location_id: locationId }),
    onMutate: () => {
      setOptimisticallyLinked(true);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["complaint", complaint.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
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
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
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
    linkLocationMutation.mutate(locationId);
  };

  const hasDraft =
    detail?.inspections?.some((i: any) => i.status === "Draft") ?? false;
  const statusBadgeCls =
    COMPLAINT_STATUS_THEME[
      currentStatus as keyof typeof COMPLAINT_STATUS_THEME
    ] ?? "bg-muted text-muted-foreground";
  const canEditStatus = viewMode !== "readonly";
  const canStartInspection = viewMode === "inspector";

  // ── Layout Components ──────────────────────────────────────────────────────

  const externalResourcesCard = (
    <Card className="overflow-hidden shadow-sm border-none bg-muted/30 print:hidden">
      <CardHeader className="px-5 py-2.5 border-b border-border/50">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <a
          href="https://sfplanninggis.org/pim/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between group p-2.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <MapPin className="size-4 text-primary/70" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">SF PIM</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold">
                Property Search
              </span>
            </div>
          </div>
          <ExternalLink
            data-icon="inline-end"
            className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
          />
        </a>
      </CardContent>
    </Card>
  );

  const statusSelector = (
    <Select
      value={currentStatus || "_"}
      onValueChange={handleStatusChange}
      disabled={updateStatusMutation.isPending}
    >
      <SelectTrigger className="w-full h-9 text-sm font-medium">
        {updateStatusMutation.isPending ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="animate-spin" /> Updating...
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
            <span className="font-semibold">{s}</span>
            <span className="hidden sm:inline text-[11px] text-muted-foreground ml-2 italic">
              — {STATUS_DESCRIPTIONS[s]}
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
                <Lock className="text-muted-foreground" />
              )}
              <span className="font-semibold">{s}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const locationLinked = !!complaint.legacy_location_id || optimisticallyLinked;

  const detailsSection = (
    <Card className="overflow-hidden shadow-md border-primary/10 transition-all duration-300">
      <SectionHeader icon={<ClipboardList />} title="Identity & Location" />
      <CardContent className="p-6 flex flex-col gap-6">
        {/* Row 1: Complainant & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex flex-col gap-2.5">
            <InfoRow
              icon={<User />}
              label="Complainant"
              value={detail?.complainant_name}
            />
            <InfoRow
              icon={<Phone />}
              label="Phone"
              value={detail?.complainant_phone}
            />
            <InfoRow
              icon={<Mail />}
              label="Email"
              value={detail?.complainant_email}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <InfoRow
              icon={<Calendar />}
              label="Entered"
              value={
                detail?.date_entered
                  ? new Date(
                      detail.date_entered + "T00:00:00",
                    ).toLocaleDateString()
                  : undefined
              }
            />
            <InfoRow
              icon={<AlertCircle />}
              label="Due After"
              value={
                detail?.reinspection_due_on_after
                  ? new Date(
                      detail.reinspection_due_on_after + "T00:00:00",
                    ).toLocaleDateString()
                  : undefined
              }
            />
            <InfoRow
              icon={<Calendar />}
              label="Last Report"
              value={
                detail?.date_last_report_sent
                  ? new Date(
                      detail.date_last_report_sent + "T00:00:00",
                    ).toLocaleDateString()
                  : undefined
              }
            />
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Row 2: Location Linking & Verification */}
        <div className="flex flex-col gap-4">
          {!locationLinked ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-warning uppercase tracking-widest">
                <AlertCircle className="size-3.5" /> Missing Linked Location
              </div>
              {canEditStatus && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                  <Input
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      void debouncedLocationSearch(e.target.value);
                    }}
                    placeholder="Search master records by address..."
                    className="pl-9 h-10 text-sm shadow-inner bg-muted/20 border-border/60 focus:bg-background transition-all"
                  />
                  {locationSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between group/loc">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-success/10 text-success flex items-center justify-center transition-transform group-hover/loc:scale-110 duration-300">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Verified Location Record
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                    Master ID: {complaint.legacy_location_id || "Optimistic"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (complaint.legacy_location_id) {
                    const loc = await locationService.findByLocationId(
                      complaint.legacy_location_id,
                    );
                    if (loc) navigate(`/locations/${loc.id}`);
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 px-4 h-8 rounded-full border border-primary/20 hover:bg-primary/5 transition-all duration-200"
              >
                View Map
              </button>
            </div>
          )}

          {locationResults.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5 border-l-2 border-primary/10 pl-4 py-1">
              {locationResults.slice(0, 3).map((loc: any) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200 group/item"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate group-hover/item:text-primary transition-colors">
                      {loc.address}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                      {loc.facility_type}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-bold uppercase tracking-widest px-3"
                    onClick={() => handleLinkLocation(loc.id)}
                  >
                    Link
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const responsiblePartyContent = (
    <Card className="overflow-hidden shadow-sm border-none bg-muted/20 transition-all duration-300">
      <SectionHeader
        icon={<Home />}
        title="Responsible Party"
        right={
          canEditStatus &&
          !rpEditing &&
          locationLinked && (
            <button
              onClick={() => setRpEditing(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary px-3 h-7 rounded-lg border border-primary/20 bg-card hover:bg-primary/5 transition-all duration-200"
            >
              <Pencil data-icon="inline-start" /> Edit
            </button>
          )
        }
      />
      <CardContent className="p-6">
        {!locationLinked ? (
          <p className="text-[11px] text-muted-foreground italic font-medium uppercase tracking-widest opacity-60 text-center py-4">
            Link a location to manage records
          </p>
        ) : (
          <>
            {detail && !rpEditing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                {rpName || rpAddress || rpPhone || rpEmail ? (
                  <>
                    <InfoRow icon={<User />} label="Owner" value={rpName} />
                    <InfoRow
                      icon={<Home />}
                      label="Mailing"
                      value={rpAddress}
                    />
                    <InfoRow icon={<Phone />} label="Phone" value={rpPhone} />
                    <InfoRow icon={<Mail />} label="Email" value={rpEmail} />
                  </>
                ) : (
                  <div className="col-span-2 py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-3 font-medium">
                      No party data logged in hearing records.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-bold uppercase tracking-widest text-[10px] px-4"
                      onClick={() => setRpEditing(true)}
                    >
                      <Plus data-icon="inline-start" /> Add Record
                    </Button>
                  </div>
                )}
              </div>
            )}

            {detail && rpEditing && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
                      Name
                    </Label>
                    <Input
                      value={rpName}
                      onChange={(e) => setRpName(e.target.value)}
                      placeholder="Full name"
                      className="h-9 shadow-inner bg-card/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
                      Mailing Address
                    </Label>
                    <Input
                      value={rpAddress}
                      onChange={(e) => setRpAddress(e.target.value)}
                      placeholder="Street, City, Zip"
                      className="h-9 shadow-inner bg-card/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
                      Phone
                    </Label>
                    <Input
                      value={rpPhone}
                      onChange={(e) => setRpPhone(e.target.value)}
                      placeholder="(415) 555-0000"
                      className="h-9 shadow-inner bg-card/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
                      Email
                    </Label>
                    <Input
                      value={rpEmail}
                      onChange={(e) => setRpEmail(e.target.value)}
                      type="email"
                      placeholder="owner@email.com"
                      className="h-9 shadow-inner bg-card/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-border/40 pt-4">
                  <Button
                    onClick={handleSaveResponsibleParty}
                    disabled={updateLocationMutation.isPending}
                    size="sm"
                    className="font-bold uppercase tracking-widest text-[10px] px-6"
                  >
                    {updateLocationMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save data-icon="inline-start" />
                    )}
                    Save Record
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRpEditing(false)}
                    className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const actionsCard = (canEditStatus || actionsSlot) && (
    <Card className="overflow-hidden shadow-sm border-none bg-muted/30">
      <CardHeader className="px-5 py-2.5 border-b border-border/50">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-4">
        {canEditStatus && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
              Status Management
            </p>
            {statusSelector}
          </div>
        )}
        {actionsSlot && (
          <div
            className={cn(
              "flex flex-col gap-2",
              canEditStatus ? "border-t border-border/40 pt-4" : "",
            )}
          >
            {actionsSlot}
          </div>
        )}
        <div className="border-t border-border/40 pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 h-8 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-all"
              >
                <Trash2 data-icon="inline-start" /> Delete Case
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-none shadow-2xl animate-in zoom-in-95 duration-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase tracking-tight text-xl">
                  Delete Complaint?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium">
                  This action is irreversible. All associated hearing packet
                  data will be purged.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="font-bold uppercase tracking-widest text-[10px] rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase tracking-widest text-[10px] rounded-xl px-6"
                >
                  {deleteMutation.isPending && (
                    <Loader2 className="animate-spin mr-2" />
                  )}
                  Confirm Purge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full flex flex-col gap-8">
      {/* ── HERO SUMMARY (Full Width) ─────────────────────── */}
      <Card className="border-none bg-primary shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-primary/20 hover:-translate-y-0.5 group/hero">
        <CardContent className="p-6 sm:p-10 text-primary-foreground">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge
                  variant="outline"
                  className="bg-background/10 text-primary-foreground border-primary-foreground/30 font-mono font-bold text-xs h-6 px-2.5 backdrop-blur-sm"
                >
                  #{complaint.legacy_complaint_id}
                </Badge>
                {complaint.category?.map((cat: string) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-none font-bold text-[10px] uppercase tracking-widest h-5 transition-colors duration-200"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black leading-[1.1] tracking-tighter mb-5 drop-shadow-md transition-transform duration-500 group-hover/hero:translate-x-1">
                {complaint.address}
              </h2>
              {detail?.description && (
                <div className="max-w-2xl bg-black/10 rounded-2xl p-5 border border-white/5 backdrop-blur-sm shadow-inner transition-colors group-hover/hero:bg-black/15">
                  <DescriptionText text={sanitizeText(detail.description)} />
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-6 shrink-0">
              {canStartInspection && (
                <Button
                  onClick={handleStartInspection}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-black uppercase tracking-widest text-xs h-14 px-10 rounded-2xl shadow-xl hover:shadow-white/10 hover:-translate-y-1 active:scale-95 transition-all duration-300"
                >
                  {hasDraft ? (
                    <>
                      <FileEdit data-icon="inline-start" /> Resume Draft
                    </>
                  ) : (
                    <>
                      <FilePlus data-icon="inline-start" /> Start New
                    </>
                  )}
                </Button>
              )}
              <div className="flex flex-col items-end gap-1.5 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                  Workflow Status
                </span>
                <Badge
                  className={cn(
                    "text-xs font-black uppercase tracking-widest h-7 px-4 shadow-lg border-none transition-all duration-300 group-hover/hero:scale-105",
                    statusBadgeCls,
                  )}
                >
                  {currentStatus || "Pending"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CONTENT GRID (7/5 Split) ──────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="flex flex-col gap-8 lg:col-span-7">
          <ErrorBoundary title="Identity Section Error">
            {detailsSection}
          </ErrorBoundary>

          <Card className="overflow-hidden shadow-sm border-none bg-muted/20 transition-all duration-300">
            <SectionHeader
              icon={<ClipboardList />}
              title="Inspection History"
              count={detail?.inspections?.length}
            />
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 flex flex-col gap-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {detail?.inspections?.map((ins: any) => (
                    <div
                      key={ins.id}
                      className="px-6 py-4.5 flex items-center justify-between gap-4 hover:bg-card/60 transition-all duration-200 group/ins cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover/ins:text-primary transition-colors">
                          {new Date(
                            ins.inspection_date + "T00:00:00",
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">
                          {ins.inspection_type} · {ins.inspector}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {ins.violation_count > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] font-black h-5 px-2 border-none shadow-sm"
                          >
                            {ins.violation_count}v
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-black h-5 px-2 border-none shadow-none",
                            INSPECTION_STATUS_THEME[ins.status] ?? "bg-muted",
                          )}
                        >
                          {ins.status}
                        </Badge>
                        <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover/ins:text-primary group-hover/ins:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                  {detail?.inspections?.length === 0 && (
                    <div className="p-16 text-center">
                      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <ClipboardList className="size-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                        No inspections recorded
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5 sticky top-20">
          <ErrorBoundary title="Actions Error">{actionsCard}</ErrorBoundary>
          <ErrorBoundary title="Party Error">
            {responsiblePartyContent}
          </ErrorBoundary>
          <ErrorBoundary title="Resources Error">
            {externalResourcesCard}
          </ErrorBoundary>
          <ErrorBoundary title="Chronology Error">
            <ComplaintChronologyPanel
              chronology={detail?.chronology ?? []}
              loading={loading}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* ── MOBILE WORKFLOW BAR ────────────────────────── */}
      {(canEditStatus || actionsSlot) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60 p-4 pb-safe shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center gap-3">
            <div className="flex-1">{statusSelector}</div>
            {canStartInspection && (
              <Button
                onClick={handleStartInspection}
                size="icon"
                className="size-12 rounded-2xl shrink-0 shadow-xl active:scale-90 transition-transform"
              >
                {hasDraft ? (
                  <FileEdit className="size-5" />
                ) : (
                  <FilePlus className="size-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="lg:hidden h-24" />
    </div>
  );
}
