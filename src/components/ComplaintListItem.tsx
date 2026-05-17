import { memo, useState } from "react";
import { COMPLAINT_STATUS_THEME } from "@/utils/badgeThemes";
import { Loader2, ArrowRight, MapPin, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Complaint = {
  id: string;
  complaintid?: string;
  address?: string;
  status?: string;
  assigned_to?: string;
  date_entered?: string;
  category?: string[];
  location?: string;
  locationRecordId?: string;
};

const QUICK_ACTION_MAP: Record<string, { label: string; nextStatus: string }> =
  {
    New: { label: "Schedule", nextStatus: "Inspection Scheduled" },
    "Contact Pending": {
      label: "Schedule",
      nextStatus: "Inspection Scheduled",
    },
    "Re-Inspection Due": {
      label: "Re-Schedule",
      nextStatus: "Inspection Scheduled",
    },
    "NOV Issued": { label: "Set Re-Insp.", nextStatus: "Re-Inspection Due" },
  };

type Props = {
  complaint: Complaint;
  isSelected: boolean;
  onClick: () => void;
  onQuickAction?: (newStatus: string) => Promise<void>;
  onLinkLocation?: () => void;
};

const ComplaintListItem = memo(function ComplaintListItem({
  complaint: c,
  isSelected,
  onClick,
  onQuickAction,
  onLinkLocation,
}: Props) {
  const navigate = useNavigate();
  const statusCls =
    COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME] ??
    "bg-muted text-muted-foreground";
  const quickAction = c.status ? QUICK_ACTION_MAP[c.status] : undefined;
  const [actionLoading, setActionLoading] = useState(false);

  const handleQuickAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quickAction || !onQuickAction) return;
    setActionLoading(true);
    try {
      await onQuickAction(quickAction.nextStatus);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (c.location) navigate(`/locations/${c.location}`);
  };

  const handleLinkLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    onLinkLocation?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-full text-left rounded-xl border transition-all group cursor-pointer
        ${
          isSelected
            ? "border-primary/50 bg-primary/5 shadow-md"
            : "border-border/80 bg-card/80 shadow-sm hover:shadow-md hover:border-border"
        }`}
    >
      <div className="flex rounded-xl overflow-hidden">
        {/* Selected-state accent strip */}
        <div
          className={`w-[3px] flex-shrink-0 transition-all ${isSelected ? "bg-primary" : "bg-transparent"}`}
        />

        <div className="flex-1 px-4 py-3.5 min-w-0 space-y-2.5">
          {/* Row 1: address (line-clamp) + status badge */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-foreground tracking-tight line-clamp-2 leading-snug min-w-0">
              {c.address}
            </p>
            {c.status && (
              <span
                className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusCls}`}
              >
                {c.status}
              </span>
            )}
          </div>

          {/* Row 2: ID · date · inspector · category | action buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 flex-wrap">
            {/* Left meta — font-mono ID, then plain-text date/inspector/category */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {c.complaintid && (
                <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                  #<span className="text-foreground">{c.complaintid}</span>
                </span>
              )}
              {c.date_entered && (
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                  {new Date(c.date_entered + "T00:00:00").toLocaleDateString()}
                </span>
              )}
              {c.assigned_to && (
                <span className="text-[11px] text-muted-foreground/70 truncate max-w-[120px]">
                  · {c.assigned_to}
                </span>
              )}
              {c.category && c.category.length > 0 && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                  · {c.category.slice(0, 1).join(", ")}
                </span>
              )}
            </div>

            {/* Right: location + quick-action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {c.location ? (
                <button
                  type="button"
                  onClick={handleViewLocation}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  Location
                </button>
              ) : !c.location && onLinkLocation ? (
                <button
                  type="button"
                  onClick={handleLinkLocation}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  Link Location
                </button>
              ) : null}

              {quickAction && onQuickAction && (
                <button
                  type="button"
                  onClick={handleQuickAction}
                  disabled={actionLoading}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3" />
                  )}
                  {quickAction.label}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ComplaintListItem;
