/**
 * ComplaintsPage.tsx
 *
 * Unified complaint list for all roles — replaces the old "My Complaints"
 * and "All Complaints" nav tabs and moves Add/Import actions into the view.
 *
 *   Inspector / Super Admin  → "Mine" vs "All" toggle
 *   Others                   → "All" only (read-only list)
 */

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ClipboardList, FilePlus, Upload } from "lucide-react";
import ComplaintDetailView from "@/components/ComplaintDetailView";
import ComplaintFilterBar from "@/components/ComplaintFilterBar";
import { SimpleTable } from "@/components/ui/SimpleTable";
import { exportToExcel } from "@/utils/exportExcel";
import { INSPECTORS } from "@/utils/inspectors";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Database } from "@/types/database";
import { toast } from "sonner";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];

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
  const inspectorId = user?.email || "";

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
    queryKey: ["complaints", scope, inspectorId],
    queryFn: () =>
      complaintService.getAll(
        scope === "mine" ? { assigned_to: inspectorId } : {},
      ),
    enabled: !!user,
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    urlComplaintId || null,
  );
  const [showDetail, setShowDetail] = useState(!!urlComplaintId);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      complaintService.update(id, { status: status as any }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelect = (complaint: Complaint) => {
    setSelectedId(complaint.id);
    setShowDetail(true);
    // Silent update of URL so back/refresh work
    window.history.replaceState(null, "", `/complaints/${complaint.id}`);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedId(null);
    window.history.replaceState(null, "", "/complaints");
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setHearingStatusFilter("");
    setInspectorFilter("");
    setSearch("");
    setDateRange(undefined);
  };

  // ── Memoized Filtering ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = [...complaints];

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (hearingStatusFilter) {
      result = result.filter((c) => c.hearing_status === hearingStatusFilter);
    }
    if (inspectorFilter && inspectorFilter !== "all") {
      result = result.filter((c) => c.assigned_to === inspectorFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.address?.toLowerCase().includes(lower) ||
          c.legacy_complaint_id?.toLowerCase().includes(lower),
      );
    }
    if (dateRange?.from) {
      result = result.filter((c) => {
        if (!c.date_entered) return false;
        const d = new Date(c.date_entered);
        if (dateRange.to) {
          return d >= dateRange.from! && d <= dateRange.to;
        }
        return d >= dateRange.from!;
      });
    }

    return result;
  }, [
    complaints,
    statusFilter,
    hearingStatusFilter,
    inspectorFilter,
    search,
    dateRange,
  ]);

  const effectiveSelected = complaints.find((c) => c.id === selectedId);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-1 min-h-0">
        <div
          className={`flex-1 flex flex-col min-w-0 border-r ${
            showDetail ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Complaints
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scope === "mine" ? "Assigned to you" : "System-wide view"}
                  </p>
                </div>
              </div>

              {canCreate && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/complaints/import")}
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    IMPORT CSV
                  </button>
                  <button
                    onClick={() => navigate("/complaints/new")}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    NEW COMPLAINT
                  </button>
                </div>
              )}
            </div>

            {showMineToggle && (
              <div className="inline-flex p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setScope("mine")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    scope === "mine"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Complaints
                </button>
                <button
                  onClick={() => setScope("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    scope === "all"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Complaints
                </button>
              </div>
            )}
          </div>

          {/* Sticky filter bar */}
          <ComplaintFilterBar
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            hearingStatusFilter={hearingStatusFilter}
            onHearingStatusChange={setHearingStatusFilter}
            inspectorFilter={inspectorFilter}
            onInspectorChange={setInspectorFilter}
            search={search}
            onSearchChange={setSearch}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            resultCount={filtered.length}
            loading={isLoading}
            actions={
              (search || statusFilter || inspectorFilter) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Reset
                </button>
              )
            }
          />

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-20" />
                <p className="text-sm font-medium">Loading complaints...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl animate-in fade-in zoom-in-95 duration-500">
                <ClipboardList className="w-12 h-12 mb-4 opacity-10" />
                <h3 className="text-lg font-medium text-foreground">
                  No complaints found
                </h3>
                <p className="text-sm mt-1.5 max-w-xs text-center">
                  {search || statusFilter || inspectorFilter
                    ? "Try adjusting your filters or search terms."
                    : "There are no complaints to display in this view."}
                </p>
                {(search || statusFilter || inspectorFilter) && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-6 text-sm text-primary font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <SimpleTable
                data={filtered}
                columns={
                  [
                    { key: "legacy_complaint_id", header: "ID" },
                    { key: "address", header: "Address" },
                    { key: "status", header: "Status" },
                    {
                      key: "assigned_to",
                      header: "Assigned To",
                      render: (v: any) =>
                        INSPECTORS.find((i) => i.email === v)?.name ||
                        (v as string),
                    },
                    {
                      key: "date_entered",
                      header: "Date Entered",
                      render: (v: any) =>
                        v
                          ? format(
                              new Date((v as string) + "T00:00:00"),
                              "MMM d, yyyy",
                            )
                          : "-",
                    },
                    { key: "hearing_status", header: "Hearing" },
                  ] as any
                }
                searchable={false}
                exportable={true}
                onExport={async () =>
                  await exportToExcel(
                    filtered as any,
                    [
                      { key: "legacy_complaint_id", header: "ID" },
                      { key: "address", header: "Address" },
                      { key: "status", header: "Status" },
                      {
                        key: "assigned_to",
                        header: "Assigned To",
                        formatter: (v: any) =>
                          INSPECTORS.find((i) => i.email === v)?.name ||
                          (v as string),
                      },
                      { key: "date_entered", header: "Date Entered" },
                      { key: "hearing_status", header: "Hearing Status" },
                    ] as any,
                    { fileName: "complaints" },
                  )
                }
                pageSize={10}
                onRowClick={(c) => handleSelect(c as Complaint)}
              />
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div
          className={`flex-1 min-w-0 ${
            showDetail ? "block" : "hidden md:block"
          }`}
        >
          {effectiveSelected ? (
            <div className="h-full flex flex-col">
              <div className="lg:hidden p-4 border-b flex items-center bg-background">
                <button
                  onClick={handleCloseDetail}
                  className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>
                <span className="ml-2 font-medium">Complaint Details</span>
              </div>
              <div className="flex-1 overflow-auto">
                <ComplaintDetailView
                  complaint={effectiveSelected as any}
                  onStatusUpdate={(status) =>
                    updateStatusMutation.mutate({
                      id: effectiveSelected.id,
                      status,
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20 p-8 text-center animate-in fade-in duration-700">
              <div className="p-4 bg-background rounded-full shadow-sm mb-6">
                <ClipboardList className="w-12 h-12 opacity-10" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Select a complaint
              </h3>
              <p className="text-sm mt-1.5 max-w-xs">
                Click any complaint to view details, inspection history, and
                documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
