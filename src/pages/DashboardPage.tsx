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

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { complaintService } from '@/services/complaintService';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, Users, TrendingUp, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALL_COMPLAINT_STATUSES, ACTIVE_STATUSES, isOverdue } from '@/utils/complaintStatuses';
import { INSPECTORS } from '@/utils/inspectors';
import StatCard from '@/components/StatCard';
import { formatDate } from '@/utils/formatDate';

type Complaint = any; // Will be properly typed once types are updated


// ── Local helper functions ────────────────────────────────────────────────────

function isHearingReady(c: Complaint): boolean {
  return c.hearingStatus === 'Referred' || c.hearingStatus === 'Hearing Scheduled';
}

function monthKey(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
      <span className="text-primary/60 flex-shrink-0">{icon}</span>
      <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function HBar({ label, value, max, color = 'bg-primary' }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="group py-1.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors" title={label}>{label}</span>
        <span className="text-xs font-bold tabular-nums shrink-0 text-foreground">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color} opacity-75`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage({ role = 'Program Manager' }: { role?: string }) {
  const showHearings = role === 'Program Manager' || role === 'Super Admin';

  const { data: complaints = [], isLoading, isRefetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintService.getAll(),
    refetchInterval: 60_000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 max-w-[1300px]">
        <div className="flex items-center justify-between py-5 border-b border-border">
          <div className="space-y-1.5">
            <div className="h-6 w-32 bg-muted/60 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-5 py-6">
          <div className="hidden lg:block w-56 xl:w-64 shrink-0 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2 animate-pulse">
                <div className="h-[3px] w-full bg-muted/60 rounded" />
                <div className="h-3 w-20 bg-muted/60 rounded mt-2" />
                <div className="h-8 w-14 bg-muted/40 rounded-lg" />
                <div className="h-3 w-28 bg-muted/30 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 animate-pulse">
              <div className="h-4 w-48 bg-muted/60 rounded" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 bg-muted/30 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2 animate-pulse">
                  <div className="h-4 w-32 bg-muted/60 rounded" />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="h-3 w-24 bg-muted/40 rounded" />
                        <div className="h-3 w-6 bg-muted/40 rounded" />
                      </div>
                      <div className="h-1.5 bg-muted/30 rounded-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = complaints.filter(c => (ACTIVE_STATUSES as readonly string[]).includes(c.status ?? ''));
  const overdue = complaints.filter(isOverdue);
  const newThisMonth = complaints.filter(c => {
    if (!c.dateEntered) return false;
    const d = new Date(c.dateEntered + 'T00:00:00');
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const hearingReady = complaints.filter(isHearingReady);
  const hearingScheduled = complaints.filter(c => c.hearingStatus === 'Hearing Scheduled');

  const missingReinspDate = complaints.filter(
    c => c.status === 'Re-Inspection Due' && !c.reinspectionDueOnAfter
  );
  const missingAssignment = complaints.filter(
    c => (ACTIVE_STATUSES as readonly string[]).includes(c.status ?? '') && !c.assignedTo
  );

  const upcomingHearings = complaints.filter(c => {
    if (!c.hearingDate) return false;
    const hd = new Date(c.hearingDate + 'T00:00:00');
    const diff = (hd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 14;
  }).sort((a, b) => (a.hearingDate ?? '').localeCompare(b.hearingDate ?? ''));

  const byInspector = INSPECTORS.map(name => ({
    name,
    count: active.filter(c => c.assignedTo === name).length,
    overdue: overdue.filter(c => c.assignedTo === name).length,
  })).filter(i => i.count > 0).sort((a, b) => b.count - a.count);

  const maxInspectorCount = Math.max(...byInspector.map(i => i.count), 1);

  const byStatus = ALL_COMPLAINT_STATUSES.map(s => ({
    status: s,
    count: complaints.filter(c => c.status === s).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const maxStatusCount = Math.max(...byStatus.map(s => s.count), 1);

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
  }
  const monthlyIntake = months.map(m => ({
    month: m,
    count: complaints.filter(c => monthKey(c.dateEntered) === m).length,
  }));
  const maxMonthly = Math.max(...monthlyIntake.map(m => m.count), 1);

  const categoryMap: Record<string, number> = {};
  complaints.forEach(c => {
    (c.category ?? []).forEach(cat => {
      categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
    });
  });
  const byCategory = Object.entries(categoryMap)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxCategory = Math.max(...byCategory.map(c => c.count), 1);

  // ── Shared stat cards (rendered in both mobile and desktop rails) ───────────

  const statCards = (
    <>
      <StatCard label="Active" value={active.length} sub="Open complaints" accent="blue" />
      <StatCard label="Overdue" value={overdue.length} sub="Past reinspection date" accent={overdue.length > 0 ? 'red' : undefined} />
      <StatCard label="New This Month" value={newThisMonth.length} sub={today.toLocaleDateString('en-US', { month: 'long' })} />
      {showHearings && (
        <StatCard label="Hearing Ready" value={hearingReady.length} sub="Referred or scheduled" accent={hearingReady.length > 0 ? 'purple' : undefined} />
      )}
      {showHearings && (
        <StatCard label="Scheduled" value={hearingScheduled.length} sub="Director's hearings" accent={hearingScheduled.length > 0 ? 'yellow' : undefined} />
      )}
    </>
  );

  // ── Quality Checks panel (shared between mobile/desktop) ───────────────────

  const qualityChecksPanel = (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <SectionHeader icon={<AlertTriangle className="w-4 h-4" />} title="Quality Checks" />
      {missingReinspDate.length === 0 && missingAssignment.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          No data quality issues found.
        </div>
      ) : (
        <div className="space-y-3">
          {missingReinspDate.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">
                  {missingReinspDate.length} complaint{missingReinspDate.length !== 1 ? 's' : ''} — Re-Inspection Due but no date set
                </span>
              </div>
              <div className="space-y-1">
                {missingReinspDate.slice(0, 5).map(c => (
                  <p key={c.id} className="text-xs text-muted-foreground truncate">
                    <span className="font-mono text-primary">#{c.complaintId}</span> · {c.address}
                  </p>
                ))}
                {missingReinspDate.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{missingReinspDate.length - 5} more</p>
                )}
              </div>
            </div>
          )}
          {missingAssignment.length > 0 && (
            <div className="bg-warning/15 border border-warning/35 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">
                  {missingAssignment.length} active complaint{missingAssignment.length !== 1 ? 's' : ''} unassigned
                </span>
              </div>
              <div className="space-y-1">
                {missingAssignment.slice(0, 5).map(c => (
                  <p key={c.id} className="text-xs text-muted-foreground truncate">
                    <span className="font-mono text-primary">#{c.complaintId}</span> · {c.address}
                  </p>
                ))}
                {missingAssignment.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{missingAssignment.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-[1300px]">

      {/* Page header */}
      <div className="flex items-center justify-between py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {complaints.length.toLocaleString()} total complaints
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRefetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="text-xs h-8 gap-1.5">
            {isRefetching && <Loader2 className="w-3 h-3 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 py-6">

        {/* ── Mobile stat rail (2×2 grid + quality checks above feed) ──── */}
        <div className="lg:hidden space-y-4">
          <div className={`grid gap-3 ${showHearings ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {statCards}
          </div>
          {qualityChecksPanel}
        </div>

        {/* ── Desktop sticky stat rail ───────────────────────────────────── */}
        <div className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-[73px] space-y-3">
            {statCards}
            <div className="pt-1">
              {qualityChecksPanel}
            </div>
          </div>
        </div>

        {/* ── RIGHT: scrollable feed ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Upcoming Hearings */}
          {showHearings && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <SectionHeader icon={<Calendar className="w-4 h-4" />} title="Upcoming Hearings (14 days)" />
              {upcomingHearings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hearings scheduled in the next 14 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingHearings.map(c => {
                    const daysOut = Math.round(
                      (new Date(c.hearingDate! + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                        daysOut <= 3 ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/40 border-border'
                      }`}>
                        <div className={`text-center w-10 shrink-0 ${daysOut <= 3 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          <p className="text-lg font-black tabular-nums leading-none">{daysOut}</p>
                          <p className="text-[9px] uppercase tracking-wide">days</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{c.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.complaintId && <span className="font-mono">#{c.complaintId} · </span>}
                            {formatDate(c.hearingDate)}
                          </p>
                        </div>
                        <span className="text-xs text-accent-foreground bg-accent/40 px-1.5 py-0.5 rounded-full shrink-0">
                          {c.hearingStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Charts row — workload, status distribution, top categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <SectionHeader icon={<Users className="w-4 h-4" />} title="Inspector Workload" />
              {byInspector.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active assignments.</p>
              ) : (
                <div>
                  {byInspector.map(i => (
                    <div key={i.name}>
                      <HBar
                        label={i.name.replace(' (DPH)', '')}
                        value={i.count}
                        max={maxInspectorCount}
                        color={i.overdue > 0 ? 'bg-destructive' : 'bg-primary'}
                      />
                      {i.overdue > 0 && (
                        <p className="text-[10px] text-destructive text-right -mt-0.5 mb-1 pr-0.5">
                          {i.overdue} overdue
                        </p>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-3">Red bars indicate inspector has overdue cases.</p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <SectionHeader icon={<BarChart3 className="w-4 h-4" />} title="Status Distribution" />
              <div>
                {byStatus.map(s => (
                  <HBar key={s.status} label={s.status} value={s.count} max={maxStatusCount} />
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <SectionHeader icon={<BarChart3 className="w-4 h-4" />} title="Top Categories" />
              <div>
                {byCategory.map(c => (
                  <HBar key={c.cat} label={c.cat} value={c.count} max={maxCategory} color="bg-chart-4" />
                ))}
              </div>
            </div>
          </div>

          {/* Monthly intake bar chart */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Monthly Intake (Last 6 Months)" />
            <div className="flex items-end gap-2 sm:gap-3" style={{ height: 100 }}>
              {monthlyIntake.map(m => {
                const pct = maxMonthly > 0 ? (m.count / maxMonthly) * 100 : 0;
                const isCurrentMonth = m.month === today.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group" title={`${m.month}: ${m.count}`}>
                    <span className={`text-xs font-bold tabular-nums transition-colors ${isCurrentMonth ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {m.count > 0 ? m.count : ''}
                    </span>
                    <div className="w-full flex items-end flex-1">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isCurrentMonth ? 'bg-primary opacity-90' : 'bg-muted-foreground/25 group-hover:bg-muted-foreground/40'
                        }`}
                        style={{ height: `${Math.max(pct, m.count > 0 ? 6 : 0)}%`, minHeight: m.count > 0 ? 4 : 0 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-nowrap">
                      {m.month.replace(' ', '\u00A0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
