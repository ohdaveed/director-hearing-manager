import { Calendar } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import SectionHeader from "./SectionHeader";

type HearingItem = {
  id: string;
  address?: string;
  complaintid?: string;
  hearing_date?: string;
  hearing_status?: string;
};

type Props = {
  hearings: HearingItem[];
  today: Date;
};

export default function UpcomingHearingsPanel({ hearings, today }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <SectionHeader
        icon={<Calendar className="w-4 h-4" />}
        title="Upcoming Hearings (14 days)"
      />
      {hearings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hearings scheduled in the next 14 days.
        </p>
      ) : (
        <div className="space-y-2">
          {hearings.map((c) => {
            const daysOut = Math.round(
              (new Date(c.hearing_date! + "T00:00:00").getTime() -
                today.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                  daysOut <= 3
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-muted/40 border-border"
                }`}
              >
                <div
                  className={`text-center w-10 shrink-0 ${daysOut <= 3 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  <p className="text-lg font-black tabular-nums leading-none">
                    {daysOut}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide">days</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {c.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.complaintid && (
                      <span className="font-mono">#{c.complaintid} · </span>
                    )}
                    {formatDate(c.hearing_date)}
                  </p>
                </div>
                <span className="text-xs text-accent-foreground bg-accent/40 px-1.5 py-0.5 rounded-full shrink-0">
                  {c.hearing_status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
