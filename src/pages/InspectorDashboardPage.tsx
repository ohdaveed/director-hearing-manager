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
import { cn } from "@/lib/utils";
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
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACTIVE_STATUSES, isOverdue } from "@/utils/complaintStatuses";
import { COMPLAINT_STATUS_THEME } from "@/utils/badgeThemes";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate } from "@/utils/formatDate";

import { Database } from "@/types/database";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
type AlertComplaint = Database["public"]["Tables"]["complaints"]["Row"];
type Inspection = Database["public"]["Tables"]["inspections"]["Row"];

const PANEL_CAP = 5;

// ── Shared row component — semantic, modular, three-tier typography ──────────

function FeedRow({
  title,
  subtitle,
  id,
  status,
  statusCls,
  leftSlot,
  urgent,
  onClick,
}: {
  title: string;
  subtitle: string;
  id?: string;
  status?: string;
  statusCls?: string;
  leftSlot?: React.ReactNode;
  urgent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3.5 px-5 py-3 text-left transition-all group",
        urgent ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/50",
        "active:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      {leftSlot && <div className="shrink-0 w-8 pt-0.5">{leftSlot}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {id && (
            <span className="text-[10px] font-mono font-bold text-primary/60 bg-primary/5 px-1 rounded border border-primary/10">
              #{id}
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
            {subtitle}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
        {status && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-4.5 px-1.5 font-bold border-none shadow-none",
              statusCls ?? "bg-muted text-muted-foreground",
            )}
          >
            {status}
          </Badge>
        )}
        <ChevronRight className="size-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

// ── Feed panel — handles capping, dividers, show-all toggle ──────────────────

function FeedPanel({
  icon,
  title,
  badge,
  badgeCls,
  borderCls,
  emptyMessage,
  allRows,
  showAll,
  onToggleShowAll,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeCls?: string;
  borderCls?: string;
  emptyMessage?: string;
  allRows: React.ReactNode[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const visibleRows = showAll ? allRows : allRows.slice(0, PANEL_CAP);
  const hasMore = allRows.length > PANEL_CAP;

  if (allRows.length === 0 && !emptyMessage) return null;

  return (
    <Card size="sm" className={cn("overflow-hidden shadow-sm", borderCls)}>
      <CardHeader className="border-b border-border/60 py-2.5">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-primary/60">{icon}</span>
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {badge && (
          <CardAction>
            <Badge variant="outline" className={cn("text-[10px] font-bold h-4 px-1.5 border-none bg-muted", badgeCls)}>
              {badge}
            </Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {allRows.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <div className="inline-flex items-center justify-center size-8 rounded-full bg-success/10 text-success mb-2">
              <CheckCircle2 className="size-4" />
            </div>
            <p className="text-xs font-medium text-muted-foreground px-4">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {showAll && allRows.length > 8 ? (
              <div className="relative">
                <div className="max-h-[480px] overflow-y-auto pr-2 feed-scroll">
                  {visibleRows}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              </div>
            ) : (
              visibleRows
            )}
          </div>
        )}
      </CardContent>

      {hasMore && (
        <CardFooter className="p-0 border-t border-border/60 bg-muted/20">
          <button
            type="button"
            onClick={onToggleShowAll}
            className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
          >
            {showAll ? `Show fewer` : `Show all ${allRows.length}`}
          </button>
        </CardFooter>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InspectorDashboardPage({ inspectorName }: { inspectorName: string }) {
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
    void refetchComplaints();
    void refetchInspections();
  };

  // Progressive-disclosure state — each panel collapses independently
  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllNoContact, setShowAllNoContact] = useState(false);
  const [showAllReinspect, setShowAllReinspect] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllInspections, setShowAllInspections] = useState(false);

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
                    <div key={j} className="flex items-center gap-4 px-5 py-3.5">
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
      if (!c.reinspection_due_on_after) return false;
      const d = new Date(c.reinspection_due_on_after + "T00:00:00");
      const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) =>
      (a.reinspection_due_on_after ?? "").localeCompare(b.reinspection_due_on_after ?? ""),
    );

  const firstName = user?.firstName || inspectorName.split(" ")[0] || "Inspector";
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
      (today.getTime() - new Date(dateStr + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // ── Pre-render all rows for each panel (keys live here) ──────────────────

  const newAssignmentRows = newAssignments.map((c: AlertComplaint) => (
    <FeedRow
      key={c.id}
      title={(c.address as any) ?? "—"}
      id={(c.complaintid as any) || undefined}
      subtitle={c.date_assigned ? `Assigned ${formatDate(c.date_assigned)}` : "Recently assigned"}
      status={(c.status as any) ?? undefined}
      statusCls={COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME]}
      onClick={() => navigate(`/complaints/${c.id}`)}
    />
  ));

  const noContactRows = noContactAttempt.map((c: AlertComplaint) => {
    const days = daysSince(c.date_entered || undefined);
    return (
      <FeedRow
        key={c.id}
        title={(c.address as any) ?? "—"}
        id={(c.complaintid as any) || undefined}
        subtitle={
          days > 0
            ? `Entered ${days} day${days !== 1 ? "s" : ""} ago`
            : "No contact logged"
        }
        status="Contact Pending"
        statusCls="bg-warning/10 text-warning"
        onClick={() => navigate(`/complaints/${c.id}`)}
      />
    );
  });

  const reinspectRows = upcomingReinspections.map((c: Complaint) => {
    const daysOut = Math.round(
      (new Date(c.reinspection_due_on_after! + "T00:00:00").getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const urgent = daysOut <= 3;
    return (
      <FeedRow
        key={c.id}
        title={(c.address as any) ?? "—"}
        id={(c.complaintid as any) || undefined}
        subtitle={`Due ${formatDate(c.reinspection_due_on_after!)}`}
        status={(c.status as any) ?? undefined}
        statusCls={COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME]}
        urgent={urgent}
        leftSlot={
          <div className={cn("flex flex-col items-center leading-none", urgent ? "text-destructive" : "text-muted-foreground/60")}>
            <span className="text-sm font-black tabular-nums">{daysOut}</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter">days</span>
          </div>
        }
        onClick={() => navigate(`/inspections/${c.id}`)}
      />
    );
  });

  const overdueRows = overdue.map((c: Complaint) => {
    const daysPast = Math.round(
      (today.getTime() - new Date(c.reinspection_due_on_after! + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return (
      <FeedRow
        key={c.id}
        title={(c.address as any) ?? "—"}
        id={(c.complaintid as any) || undefined}
        subtitle={`Was due ${formatDate(c.reinspection_due_on_after!)}`}
        urgent
        leftSlot={
          <div className="flex flex-col items-center leading-none text-destructive">
            <span className="text-sm font-black tabular-nums">{daysPast}</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter">past</span>
          </div>
        }
        onClick={() => navigate(`/inspections/${c.id}`)}
      />
    );
  });

  const inspectionRows = (_allInspections as Inspection[]).map((insp) => (
    <FeedRow
      key={insp.inspection_id}
      title={insp.facility_address ?? "—"}
      id={insp.complaint_id?.toString()}
      subtitle={[
        insp.inspection_type,
        insp.inspection_date && formatDate(insp.inspection_date),
      ]
        .filter(Boolean)
        .join(" · ")}
      status={insp.inspection_rating ?? undefined}
      statusCls={
        insp.inspection_rating === "Satisfactory"
          ? "bg-success/10 text-success"
          : insp.inspection_rating === "Unsatisfactory"
            ? "bg-destructive/10 text-destructive"
            : undefined
      }
      onClick={() => navigate(`/inspections/${insp.inspection_id}`)}
    />
  ));

  // ── Stat rail (reused on both mobile and desktop) ─────────────────────────

  const statCards = (
    <>
      <StatCard
        label="Active Cases"
        value={active.length}
        sub="Assigned"
        accent="blue"
        icon={<ClipboardList />}
        to="/complaints"
      />
      <StatCard
        label="New"
        value={newAssignments.length}
        sub="Since Login"
        accent={newAssignments.length > 0 ? "blue" : undefined}
        icon={<Bell />}
      />
      <StatCard
        label="Pending"
        value={noContactAttempt.length}
        sub="No Contact"
        accent={noContactAttempt.length > 0 ? "yellow" : undefined}
        icon={<PhoneOff />}
      />
      <StatCard
        label="Overdue"
        value={overdue.length}
        sub="Immediate Action"
        accent={overdue.length > 0 ? "red" : undefined}
        icon={<AlertTriangle />}
        to="/complaints"
      />
    </>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-6 border-b border-border mb-2">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground font-medium border-l border-border pl-2">
            {firstName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={refreshing}
            className="text-[10px] font-bold uppercase tracking-widest h-8"
          >
            {refreshing ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
            Sync
          </Button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 py-6">
        {/* ── LEFT: stat rail ───────────────────────────────────────────── */}

        {/* Mobile stat rail */}
        <div className="lg:hidden flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">{statCards}</div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => navigate("/complaints")}>
              <ClipboardList data-icon="inline-start" /> My Complaints
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-bold uppercase tracking-widest text-[10px]"
              onClick={() => navigate("/inspections/new")}
            >
              <FilePlus data-icon="inline-start" /> Start New
            </Button>
          </div>
        </div>

        {/* Desktop sticky stat rail */}
        <div className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-[73px] flex flex-col gap-3">
            {statCards}
            <div className="flex flex-col gap-2 pt-1 border-t border-border/40 mt-1">
              <Button
                className="w-full justify-start font-bold uppercase tracking-widest text-[10px]"
                size="sm"
                onClick={() => navigate("/complaints")}
              >
                <ClipboardList data-icon="inline-start" /> My Complaints
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-bold uppercase tracking-widest text-[10px]"
                size="sm"
                onClick={() => navigate("/inspections/new")}
              >
                <FilePlus data-icon="inline-start" /> Start New
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: feed panels ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* New Assignments */}
          <FeedPanel
            icon={<Bell />}
            title="New Assignments"
            badge={newAssignments.length > 0 ? `${newAssignments.length} new` : undefined}
            allRows={newAssignmentRows}
            showAll={showAllNew}
            onToggleShowAll={() => setShowAllNew((v) => !v)}
            emptyMessage={alerts.previousLastLogin ? "You're caught up — no new assignments." : "New assignments will appear here after your next login."}
          />

          {/* No Contact Attempt */}
          <FeedPanel
            icon={<PhoneOff />}
            title="No Contact Attempt"
            badge={noContactAttempt.length > 0 ? `${noContactAttempt.length} pending` : undefined}
            badgeCls="bg-warning/10 text-warning"
            allRows={noContactRows}
            showAll={showAllNoContact}
            onToggleShowAll={() => setShowAllNoContact((v) => !v)}
            emptyMessage="All contact-pending cases have a logged attempt."
          />

          {/* Upcoming Reinspections */}
          <FeedPanel
            icon={<Calendar />}
            title="Upcoming (14 days)"
            badge={upcomingReinspections.length > 0 ? `${upcomingReinspections.length} total` : undefined}
            allRows={reinspectRows}
            showAll={showAllReinspect}
            onToggleShowAll={() => setShowAllReinspect((v) => !v)}
            emptyMessage="No upcoming reinspections in the next 14 days."
          />

          {/* Overdue Cases */}
          <FeedPanel
            icon={<Clock />}
            title="Overdue"
            badge={overdue.length > 0 ? `${overdue.length} cases` : undefined}
            badgeCls="bg-destructive/10 text-destructive"
            borderCls={overdue.length > 0 ? "border-destructive/20 ring-1 ring-destructive/5" : undefined}
            allRows={overdueRows}
            showAll={showAllOverdue}
            onToggleShowAll={() => setShowAllOverdue((v) => !v)}
            emptyMessage="No overdue cases — excellent."
          />

          {/* Recent Submitted Inspections */}
          <FeedPanel
            icon={<ClipboardCheck />}
            title="Recent Inspections"
            allRows={inspectionRows}
            showAll={showAllInspections}
            onToggleShowAll={() => setShowAllInspections((v) => !v)}
            emptyMessage="No submitted inspections yet."
          />
        </div>
      </div>
    </div>
  );
}
