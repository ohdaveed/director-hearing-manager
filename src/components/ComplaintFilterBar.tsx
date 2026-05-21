/**
 * ComplaintFilterBar.tsx
 *
 * Shared sticky filter toolbar used by both MyComplaintsPage and AllComplaintsPage.
 * Renders status / hearing-status / optional-inspector dropdowns, a search box,
 * and a result count label.
 *
 * The parent page owns all filter state and passes handlers down, keeping this
 * component purely presentational with no internal state.
 */

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  ALL_COMPLAINT_STATUSES,
  HEARING_STATUS_OPTIONS,
} from "@/utils/complaintStatuses";
import { INSPECTORS } from "@/utils/inspectors";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import type { DateRange } from "react-day-picker";

type Props = {
  /** Current value of the status filter ('all' means no filter). */
  statusFilter: string;
  onStatusChange: (v: string) => void;

  /** Current value of the hearing-status filter. */
  hearingStatusFilter: string;
  onHearingStatusChange: (v: string) => void;

  /** Free-text search string for address or complaint ID. */
  search: string;
  onSearchChange: (v: string) => void;

  /** Number of complaints currently matching the active filters. */
  resultCount: number;

  /** Whether the data is still loading (shows 'Loading...' instead of count). */
  loading: boolean;

  /**
   * Optional inspector filter. Pass the current value + handler to show the
   * inspector dropdown (used on AllComplaintsPage). Omit to hide it
   * (used on MyComplaintsPage where the view is already scoped to one inspector).
   */
  inspectorFilter?: string;
  onInspectorChange?: (v: string) => void;

  /** Optional date range filter for filtering by date_entered. */
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;

  /** Optional slot rendered to the right of the count label (e.g. an Add button). */
  actions?: React.ReactNode;
};

export default function ComplaintFilterBar({
  statusFilter,
  onStatusChange,
  hearingStatusFilter,
  onHearingStatusChange,
  search,
  onSearchChange,
  resultCount,
  loading,
  inspectorFilter,
  onInspectorChange,
  onDateRangeChange,
  actions,
}: Props) {
  return (
    // Sticky bar positioned below the app header (top-[57px] matches header height)
    <div className="bg-card/95 backdrop-blur-sm border-b border-border shadow-sm sticky top-[57px] z-10">
      <div className="container mx-auto px-4 sm:px-6 py-2.5 max-w-[1300px]">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-2.5">
          {/* Status filter */}
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-52 h-8 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_COMPLAINT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Hearing status filter */}
          <Select
            value={hearingStatusFilter || "all"}
            onValueChange={(v) => onHearingStatusChange(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-48 h-8 text-sm">
              <SelectValue placeholder="Hearing status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hearing Statuses</SelectItem>
              {HEARING_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Inspector filter — only shown when inspectorFilter prop is provided */}
          {inspectorFilter !== undefined && onInspectorChange && (
            <Select
              value={inspectorFilter || "all"}
              onValueChange={(v) => onInspectorChange(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full sm:w-48 h-8 text-sm">
                <SelectValue placeholder="All inspectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inspectors</SelectItem>
                {INSPECTORS.map((inspector) => (
                  <SelectItem key={inspector.email} value={inspector.email}>
                    {inspector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Free-text search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search address or ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-8 text-sm w-full"
            />
          </div>

          {/* Date range filter */}
          {onDateRangeChange && (
            <DateRangePicker
              onChange={onDateRangeChange}
              className="w-full sm:w-auto"
            />
          )}

          {/* Result count */}
          <span className="text-sm text-muted-foreground tabular-nums sm:ml-auto">
            {loading
              ? "Loading..."
              : `${resultCount} complaint${resultCount !== 1 ? "s" : ""}`}
          </span>

          {/* Optional action slot (e.g. "Add Complaint" button) */}
          {actions}
        </div>
      </div>
    </div>
  );
}
