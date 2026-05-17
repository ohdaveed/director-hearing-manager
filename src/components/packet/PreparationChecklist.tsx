import {
  differenceInDays,
  parseISO,
  subDays,
  format,
  startOfMonth,
  getDay,
  addDays,
} from "date-fns";
import { CheckCircle2, AlertTriangle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChecklistCompletion } from "@/types/packet";

function getFirstWednesdayOfCurrentMonth(): Date {
  const today = new Date();
  const first = startOfMonth(today);
  // Wednesday = 3
  const dayOfWeek = getDay(first);
  const daysUntilWed = (3 - dayOfWeek + 7) % 7;
  return addDays(first, daysUntilWed);
}

interface PreparationChecklistProps {
  hearingDate?: string;
  completion: ChecklistCompletion;
  onToggle: (id: number) => void;
}

export function PreparationChecklist({
  hearingDate,
  completion,
  onToggle,
}: PreparationChecklistProps) {
  const today = new Date();
  const hDate = hearingDate ? parseISO(hearingDate + "T00:00:00") : null;
  const firstWed = getFirstWednesdayOfCurrentMonth();

  const milestones = hDate
    ? [
        {
          id: 0,
          label: "Post Notice of Hearing",
          detail: "14 calendar days before hearing",
          deadline: subDays(hDate, 14),
        },
        {
          id: 1,
          label: "Mail & email Notice + NOV to all parties",
          detail: "14 days — regular + certified mail required",
          deadline: subDays(hDate, 14),
        },
        {
          id: 2,
          label: "Senior staff review (1st Wednesday of month)",
          detail: format(firstWed, "MMM d"),
          deadline: firstWed,
        },
        {
          id: 3,
          label: "Mail signed packet to all parties",
          detail: "5 days before hearing",
          deadline: subDays(hDate, 5),
        },
        {
          id: 4,
          label: "Email packet to hearing coordinator",
          detail: "5 days before hearing",
          deadline: subDays(hDate, 5),
        },
        {
          id: 5,
          label: "Submit final re-inspection report",
          detail: "24 hours before hearing",
          deadline: subDays(hDate, 1),
        },
      ]
    : [];

  const completed = milestones.filter((m) => completion[m.id]).length;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Preparation Checklist
          </h3>
        </div>
        {hDate && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {completed} of {milestones.length} complete
          </span>
        )}
      </div>

      {!hDate ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          Set a hearing date to see SOP deadline milestones.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {milestones.map((m) => {
            const isDone = !!completion[m.id];
            const daysUntil = differenceInDays(m.deadline, today);
            const isOverdue = daysUntil < 0 && !isDone;

            return (
              <Button
                key={m.id}
                type="button"
                variant="ghost"
                className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${isOverdue ? "bg-destructive/5" : ""}`}
                onClick={() => onToggle(m.id)}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {m.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Due {format(m.deadline, "MMM d")} — {m.detail}
                    {isOverdue
                      ? ` — ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue`
                      : ""}
                  </p>
                </div>
                {isDone && (
                  <span className="text-xs text-primary font-medium flex-shrink-0">
                    ✓ Done
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
