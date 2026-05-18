import { BarChart3 } from "lucide-react";
import { MetricProgress } from "@/components/ui/metric-progress";
import { SectionHeader } from "@/components/ui/section-header";

type StatusItem = {
  status: string;
  count: number;
};

type Props = {
  statuses: StatusItem[];
  maxCount: number;
};

export default function StatusDistributionWidget({
  statuses,
  maxCount,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <SectionHeader
        icon={<BarChart3 className="w-4 h-4" />}
        title="Status Distribution"
      />
      <div>
        {statuses.map((s) => (
          <MetricProgress
            key={s.status}
            label={s.status}
            value={s.count}
            max={maxCount}
          />
        ))}
      </div>
    </div>
  );
}
