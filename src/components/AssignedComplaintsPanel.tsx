import { useQuery } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { FileEdit, FilePlus, AlertCircle, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COMPLAINT_STATUS_THEME } from "@/utils/badgeThemes";
import { sanitizeText } from "@/utils/sanitizeText";
import { Database } from "@/types/database";

import { SectionHeader } from "@/components/ui/section-header";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];

type Props = {
  inspector: string;
  onSelectComplaint: (complaint: Complaint) => void;
};

export default function AssignedComplaintsPanel({ inspector, onSelectComplaint }: Props) {
  const { data: complaints = [], isLoading: loading } = useQuery({
    queryKey: ["complaints", "assigned", inspector],
    queryFn: () => complaintService.getAll({ assigned_to: inspector }),
    enabled: !!inspector,
  });

  if (loading) {
    return (
      <Card className="shadow-sm overflow-hidden mb-6">
        <SectionHeader icon={<ClipboardList />} title="Assigned Complaints" />
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4 flex items-start justify-between gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (complaints.length === 0) {
    return (
      <Card className="p-5 mb-6 text-center text-muted-foreground text-sm shadow-sm">
        <AlertCircle className="mx-auto mb-1 opacity-50" />
        No open complaints assigned to <strong>{inspector}</strong>. You can still fill out the form
        manually below.
      </Card>
    );
  }

  return (
    <Card className="shadow-sm overflow-hidden mb-6">
      <SectionHeader
        icon={<ClipboardList />}
        title="Assigned Complaints"
        count={complaints.length}
      />
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {complaints.map((c) => {
          const statusCls =
            COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME] ??
            "bg-muted text-muted-foreground";
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
                      <span className="text-[10px] font-mono font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                        #{c.complaintid}
                      </span>
                    )}
                    {c.status === "Inspection Scheduled" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning uppercase tracking-tight">
                        <FileEdit className="size-3" /> Scheduled
                      </span>
                    )}
                    {c.status === "New" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        <FilePlus className="size-3" /> New
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {c.address}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                      &ldquo;{sanitizeText(c.description)}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                  {c.status && (
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] h-4.5 px-1.5 font-bold border-none shadow-none", statusCls)}
                    >
                      {c.status}
                    </Badge>
                  )}
                  {c.category && c.category.length > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {c.category[0]}
                      {c.category.length > 1 && ` +${c.category.length - 1}`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
