import { BarChart3 } from "lucide-react";
import { MetricProgress } from "@/components/ui/metric-progress";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type StatusItem = {
  status: string;
  count: number;
};

type Props = {
  statuses: StatusItem[];
  maxCount: number;
};

export default function StatusDistributionWidget({ statuses, maxCount }: Props) {
  return (
    <Card>
      <CardHeader className="p-5 pb-0">
        <SectionHeader icon={<BarChart3 className="w-4 h-4" />} title="Status Distribution" />
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="space-y-4">
          {statuses.map((s) => (
            <MetricProgress key={s.status} label={s.status} value={s.count} max={maxCount} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
