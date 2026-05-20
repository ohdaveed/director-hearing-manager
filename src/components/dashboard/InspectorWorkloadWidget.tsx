import { Users } from "lucide-react";
import { MetricProgress } from "@/components/ui/metric-progress";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type InspectorData = {
  name: string;
  count: number;
  overdue: number;
};

type Props = {
  inspectors: InspectorData[];
  maxCount: number;
};

export default function InspectorWorkloadWidget({ inspectors, maxCount }: Props) {
  return (
    <Card>
      <CardHeader className="p-5 pb-0">
        <SectionHeader icon={<Users className="w-4 h-4" />} title="Inspector Workload" />
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {inspectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active assignments.</p>
        ) : (
          <div className="space-y-4">
            {inspectors.map((i) => (
              <div key={i.name}>
                <MetricProgress
                  label={i.name.replace(" (DPH)", "")}
                  value={i.count}
                  max={maxCount}
                  accent={i.overdue > 0 ? "red" : "blue"}
                />
                {i.overdue > 0 && (
                  <p className="text-[10px] text-destructive text-right -mt-0.5 mb-1 pr-0.5">
                    {i.overdue} overdue
                  </p>
                )}
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1">
              Red bars indicate inspector has overdue cases.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
