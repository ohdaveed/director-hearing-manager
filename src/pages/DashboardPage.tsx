/**
 * DashboardPage.tsx
 *
 * Admin / Program Manager dashboard showing aggregate metrics, quality checks,
 * upcoming hearings, workload distribution, status breakdown, and monthly intake.
 *
 * Rendered for roles: Admin, Program Manager, Super Admin.
 * Inspectors see InspectorDashboardPage instead (see App.tsx).
 *
 * Layout: two-column (mirrors InspectorDashboardPage)
 *   LEFT  — sticky KPI stat rail + Quality Checks (collapses to 2×2 grid on mobile)
 *   RIGHT — Upcoming Hearings, chart cards, monthly intake
 */

import { useQuery } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ALL_COMPLAINT_STATUSES,
  ACTIVE_STATUSES,
  isOverdue,
} from "@/utils/complaintStatuses";
import { INSPECTORS } from "@/utils/inspectors";
import { StatCard } from "@/components/ui/stat-card";
import QualityChecksPanel from "@/components/dashboard/QualityChecksPanel";
import UpcomingHearingsPanel from "@/components/dashboard/UpcomingHearingsPanel";
import {
  DashboardBarChart,
  DashboardPieChart,
  DashboardLineChart,
} from "@/components/ui/Charts";
import { Database } from "@/types/database";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];

function isHearingReady(c: Complaint): boolean {
  return (
    c.hearing_status === "Referred" || c.hearing_status === "Hearing Scheduled"
  );
}

function monthKey(dateStr?: string | null): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export default function DashboardPage({
  role = "Program Manager",
}: {
  role?: string;
}) {
  const showHearings = role === "Program Manager" || role === "Super Admin";

  const {
    data: complaints = [],
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["complaints"],
    queryFn: () => complaintService.getAll(),
    refetchInterval: 60_000,
  });

  const today = new Date();
  const active = complaints.filter((c) =>
    (ACTIVE_STATUSES as readonly string[]).includes(c.status ?? ""),
  );
  const overdue = complaints.filter(isOverdue);
  const newThisMonth = complaints.filter((c) => {
    if (!c.date_entered) return false;
    const d = new Date(c.date_entered + "T00:00:00");
    return (
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const hearingReady = complaints.filter(isHearingReady);
  const hearingScheduled = complaints.filter(
    (c) => c.hearing_status === "Hearing Scheduled",
  );

  const missingReinspDate = complaints.filter(
    (c) => c.status === "Re-Inspection Due" && !c.reinspection_due_on_after,
  );
  const missingAssignment = complaints.filter(
    (c) =>
      (ACTIVE_STATUSES as readonly string[]).includes(c.status ?? "") &&
      !c.assigned_to,
  );

  const upcomingHearings = complaints
    .filter((c) => {
      if (!c.hearing_date) return false;
      const hd = new Date(c.hearing_date + "T00:00:00");
      const diff = (hd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => (a.hearing_date ?? "").localeCompare(b.hearing_date ?? ""));

  const byInspector = INSPECTORS.map((inspector) => ({
    name: inspector.name,
    count: active.filter(
      (c) =>
        c.assigned_to === inspector.email || c.assigned_to === inspector.name,
    ).length,
    overdue: overdue.filter(
      (c) =>
        c.assigned_to === inspector.email || c.assigned_to === inspector.name,
    ).length,
  }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count);

  const byStatus = ALL_COMPLAINT_STATUSES.map((s) => ({
    status: s,
    count: complaints.filter((c) => c.status === s).length,
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
    );
  }
  const monthlyIntake = months.map((m) => ({
    month: m,
    count: complaints.filter((c) => monthKey(c.date_entered) === m).length,
  }));
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    (c.category ?? []).forEach((cat: any) => {
      categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
    });
  });
  const byCategory = Object.entries(categoryMap)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between py-5 border-b border-border">
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-muted/60 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = (
    <>
      <StatCard
        label="Active"
        value={active.length}
        sub="Open complaints"
        accent="blue"
        to={`/complaints?status=active`}
      />
      <StatCard
        label="Overdue"
        value={overdue.length}
        sub="Past reinspection date"
        accent={overdue.length > 0 ? "red" : undefined}
        to={`/complaints?status=overdue`}
      />
      <StatCard
        label="New This Month"
        value={newThisMonth.length}
        sub={today.toLocaleDateString("en-US", { month: "long" })}
        to={`/complaints?status=new`}
      />
      {showHearings && (
        <StatCard
          label="Hearing Ready"
          value={hearingReady.length}
          sub="Referred or scheduled"
          accent={hearingReady.length > 0 ? "purple" : undefined}
          to={`/complaints?hearingStatus=Referred`}
        />
      )}
      {showHearings && (
        <StatCard
          label="Scheduled"
          value={hearingScheduled.length}
          sub="Director's hearings"
          accent={hearingScheduled.length > 0 ? "yellow" : undefined}
          to={`/complaints?hearingStatus=Hearing+Scheduled`}
        />
      )}
    </>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {complaints.length.toLocaleString()} total complaints
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRefetching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated{" "}
              {new Date(dataUpdatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs h-8 gap-1.5"
          >
            {isRefetching && <Loader2 className="w-3 h-3 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-3 content-start">
          {statCards}
          <QualityChecksPanel
            missingReinspDate={missingReinspDate as any}
            missingAssignment={missingAssignment as any}
          />
        </div>

        {/* ── RIGHT: scrollable feed ──────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">
          {/* Upcoming Hearings */}
          {showHearings && (
            <UpcomingHearingsPanel
              hearings={upcomingHearings as any}
              today={today}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Workload by Inspector
              </h3>
              <DashboardBarChart
                data={byInspector.map((i) => ({
                  name: i.name.split(" ")[0],
                  count: i.count,
                }))}
                xAxisKey="name"
                dataKey="count"
                height={220}
              />
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Status Distribution
              </h3>
              <DashboardPieChart
                data={byStatus.map((s) => ({ name: s.status, value: s.count }))}
                nameKey="name"
                dataKey="value"
                height={220}
              />
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Top Categories
              </h3>
              <DashboardBarChart
                data={byCategory.map((c) => ({ name: c.cat, count: c.count }))}
                xAxisKey="name"
                dataKey="count"
                height={220}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Monthly Intake
            </h3>
            <DashboardLineChart
              data={monthlyIntake.map((m) => ({
                date: m.month,
                count: m.count,
              }))}
              xAxisKey="date"
              dataKey="count"
              height={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
