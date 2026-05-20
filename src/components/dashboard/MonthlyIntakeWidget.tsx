import { TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type MonthlyItem = {
  month: string;
  count: number;
};

type Props = {
  months: MonthlyItem[];
  maxCount: number;
  today: Date;
};

export default function MonthlyIntakeWidget({ months, maxCount, today }: Props) {
  return (
    <Card>
      <CardHeader className="p-5 pb-0">
        <SectionHeader
          icon={<TrendingUp className="w-4 h-4" />}
          title="Monthly Intake (Last 6 Months)"
        />
      </CardHeader>
      <CardContent className="p-5 pt-3">
        <div className="flex items-end gap-2 sm:gap-3" style={{ height: 100 }}>
          {months.map((m) => {
            const pct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
            const isCurrentMonth =
              m.month ===
              today.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              });
            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1 group"
                title={`${m.month}: ${m.count}`}
              >
                <span
                  className={`text-xs font-bold tabular-nums transition-colors ${isCurrentMonth ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {m.count > 0 ? m.count : ""}
                </span>
                <div className="w-full flex items-end flex-1">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isCurrentMonth
                        ? "bg-primary opacity-90"
                        : "bg-muted-foreground/25 group-hover:bg-muted-foreground/40"
                    }`}
                    style={{
                      height: `${Math.max(pct, m.count > 0 ? 6 : 0)}%`,
                      minHeight: m.count > 0 ? 4 : 0,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-nowrap">
                  {m.month.replace(" ", "\u00A0")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
