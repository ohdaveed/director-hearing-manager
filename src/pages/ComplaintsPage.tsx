/**
 * ComplaintsPage.tsx
 *
 * Unified complaint list for all roles — replaces the old "My Complaints"
 * and "All Complaints" nav tabs and moves Add/Import actions into the view.
 *
 *   Inspector / Super Admin  → "Mine" (assigned) by default; toggle to "All" (read-only)
 *   Admin / Program Manager  → "All" complaints directly, no toggle
 *
 * Routes: /complaints  /complaints/:id  /complaints/new  /complaints/import
 */

import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ClipboardList,
  ChevronLeft,
  FilePlus,
  Upload,
} from "lucide-react";
import ComplaintDetailView from "@/components/ComplaintDetailView";
import ComplaintSummaryCards from "@/components/ComplaintSummaryCards";
import ComplaintFilterBar from "@/components/ComplaintFilterBar";
import { SimpleTable } from "@/components/ui/SimpleTable";
import { exportToExcel } from "@/utils/exportExcel";
import { toast } from "sonner";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

type Complaint = any; // Properly type later

const ADMIN_ROLES = ["Admin", "Program Manager", "Super Admin"];
const CAN_CREATE_ROLES = ["Inspector", "Admin", "Super Admin"];
const MINE_TOGGLE_ROLES = ["Inspector", "Super Admin"];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { id: urlComplaintId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeRole = user?.role ?? "";
  const showMineToggle = MINE_TOGGLE_ROLES.includes(activeRole);
  const canCreate = CAN_CREATE_ROLES.includes(activeRole);
  const isAdmin = ADMIN_ROLES.includes(activeRole);
  const inspectorName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "";

  const [scope, setScope] = useState<"mine" | "all">(
    showMineToggle ? "mine" : "all",
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [hearingStatusFilter, setHearingStatusFilter] = useState(
    searchParams.get("hearingStatus") ?? "",
  );
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // ── Data fetching ───────────────────────────────────────────────────────────

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints", scope, inspectorName],
    queryFn: () =>
      complaintService.getAll(
        scope === "mine" ? { assigned_to: inspectorName } : {},
      ),
    enabled: !!user,
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    urlComplaintId || null,
  );
  const [showDetail, setShowDetail] = useState(!!urlComplaintId);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return complaints.find((c: any) => c.id === selectedId) || null;
  }, [selectedId, complaints]);

  // Fallback direct fetch for deep-link / refresh — handles cases where the
  // complaint isn't in the currently loaded list (different scope/filter).
  // Shares the ['complaint', id] cache key with ComplaintDetailView's own query,
  // so React Query deduplicates — no redundant network call.
  const { data: directComplaint } = useQuery({
    queryKey: ["complaint", urlComplaintId],
    queryFn: () => complaintService.getById(urlComplaintId!),
    enabled: !!urlComplaintId && !selected,
  });

  const effectiveSelected = selected || directComplaint || null;

  useEffect(() => {
    if (urlComplaintId) {
      setSelectedId(urlComplaintId);
      setShowDetail(true);
    }
  }, [urlComplaintId]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      complaintService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filtered = complaints.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (
      hearingStatusFilter &&
      (c.hearing_status ?? "None") !== hearingStatusFilter
    )
      return false;
    if (scope === "all" && inspectorFilter && c.assigned_to !== inspectorFilter)
      return false;
    if (dateRange?.from) {
      const entered = c.date_entered
        ? new Date(c.date_entered + "T00:00:00")
        : null;
      if (entered && entered < dateRange.from) return false;
    }
    if (dateRange?.to) {
      const entered = c.date_entered
        ? new Date(c.date_entered + "T00:00:00")
        : null;
      if (entered && entered > dateRange.to) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!c.address?.toLowerCase().includes(q) && !c.complaintid?.includes(q))
        return false;
    }
    return true;
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleScopeChange = (newScope: "mine" | "all") => {
    if (newScope === scope) return;
    setScope(newScope);
    setSelectedId(null);
    setShowDetail(false);
    setInspectorFilter("");
    navigate("/complaints", { replace: true });
  };

  const handleSelect = (c: Complaint) => {
    setSelectedId(c.id);
    setShowDetail(true);
    navigate(`/complaints/${c.id}`, { replace: true });
  };

  const handleStatusUpdate = async (updatedStatus: string) => {
    const targetId = selected?.id || urlComplaintId;
    if (!targetId) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: targetId,
        status: updatedStatus,
      });
      toast.success(`Status updated to ${updatedStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const actionButtons = (
    <div className="flex items-center gap-2 shrink-0">
      {canCreate && (
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={() => navigate("/complaints/new")}
        >
          <FilePlus className="w-3.5 h-3.5" /> New Complaint
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => navigate("/complaints/import")}
      >
        <Upload className="w-3.5 h-3.5" /> Import CSV
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mine / All scope toggle — Inspector and Super Admin only */}
      {showMineToggle && (
        <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-2 flex items-center gap-3">
            <div className="flex items-center bg-muted/60 border border-border rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => handleScopeChange("mine")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                  scope === "mine"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Complaints
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange("all")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                  scope === "all"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Complaints
              </button>
            </div>
            {scope === "all" && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Read-only view · all inspectors
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter bar with contextual action buttons */}
      <ComplaintFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        hearingStatusFilter={hearingStatusFilter}
        onHearingStatusChange={setHearingStatusFilter}
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        loading={isLoading}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        {...(scope === "all"
          ? { inspectorFilter, onInspectorChange: setInspectorFilter }
          : {})}
        actions={actionButtons}
      />

      <div className="container mx-auto px-4 sm:px-6 py-5 max-w-7xl">
        {!isLoading && complaints.length > 0 && scope === "all" && (
          <ComplaintSummaryCards complaints={complaints} />
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Complaint table */}
          <div
            className={`flex-1 min-w-0 ${showDetail ? "hidden lg:block" : ""}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading complaints...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No complaints found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <SimpleTable
                data={filtered}
                columns={[
                  { key: "complaintid", header: "ID" },
                  { key: "address", header: "Address" },
                  { key: "status", header: "Status" },
                  { key: "assigned_to", header: "Assigned To" },
                  {
                    key: "date_entered",
                    header: "Date",
                    render: (v) =>
                      v
                        ? format(
                            new Date((v as string) + "T00:00:00"),
                            "MMM d, yyyy",
                          )
                        : "-",
                  },
                  { key: "hearing_status", header: "Hearing" },
                ]}
                searchable={false}
                exportable={true}
                onExport={async () =>
                  await exportToExcel(
                    filtered,
                    [
                      { key: "complaintid", header: "Complaint ID" },
                      { key: "address", header: "Address" },
                      { key: "status", header: "Status" },
                      { key: "assigned_to", header: "Assigned To" },
                      { key: "date_entered", header: "Date Entered" },
                      { key: "hearing_status", header: "Hearing Status" },
                    ],
                    { fileName: "complaints" },
                  )
                }
                pageSize={10}
                onRowClick={(c) => handleSelect(c as Complaint)}
              />
            )}
          </div>

          {/* Detail panel */}
          <div
            className={`flex-1 min-w-0 ${showDetail ? "block" : "hidden md:block"}`}
          >
            {effectiveSelected ? (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedId(null);
                    navigate("/complaints", { replace: true });
                  }}
                  className="md:hidden mb-3 gap-1.5 -ml-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to list
                </Button>
                <ComplaintDetailView
                  key={effectiveSelected.id}
                  complaint={effectiveSelected}
                  onStatusUpdate={handleStatusUpdate}
                  viewMode={
                    isAdmin
                      ? "admin"
                      : scope === "mine"
                        ? "inspector"
                        : "readonly"
                  }
                />
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border">
                  <ClipboardList className="w-7 h-7 opacity-30" />
                </div>
                <p className="font-semibold text-foreground">
                  Select a complaint
                </p>
                <p className="text-sm mt-1.5 max-w-xs">
                  Click any complaint to view details, inspection history, and
                  documents.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
