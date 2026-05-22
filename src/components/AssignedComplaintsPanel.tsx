import { useQuery } from "@tanstack/react-query";
import { complaintService } from "@/services/complaintService";
import { FileEdit, FilePlus, ClipboardList, ChevronRight } from "lucide-react";
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
            <div key={i} className="px-5 py-4 flex items-start justify-between gap-3 animate-pulse">
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
      <Card className="p-8 mb-6 text-center text-muted-foreground shadow-sm bg-muted/20 border-none">
        <div className="size-10 rounded-full bg-background border border-border flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="size-5 text-success/60" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-60">All Caught Up</p>
        <p className="text-[11px] mt-1 max-w-[200px] mx-auto font-medium leading-relaxed">
          No open complaints currently assigned to you.
        </p>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm overflow-hidden mb-6 border-muted/60 transition-all duration-300 hover:shadow-md">
      <SectionHeader
        icon={<ClipboardList />}
        title="Assigned Complaints"
        count={complaints.length}
      />
      <div className="divide-y divide-border/40 max-h-72 overflow-y-auto feed-scroll">
        {complaints.map((c) => {
          const statusCls =
            COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME] ??
            "bg-muted text-muted-foreground";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectComplaint(c)}
              className="w-full text-left px-5 py-3.5 min-h-[44px] hover:bg-muted/50 active:bg-muted/70 active:scale-[0.99] transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {c.legacy_complaint_id && (
                      <span className="text-[10px] font-mono font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 backdrop-blur-sm">
                        #{c.legacy_complaint_id}
                      </span>
                    )}
                    {c.status === "Inspection Scheduled" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-warning uppercase tracking-widest">
                        <FileEdit className="size-3" /> Scheduled
                      </span>
                    )}
                    {c.status === "New" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <FilePlus className="size-3" /> New
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                    {c.address}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic opacity-70 group-hover:opacity-100 transition-opacity">
                      &ldquo;{sanitizeText(c.description)}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                  {c.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 px-2 font-black uppercase tracking-widest border-none shadow-none transition-transform group-hover:scale-105 duration-300",
                        statusCls,
                      )}
                    >
                      {c.status}
                    </Badge>
                  )}
                  <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
