/**
 * InspectorDashboardPage.tsx
 *
 * Two-column enterprise dashboard for inspectors:
 *   LEFT  — sticky KPI stat rail (collapses to 2×2 grid on mobile)
 *   RIGHT — prioritized feed panels with capped progressive disclosure
 *
 * UX fixes applied:
 *   • Hick's Law      — each panel caps at 5 rows; "Show all N" expands inline
 *   • Fitts's Law     — entire row is the click target (not just the chevron)
 *   • Jakob's Law     — stat rail flanks the scrollable feed (industry-standard split)
 *   • Aesthetic-Usability — three-tier type hierarchy per row; divide-y replaces per-card borders
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { inspectionService } from "@/services/inspectionService";
import {
  Loader2,
  ClipboardList,
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  ChevronRight,
  Clock,
  CheckCircle2,
  Bell,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTIVE_STATUSES, isOverdue } from "@/utils/complaintStatuses";
import { COMPLAINT_STATUS_THEME } from "@/utils/badgeThemes";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate } from "@/utils/formatDate";

type Complaint = any;
type AlertComplaint = any;

const PANEL_CAP = 5;

// ── Shared row component — full-width click target, three-tier typography ──────

function FeedRow({
  address,
  complaintId,
  meta,
  statusLabel,
  statusCls,
  leftSlot,
  urgent,
  onClick,
}: {
  address: string;
  complaintId?: string;
  meta: string;
  statusLabel?: string;
  statusCls?: string;
  leftSlot?: React.ReactNode;
  urgent?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors group
        ${urgent ? "hover:bg-destructive/5" : "hover:bg-muted/40"} active:bg-muted/60
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset`}
    >
      {leftSlot && <div className="shrink-0 w-9 text-center">{leftSlot}</div>}
      <div className="min-w-0 flex-1">
        {/* Tier 1 — address: dominant, semibold */}
        <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors">
          {address}
        </p>
        {/* Tiers 2 & 3 — ID badge + metadata on one line */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {complaintId && (
            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
              #{complaintId}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{meta}</span>
        </div>
      </div>
      {statusLabel && (
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 ${statusCls ?? "bg-muted text-muted-foreground"}`}
        >
          {statusLabel}
        </span>
      )}
      {/* Chevron pill — visual affordance only; entire row is the true target */}
      <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center shrink-0 transition-all group-hover:bg-primary group-hover:translate-x-0.5">
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
      </div>
    </div>
  );
}

// ── All-clear message ─────────────────────────────────────────────────────────

function AllClear({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-2.5">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ── Feed panel — handles capping, dividers, show-all toggle ──────────────────

function FeedPanel({
  icon,
  title,
  badge,
  badgeCls,
  borderCls,
  emptyContent,
  allRows,
  showAll,
  onToggleShowAll,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeCls?: string;
  borderCls?: string;
  emptyContent: React.ReactNode;
  allRows: React.ReactNode[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const visibleRows = showAll ? allRows : allRows.slice(0, PANEL_CAP);
  const hasMore = allRows.length > PANEL_CAP;

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden shadow-sm ${borderCls ?? "border-border"}`}
    >
      {/* Panel header */}
      <div
        className={`flex items-center gap-2 px-5 py-3 border-b ${borderCls ? "border-destructive/10" : "border-border/60"}`}
      >
        <span className="shrink-0 text-primary/70">{icon}</span>
        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
          {title}
        </h2>
        {badge && (
          <span
            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${badgeCls ?? "bg-primary/10 text-primary border-primary/20"}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Rows or empty state */}
      {allRows.length === 0 ? (
        <div className="px-5 py-4">{emptyContent}</div>
      ) : (
        <>
          {showAll && allRows.length > 8 ? (
            /* Expanded + long list — height-capped scroll region with fade */
            <div className="relative">
              <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto pr-2 feed-scroll">
                {visibleRows}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
          ) : (
            /* Collapsed or short list — flat rendering, no scroll */
            <div className="divide-y divide-border/40">{visibleRows}</div>
          )}
          {hasMore && (
            <div className="px-5 py-2.5 border-t border-border/60 bg-muted/20 text-center">
              <button
                type="button"
                onClick={onToggleShowAll}
                className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                {showAll ? `↑ Show fewer` : `Show all ${allRows.length} →`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InspectorDashboardPage({
  inspectorName,
}: {
  inspectorName: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Data fetching ───────────────────────────────────────────────────────────

  const {
    data: complaints = [],
    isLoading: complaintsLoading,
    refetch: refetchComplaints,
    isRefetching: refreshingComplaints,
  } = useQuery({
    queryKey: ["complaints", "assigned", inspectorName],
    queryFn: () => complaintService.getAll({ assigned_to: inspectorName }),
    enabled: !!inspectorName,
  });

  const {
    data: _allInspections = [],
    isLoading: inspectionsLoading,
    refetch: refetchInspections,
    isRefetching: refreshingInspections,
  } = useQuery({
    queryKey: ["inspections", "inspector", inspectorName],
    queryFn: () => inspectionService.getAll(), // TODO: filter by inspector
    enabled: !!inspectorName,
  });

  const loading = complaintsLoading || inspectionsLoading;
  const refreshing = refreshingComplaints || refreshingInspections;
  const fetchData = () => {
    refetchComplaints();
    refetchInspections();
  };

  // Progressive-disclosure state — each panel collapses independently
  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllNoContact, setShowAllNoContact] = useState(false);
  const [showAllReinspect, setShowAllReinspect] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-5 border-b border-border">
          <div className="space-y-1.5">
            <div className="h-6 w-56 bg-muted/60 rounded-lg animate-pulse" />
            <div className="h-4 w-36 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-5 py-6">
          <div className="hidden lg:block w-56 xl:w-64 shrink-0 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4 space-y-2 animate-pulse"
              >
                <div className="h-3 w-20 bg-muted/60 rounded" />
                <div className="h-8 w-12 bg-muted/40 rounded-lg" />
                <div className="h-3 w-28 bg-muted/40 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl overflow-hidden animate-pulse"
              >
                <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-muted/60 rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
                <div className="divide-y divide-border/40">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-3/4 bg-muted/50 rounded" />
                        <div className="h-3 w-1/2 bg-muted/30 rounded" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-muted/40" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = complaints.filter((c) =>
    (ACTIVE_STATUSES as readonly string[]).includes(c.status ?? ""),
  );
  const overdue = active.filter(isOverdue);

  const upcomingReinspections = active
    .filter((c) => {
      if (!c.reinspectionDueOnAfter) return false;
      const d = new Date(c.reinspectionDueOnAfter + "T00:00:00");
      const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) =>
      (a.reinspectionDueOnAfter ?? "").localeCompare(
        b.reinspectionDueOnAfter ?? "",
      ),
    );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    user?.firstName || inspectorName.split(" ")[0] || "Inspector";
  const alerts = {
    newAssignments: [] as AlertComplaint[],
    noContactAttempt: [] as AlertComplaint[],
    previousLastLogin: true,
  };
  const newAssignments = alerts.newAssignments;
  const noContactAttempt = alerts.noContactAttempt;

  function daysSince(dateStr?: string): number {
    if (!dateStr) return 0;
    return Math.floor(
      (today.getTime() - new Date(dateStr + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  // ── Pre-render all rows for each panel (keys live here) ──────────────────

  const newAssignmentRows = newAssignments.map((c: AlertComplaint) => (
    <FeedRow
      key={c.id}
      address={c.address ?? "—"}
      complaintId={c.complaintid}
      meta={
        c.dateAssigned
          ? `Assigned ${formatDate(c.dateAssigned)}`
          : "Recently assigned"
      }
      statusLabel={c.status ?? undefined}
      statusCls={
        COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME]
      }
      onClick={() => navigate(`/complaints/${c.id}`)}
    />
  ));

  const noContactRows = noContactAttempt.map((c: AlertComplaint) => {
    const days = daysSince(c.date_entered);
    return (
      <FeedRow
        key={c.id}
        address={c.address ?? "—"}
        complaintId={c.complaintid}
        meta={
          days > 0
            ? `Entered ${days} day${days !== 1 ? "s" : ""} ago · No contact logged`
            : "No contact logged"
        }
        onClick={() => navigate(`/complaints/${c.id}`)}
      />
    );
  });

  const reinspectRows = upcomingReinspections.map((c: Complaint) => {
    const daysOut = Math.round(
      (new Date(c.reinspectionDueOnAfter! + "T00:00:00").getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const urgent = daysOut <= 3;
    return (
      <FeedRow
        key={c.id}
        address={c.address ?? "—"}
        complaintId={c.complaintid}
        meta={`Due ${formatDate(c.reinspectionDueOnAfter)}`}
        statusLabel={c.status ?? undefined}
        statusCls={
          COMPLAINT_STATUS_THEME[
            c.status as keyof typeof COMPLAINT_STATUS_THEME
          ]
        }
        urgent={urgent}
        leftSlot={
          <div
            className={urgent ? "text-destructive" : "text-muted-foreground"}
          >
            <p className="text-base font-black tabular-nums leading-none">
              {daysOut}
            </p>
            <p className="text-[9px] uppercase tracking-wide leading-none mt-0.5">
              days
            </p>
          </div>
        }
        onClick={() => navigate(`/inspections/${c.id}`)}
      />
    );
  });

  const overdueRows = overdue.map((c: Complaint) => {
    const daysPast = Math.round(
      (today.getTime() -
        new Date(c.reinspectionDueOnAfter! + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return (
      <FeedRow
        key={c.id}
        address={c.address ?? "—"}
        complaintId={c.complaintid}
        meta={`Was due ${formatDate(c.reinspectionDueOnAfter)}`}
        urgent
        leftSlot={
          <div className="text-destructive">
            <p className="text-base font-black tabular-nums leading-none">
              {daysPast}
            </p>
            <p className="text-[9px] uppercase tracking-wide leading-none mt-0.5">
              past
            </p>
          </div>
        }
        onClick={() => navigate(`/inspections/${c.id}`)}
      />
    );
  });

  // ── Stat rail (reused on both mobile and desktop) ─────────────────────────

  const statCards = (
    <>
      <StatCard
        label="Active Cases"
        value={active.length}
        sub="Assigned to you"
        accent="blue"
        icon={<ClipboardList className="w-5 h-5" />}
        to="/complaints"
      />
      <StatCard
        label="New Assignments"
        value={newAssignments.length}
        sub="Since last login"
        accent={newAssignments.length > 0 ? "blue" : undefined}
        icon={<Bell className="w-5 h-5" />}
      />
      <StatCard
        label="No Contact Yet"
        value={noContactAttempt.length}
        sub="Contact Pending, no attempt"
        accent={noContactAttempt.length > 0 ? "yellow" : undefined}
        icon={<PhoneOff className="w-5 h-5" />}
      />
      <StatCard
        label="Overdue"
        value={overdue.length}
        sub="Past reinspection date"
        accent={overdue.length > 0 ? "red" : undefined}
        icon={<AlertTriangle className="w-5 h-5" />}
        to="/complaints"
      />
    </>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's your caseload at a glance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          disabled={refreshing}
          className="text-xs h-8 gap-1.5"
        >
          {refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
          Refresh
        </Button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 py-6">
        {/* ── LEFT: stat rail ─────────────────────────────────────────────
            Mobile  → 2×2 grid above feed, not sticky
            Desktop → vertical column, sticky alongside scrolling feed     */}

        {/* Mobile stat rail */}
        <div className="lg:hidden space-y-4">
          <div className="grid grid-cols-2 gap-3">{statCards}</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2 flex-1"
              onClick={() => navigate("/complaints")}
            >
              <ClipboardList className="w-4 h-4" /> My Complaints
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
              onClick={() => navigate("/inspections/new")}
            >
              <ClipboardCheck className="w-4 h-4" /> Start Inspection
            </Button>
          </div>
        </div>

        {/* Desktop sticky stat rail */}
        <div className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-[73px] space-y-3">
            {statCards}
            <div className="space-y-2 pt-1">
              <Button
                className="w-full gap-2 justify-start"
                size="sm"
                onClick={() => navigate("/complaints")}
              >
                <ClipboardList className="w-4 h-4" /> My Complaints
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
                size="sm"
                onClick={() => navigate("/inspections/new")}
              >
                <ClipboardCheck className="w-4 h-4" /> Start Inspection
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: feed panels ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* New Assignments */}
          <FeedPanel
            icon={<Bell className="w-3.5 h-3.5" />}
            title="New Assignments"
            badge={
              newAssignments.length > 0
                ? `${newAssignments.length} new`
                : undefined
            }
            allRows={newAssignmentRows}
            showAll={showAllNew}
            onToggleShowAll={() => setShowAllNew((v) => !v)}
            emptyContent={
              !alerts.previousLastLogin ? (
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-3">
                  <Bell className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                  New assignments will appear here after your next login.
                </div>
              ) : (
                <AllClear message="You're all caught up — no new assignments since last login." />
              )
            }
          />

          {/* No Contact Attempt */}
          <FeedPanel
            icon={<PhoneOff className="w-3.5 h-3.5" />}
            title="No Contact Attempt"
            badge={
              noContactAttempt.length > 0
                ? `${noContactAttempt.length} pending`
                : undefined
            }
            badgeCls="bg-accent/20 text-accent-foreground border-accent/30"
            allRows={noContactRows}
            showAll={showAllNoContact}
            onToggleShowAll={() => setShowAllNoContact((v) => !v)}
            emptyContent={
              <AllClear message="All contact-pending cases have a contact attempt logged." />
            }
          />

          {/* Upcoming Reinspections */}
          <FeedPanel
            icon={<Calendar className="w-3.5 h-3.5" />}
            title="Upcoming Reinspections (14 days)"
            badge={
              upcomingReinspections.length > 0
                ? `${upcomingReinspections.length} upcoming`
                : undefined
            }
            allRows={reinspectRows}
            showAll={showAllReinspect}
            onToggleShowAll={() => setShowAllReinspect((v) => !v)}
            emptyContent={
              <AllClear message="No upcoming reinspections in the next 14 days." />
            }
          />

          {/* Overdue Cases */}
          <FeedPanel
            icon={<Clock className="w-3.5 h-3.5" />}
            title="Overdue Cases"
            badge={overdue.length > 0 ? `${overdue.length} overdue` : undefined}
            badgeCls="bg-destructive/10 text-destructive border-destructive/20"
            borderCls={overdue.length > 0 ? "border-destructive/25" : undefined}
            allRows={overdueRows}
            showAll={showAllOverdue}
            onToggleShowAll={() => setShowAllOverdue((v) => !v)}
            emptyContent={<AllClear message="No overdue cases — great work!" />}
          />

          {/* Recent Submitted Inspections */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
                  Recent Inspections
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 -mr-1"
                onClick={() => navigate("/inspections")}
              >
                View all →
              </Button>
            </div>
            {_allInspections.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No submitted inspections yet.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {_allInspections.map((insp: any) => (
                  <div
                    key={insp.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Tier 1 */}
                      <p className="text-sm font-semibold text-foreground truncate">
                        {insp.facilityAddress ?? "—"}
                      </p>
                      {/* Tiers 2 & 3 */}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {insp.complaintid && (
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                            #{insp.complaintid}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {[
                            insp.inspection_type,
                            insp.inspection_date &&
                              formatDate(insp.inspection_date),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {insp.inspection_rating && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            insp.inspection_rating === "Satisfactory"
                              ? "bg-success/10 text-success"
                              : insp.inspection_rating === "Unsatisfactory"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {insp.inspection_rating}
                        </span>
                      )}
                      {insp.violation_count != null &&
                        insp.violation_count > 0 && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {insp.violation_count}v
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
