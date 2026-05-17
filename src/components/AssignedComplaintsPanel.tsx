import { useQuery } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { FileEdit, FilePlus, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPLAINT_STATUS_THEME } from "@/utils/badgeThemes";
import { sanitizeText } from "@/utils/sanitizeText";

type Complaint = any; // Properly type later

type Props = {
  inspector: string;
  onSelectComplaint: (complaint: Complaint) => void;
};

export default function AssignedComplaintsPanel({
  inspector,
  onSelectComplaint,
}: Props) {
  const { data: complaints = [], isLoading: loading } = useQuery({
    queryKey: ["complaints", "assigned", inspector],
    queryFn: () => complaintService.getAll({ assigned_to: inspector }),
    enabled: !!inspector,
  });

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-muted/30 border-b border-border">
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-5 py-4 flex items-start justify-between gap-3"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 mb-6 text-center text-muted-foreground text-sm">
        <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-50" />
        No open complaints assigned to <strong>{inspector}</strong>. You can
        still fill out the form manually below.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">
          Assigned Complaints — {complaints.length} open
        </h3>
        <span className="text-xs text-muted-foreground">
          Select to start or resume an inspection
        </span>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {complaints.map((c) => {
          const statusCls =
            COMPLAINT_STATUS_THEME[
              c.status as keyof typeof COMPLAINT_STATUS_THEME
            ] ?? "bg-muted text-muted-foreground";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectComplaint(c)}
              className="w-full text-left px-5 py-3.5 min-h-[44px] hover:bg-muted/40 active:bg-muted/60 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {c.complaintid && (
                      <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        #{c.complaintid}
                      </span>
                    )}
                    {c.draft_inspection_id && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                        <FileEdit className="w-3 h-3" /> Draft in progress
                      </span>
                    )}
                    {!c.draft_inspection_id && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <FilePlus className="w-3 h-3" /> New inspection
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {c.address}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {sanitizeText(c.description)}
                    </p>
                  )}
                  {c.reinspection_due_on_after && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reinspection due:{" "}
                      {new Date(
                        c.reinspection_due_on_after,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {c.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusCls}`}
                    >
                      {c.status}
                    </span>
                  )}
                  {c.category && c.category.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {c.category.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
